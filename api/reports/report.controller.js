import reportController from "../../services/report.service.js";
import dateFormat from "dateformat";

export default {
  exportAppraisalFormPdf: async (req, res) => { 
    const id = req.params.id;
    const isAuthorize = true;
    if (isAuthorize) {
      exportPdfXls(
        "/Forms/Appraisal/Form",
        {
          ProcInstId: id,
        },
        "PDF",
        req,
        res
      );
    }
  },
  get_ip: (req) => {
    var raw_ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.socket.remoteAddress;
    return raw_ip.replace('::ffff:', '');
  },
  getTime: () => {
    return dateFormat(new Date(), "yyyymmddhMMssl");
  },
  exportPdfXls: async (reportPath, parameters, fileType, req, res) => {  
    const ip = this.get_ip(req);
    const pdf = await reportController.exportPdfXls(reportPath, parameters, {
      fileType: fileType,
      username: req.user.user_login,
      ip: ip
    });
    const extension = fileType === "EXCEL" ? "xlsx" : "pdf";
    const fileName = `REPORT_${this.getTime()}.${extension}`;
    const contentType =
      fileType === "EXCEL"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    const download = Buffer.from(pdf, "base64");
    res.send(download);
  }
}

