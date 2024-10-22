import express from "express";
import passport from "passport";
import asyncHandler from "express-async-handler";
import uploadController from "./upload.controller.js";

const router = express.Router();

router.use(passport.authenticate("jwt", { session: false }));
router.post("/excel", uploadXlsxFile);
router.route("/upload-file").post(uploadFile);
router.route("/download-file/:fileName").get(downloadFile);
router.get('/emp/:f_name', async(req, res, next) => await uploadController.get_object(req, res));

async function uploadXlsxFile(req, res) {
  return await uploadController.uploadXlsx(res, req);
}
function uploadFile(req, res) {
  uploadController.upload(res, req);
}

function downloadFile(req, res) {
  const fileName = req.params.fileName;
  uploadController.download(res,fileName);
}

function removeFile(req, res) {
  const fileName = req.params.fileName;
  uploadController.remove(res,fileName);
}

export default router;
