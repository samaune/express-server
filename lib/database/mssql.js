"use strict";

import _ from "lodash";
import db from "./mssql-multi-pool.js";
import util from "../resquel/util.js";
import SQL_STR_ENDPOINT from "./sqlquery.js";

export default function (config, ctx_name = 'default') {
  let pool = {
    // database context
  };
  const conf = config.db[ctx_name];
  const get_pool = async () => {
    try{
      console.log(`Database connected to [${conf.server} - ${conf.database}]`);
      pool = await db.connect(conf);
      // pool = await Singleton.getPool(conf);
    } catch (err) {
      console.log('Error - connection,', err);
    }
    return pool;
  };

  const initCfgData = async () => {
    const pool = await get_pool();
    const { recordset } = await pool.Request().query(SQL_STR_ENDPOINT);
    //console.log(ctx_name, recordset.pop());
    return util.toCamel(recordset);
  };

  const storeproc = async (query, output_params = []) => {
    const pool = await get_pool();
    const request = await pool.request();
    output_params.forEach(p => {
      request.output(p, db.Int);
    });
    try{
      const { output, recordsets } = await request.query(query);
      let data = [];
      let columns = [];
      if (recordsets) {
        const last_index = recordsets.length - 1;
        if(last_index > 0){
          columns = util.decodeJson(results[0]);
        }
        data = util.toCamel(results[last_index]);
      }

      return _.assign(
        {
          status: 200,
          data: "OK",
          columns: columns,
          return: output,
        },
        { list: data }
      );
    } catch (err) {
      console.log(`exec storeproc failure: `, err);
    }
  };

  /**
   * Issue a SQL request to the connection.
   *
   * @param {string} query
   *   The SQL query to execute.
   */
  async function exec_query(query) {
    const pool = await get_pool();
    const request = await pool.request();
    return request.query(query);
  };

  /**
   * Perform the paging.
   *
   * @param {string} paging
   *   The SQL query to execute.
   */
  async function paging(q, q_count) {
    try{
      const { recordset } = await exec_query(q);
      let total_count = await count(q_count) || recordset?.length || 0;
      let data = [];
      
      if (recordset && recordset.length > 0) {
        data = util.toCamel(recordset);
      }

      return _.assign(
        {
          status: 200,
          data: data,
          total: total_count
        }
      );
    } catch(err) {
      throw err;
    };
  };

  /**
   * Perform the query.
   *
   * @param {string} query
   *   The SQL query to execute.
   */
  var query = async function query(query) {
    try{
      const { recordset } = await exec_query(query);
      return {
        status: 200,
        data: recordset
      };
    } catch(err) {
      throw err;
    };
  };

  /**
   * Perform a count query, followed by a regular query so the total results is included.
   *
   * @param {string} count
   *   The SQL query for counting items.
   * @param {string} query
   *   Te SQL query to execute.
   */
  const count = async (q) => {
    try {
      const { recordset } = await exec_query(q);  
      //return await query(q, result.recordset[0]);
      if(recordset && recordset.length > 0){
        return recordset[0]?.count || 0
      }
      return 0;
    } catch (err) {
      throw err;
    }
  };

  const exec = async (query) => {
    try{
      const { recordset } = await exec_query(query);
      return recordset;
    } catch(err) {
      throw err;
    };
  };

  return {
    get_pool: get_pool,
    init: initCfgData,
    paging: paging,
    query: query,
    exec: exec,
    exec_query: exec_query,
    storeproc: storeproc,
    count: count,
  };
};
