import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 
global.APP_PATH = __dirname;
import config from "./config/index.js";
import app from "./middleware/express.js";
import moment from 'moment';

Date.prototype.toJSON = function(){ 
  return moment.utc(this).format('YYYY-MM-DDTHH:mm:ss'); 
}

app.listen(config.port, () => {
  console.info(`http server started on port ${config.port} (${config.env})`);
});
export default app;