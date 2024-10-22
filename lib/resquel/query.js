
import _ from "lodash";
const KEY_WORDS = ["orderby","_orderby"];
const DATA_TYPE = {
    datetime: 'datetime',
    number: 'number',
    string: 'string',
    boolean: 'boolean'
};


/**
 * Create anonymous function to sanitize user input for sql query injection.
 *
 * @param {object} data
 *   The request data object.
 *
 * @returns {Function}
 *   The function to replace the data in the query.
 */
const getQueryString = function (data) {
  return function () {
    var value = "";
    var args = Array.prototype.slice.call(arguments);

    if (!(args instanceof Array) || args.length < 2) {
      return value;
    }

    // Get the token for replacement.
    value = _.get(data, args[1]);

    // Make sure we only set the strings or numbers.
    switch (typeof value) {
      case "string":
        return escape(value);
      case "number":
        return value;
      case "object": 
        return {}
      default:
        return "";
    }
  };
};
const regexp_params = (sql_query, payload) => sql_query?.replace(/{{\s+([^}]+)\s+}}/g, getQueryString(payload));
/**
 * Escape a string for SQL injection.
 *
 * @param {string} query
 *   The SQL query to sanitize.
 *
 * @returns {string}
 *   The escaped query.
 */
const escape = function (query) {
    return query.replace(/[\0\\\'\"\x1a]/g, function (s) {
      // eslint-disable-line no-control-regex
      switch (s) {
        case "\0":
          return "\\0";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case "\b":
          return "\\b";
        case "\t":
          return "\\t";
        case "\x1a":
          return "\\Z";
        case "'": {
          return "''";
        }
        default:
          return s;
      }
    });
};
const buildOrderBy = (data) => {
    var orderby = "id";
    var direction = "DESC";
    if (data.orderby) {
        if (data.orderby.startsWith("_")) {
        direction = "DESC";
        orderby = data.orderby.replace("_", "");
        } else {
        orderby = data.orderby;
        }
    }
    return `ORDER BY (${orderby}) ${direction}`;
};

function getDataType(value) {
    const dt_reg = /^(\d{4})\-(\d{2})\-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/g;
    if (dt_reg.test(value) || isNaN(Date.parse(value)) == false) {
      return DATA_TYPE.datetime;
    } else {
      return (typeof value);
    }
}

function getDataField(value) {
    let data_type = getDataType(value);
    if (data_type === DATA_TYPE.string) {
        return `'${escape(value)}'`;
    } else if (data_type === DATA_TYPE.datetime) {
        return `'${escape(value.replace("T", " ").replace("Z", ""))}'`;
    } else if (data_type === DATA_TYPE.boolean) {
        return (value ? 1 : 0);
    } else { // DATA_TYPE: number
        return value;
    }
}

function getRequestData(payload){
  let _payload = _.clone(payload);
  delete _payload.query; delete _payload.params;
  const data = _payload.data || _payload;
  return data;
}



function buildCriteria(data) {
    let fieldsVals = [];
    Object.keys(data).forEach(function eachKey(key) {
      let value = data[key];
      if (KEY_WORDS.indexOf(key) === -1) {
        switch (true) {
          case key.startsWith("_"): // advance search
            key = key.replace("_", "");
            if (value.startsWith("%") || value.endsWith("%")) {
              fieldsVals.push(`[${key}] LIKE '${escape(value)}'`);
            } else {
              fieldsVals.push(`[${key}] = '${value}'`);
            }
            break;
          default:
            fieldsVals.push(`[${key}] LIKE '%${escape(value)}%'`);
        }
      }
    });
    return fieldsVals;
}

function get_query_string(route, payload){
  let { query } = route;
  // query by id
  if(route.single && payload.params){ 
    query = `SELECT * FROM ${route.object_name} WHERE [id] = {{ params.id }}`;
  }else{
    let data = payload.query;
    let sort = buildOrderBy(data);
    let conditions = buildCriteria(data);
    
    const is_deleted = route.is_deleted?`${route.is_deleted} IS NULL`:'';
    let where = "";
    if (conditions.length > 0) {
        where = `WHERE ${is_deleted} AND (${conditions.join(` ${escape("OR")} `)})`;
    } else {
        where = `WHERE ${is_deleted}`;
    }

    let top = "";
    if(data._single){
      top = "TOP(1) ";
    }
    query = `SELECT ${top}* FROM ${route.object_name} ${where} ${sort}`;
  }
  const query_string = regexp_params(query, payload);
  console.log("QUERY > ", query_string);
  return query_string;
}

function get_query_paging(route, data){
  let where = "";
  let paging = "";
  const is_paging = (data.pi && data.ps);
  let sort = buildOrderBy(data);
  if (is_paging) {
    paging = ` ${sort} OFFSET ${(data.pi - 1) * data.ps} ROWS FETCH NEXT ${data.ps} ROWS ONLY`;
    delete data.pi;
    delete data.ps;
  }

  var fieldsVals = buildCriteria(data);

  const is_deleted = route.is_deleted?`${route.is_deleted} IS NULL`:'';
  if (fieldsVals.length > 0) {
      where = `WHERE ${is_deleted} AND (${fieldsVals.join(` ${escape("OR")} `)})`;
  } else {
      where = `WHERE ${is_deleted}`;
  }

  let count = `SELECT COUNT(*) total FROM ${route.object_name} ${where}`;
  let query = `SELECT * FROM ${route.object_name} ${where} ${paging}`;
  const query_set = {
    count: regexp_params(count, payload), 
    query: regexp_params(query, payload)
  };
  console.log("QUERY > ", query_set);
  return query_set;
}

export default {
    get_query_paging: get_query_paging,
    get_query_string: get_query_string,
    get_query_trans: (route, payload) => {
        let { query } = route;
        if (route.method == "POST") {
            const data = getRequestData(payload);
            let fields = [], values = [];

            Object.keys(data).forEach(function eachKey(key) {
                if (!key.startsWith("_")) {
                    let value = data[key];
                    if(value){
                        const new_value = getDataField(value);
                        fields.push(`\n\t[${key}]`);
                        values.push(`\n\t${new_value} [${key}]`);
                    }
                }
            });
            query = `INSERT INTO ${route.object_name}(${fields.join()}\n) \nSELECT ${values.join()}`;
        } else if (route.method == "PUT") {
            const data = getRequestData(payload);
            let col_vals = [];

            Object.keys(data).forEach(function eachKey(key) {
                if (!key.startsWith("_")) {
                    let value = data[key];
                    let updated_value = value ? getDataField(value): "NULL";
                    col_vals.push(`\n\t[${key}] = ${updated_value}`);
                }
            });

            query = `UPDATE ${route.object_name} SET ${col_vals.join()} \nWHERE [id] = {{ params.id }}`;
        } else if (route.method == "DELETE") {
            if(route.force)
            query = `
            UPDATE ${route.object_name} SET deleted_dt = GETDATE() WHERE id = {{ params.id }}
            INSERT INTO [dbo].[recycle_bin] ([obj_name], [obj_id], [created_by])
            VALUES ('${route.object_name}', {{ params.id }},'{{ data.deleted_by }}')
            `;
            query = `DELETE FROM ${route.object_name} WHERE [id] = {{ params.id }}`;
        }

        const query_string = regexp_params(query, payload);
        console.log("QUERY > ", query_string);
        return query_string;
    }
}