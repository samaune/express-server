import { ReportService, ReportExecution, ReportExecutionUrl } from 'mssql-ssrs';
import repo from "../lib/database/mssql.js";
import connConfig from "../config/index.js";

const url = connConfig.ssrs.server;
const config = { ...connConfig.ssrs.login };
let ssre = new ReportExecution();

let _repo = new repo(connConfig, 'noa');


async function executeQuery(sql) {  
  console.log('sql = ', sql);
  // const db_ctx = _repo.connect();
  // const request = new db.Request(db_ctx);
  const result = await _repo.exec_query(sql);
  return result.recordset;
}

async function querySingle(sql) {
  const result = await executeQuery(sql);
  return result.pop();
}


async function audit_log(username, ip , data) {
  const json_data = JSON.stringify(data);
  return executeQuery(
    `EXEC [audit].[export_xlsx] @json_data = '${json_data}', @username = '${username}', @ip = '${ip}'`
  );
};

async function exportPdfXls(reportPath = null, parameters = null, opts = null) {
  await ssre.start(url, config);
  const fileType = opts.fileType;
  await audit_log(opts.username, opts.ip, {
    reportPath,
    fileType,
    ...parameters
  });
  const report = await ssre.getReport(
    reportPath,
    fileType,
    parameters
  );
  return report[0].Result;
}

export default {
  exportPdfXls,
  querySingle,
  executeQuery
};
