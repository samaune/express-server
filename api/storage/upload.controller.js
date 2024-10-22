import fs from "fs";
import moment from "moment";
import config from "../../config/index.js";
import { join } from "path";

// Start - Minio Object Storage
import AWS from "aws-sdk";
import https from 'https';

const upload_path = "./photo";

AWS.NodeHttpClient.sslAgent = new https.Agent({ 
    rejectUnauthorized: false
});
const AWS_S3_BUCKET_NAME = 'emp-photo';
const s3 = new AWS.S3({
    ...config.s3,
    params: { Bucket: AWS_S3_BUCKET_NAME }
});

// End - Minio Object Storage

const getFileExt = (fileName) => fileName.substr(fileName.lastIndexOf('.') + 1, fileName.length);
const getFilePath = function(fileName) {
  return join(config.uploadPath, fileName);
} 



async function uploadXlsx(res, req) {
  const file = req.files.file;
  const data = req.body;
  const ext = getFileExt(file.name);
  const file_name = `${data.emp_code}-${moment().format("YYYYMMDDhhmmss")}.${ext}`;

  try{
    const uploadPath = join(config.uploadPath, data.object_name);
  

    if (!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath, { recursive: true });
    }
  
    const params = {
      origin_file_name: file.name,
      file_name: file_name,
      emp_code: data.emp_code,
      object_name: data.object_name
    };
    
    await fs.writeFileSync(join(uploadPath, file_name), file.data, "binary");
    //const result = await execExcelData('upload', params);
    return res.status(200).send({
      data: params
    });
  }
  catch(error){
    return res.status(200).send({
      error: error
    });
  }
}

function upload(res, req) {
  const file = req.files.file;
  const body = req.body;
  const ext = getFileExt(file.name);
  const diskFileName = `${body.empNo}-${moment().format("YYYYMMDDhhmmss")}.${ext}`;
  const uploadFilePath = getFilePath(diskFileName);
  
  fs.writeFile(uploadFilePath, file.data, "binary", function (error) {
      if(error) {
        res.status(400).send(error);
      } else {
        const params = {
          fileName: file.name,
          diskFileName: diskFileName
        };
        
        res.status(200).send(params);
      }
    }
  );
}

function download(res, fileName) {
  const filePath = getFilePath(fileName);
  res.download(filePath);
}

async function get_object(req, res) {
  const f_name = req.params.f_name;
  console.log('f_name', f_name);
  if(f_name) {
      //console.log('f_name', f_name);
      await s3.getObject({ "Key": f_name }, function (err, data) {
          if (err){
              fs.readFile(`./assets/avatar.png`, (e, buffer) => {
                  res.set("Content-Type", "image/png");
                  res.send(buffer);               
              });
          }else{
              res.set("Content-Type", "image/jpeg");
              res.send(data.Body);       
          }
      });
  }else{
      console.log('fail download');
  }
}


function remove(res, fileName) {
  const filePath = getFilePath(fileName);
  try {
    fs.unlinkSync(filePath);
    res.status(200).send(true);
  } catch(e) {
    res.status(400).send(false);
  }
}

export default {
  download,
  remove,
  upload,
  uploadXlsx,
  get_object
};
