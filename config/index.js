import _ from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
_.config();

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 

const env = process.env;
const mssql_conf = {
  port: 1433,
  type: "mssql",
  requestTimeout: 60000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
}

export default {
  __dirname: path.join(__dirname, '..'),
  env: env.NODE_ENV,
  port: env.SERVER_PORT,
  issuer: env.JWT_ISSUER,
  jwtSecret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRED_IN,
  uploadPath: env.UPLOAD_PATH,
  smtp: {
    host: 'webmail.singha.app',
    port: 25,
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
    }
  },
  auth: {
    // basic: {
    //   users: { 
    //     "admin": ""
    //   }
    // }
  },
  db: {
    singha: {
      server: env.MSSQL_HOST || "172.20.160.1",
      database: env.MSSQL_DB,
      user: env.MSSQL_USERNAME || 'sa',
      password: env.MSSQL_PASSWORD,
      ...mssql_conf
    },
    noa: {
      server: env.MSSQL_HOST || "172.20.160.1",
      database: 'NOA',
      user: env.MSSQL_USERNAME || 'sa',
      password: env.MSSQL_PASSWORD,
      ...mssql_conf
    },
  },
  ssrs: {
    server: env.SSRS_URL || "",
    login: {
      username: env.SSRS_USER || "", 
      password: env.SSRS_PASSWORD || ""
    }
  },
  s3: {
    endpoint: env.S3_ENDPOINT || "",
    region: 'us-east-1',
    accessKeyId: env.S3_ACCESS_KEY || "", 
    secretAccessKey: env.S3_SECRET_KEY || "",
    sslEnabled: false,
    s3ForcePathStyle: true,
  }
};
