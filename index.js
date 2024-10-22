const sql_str_enpoint = `
SELECT TOP(1) ('[' + [schema_name] +'].[' + [table_name] + ']') [object_name]
    ,CONCAT(
        CASE WHEN [schema_name] = 'dbo' THEN [route_name] ELSE LOWER([schema_name] + '-' + [route_name]) END 
        ,
        CASE WHEN m.[value] IN ('GET', 'POST') THEN '' ELSE '/:id' END
    ) [endpoint]
    ,REPLACE(m.[value], 'GET_BY_ID', 'GET') [method]
    ,[anonymous]
    ,CASE WHEN m.[value] IN ('GET_BY_ID') THEN 1 ELSE 0 END [single]
    ,[is_deleted]
FROM (
    SELECT SCHEMA_NAME(schema_id) [schema_name]
        ,t.[name] [table_name]
        ,REPLACE(t.[name], '_', '-') [route_name]
        ,'crud' [method]
        ,1 [anonymous]
        ,CASE WHEN c.[object_id] IS NULL THEN NULL ELSE '' + c.[name] + '' END [is_deleted]
    FROM [sys].[tables] t
    LEFT JOIN (
        SELECT [object_id], [name] FROM [sys].[all_columns] WHERE [name] IN ('DeletedOn', 'deleted_dt')
    ) c ON c.[object_id] = t.[object_id]
) t, string_split('GET|GET_BY_ID|POST|PUT|DELETE', '|') m
`;

import path from 'path';
import moment from 'moment';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 
global.APP_PATH = __dirname;
global.DB_ENDPOINT = [];
Date.prototype.toJSON = function(){ 
  return moment.utc(this).format('YYYY-MM-DDTHH:mm:ss'); 
}

import { Keyv } from 'keyv';
import { createCache } from 'cache-manager';


import config from "./config/index.js";
import app from "./middleware/express.js";
import sql from "mssql";

// Single store which is in memory
const keyv = new Keyv();
const cache = createCache({
  stores: [keyv],
  // ttl: 10000,
  // refreshThreshold: 3000,
})

const appPool = new sql.ConnectionPool(config.db.singha)
const server = async () => {
  try {
    app.locals.db = await appPool.connect();
    
      const { recordset } = await app.locals.db.query(sql_str_enpoint)
      if(recordset){
        for (const data of recordset) {
          await cache.set(`${data.method}-${data.endpoint}`, data)
        }
      }
      const list = await keyv.opts.store;
    //const cval = await keyv.get('GET-navigation');
    console.log('cval', list);
    const server = app.listen(config.port, () => {
      const host = server.address().address
      const port = server.address().port
      console.log('Expressjs service listening at http://%s:%s', host, port)
    });
  } catch (err) {
    console.error('Error creating connection pool', err)
  }
}

export default server();