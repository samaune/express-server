import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compress from "compression";
import methodOverride from "method-override";
import cors from "cors";
import helmet from "helmet";

import api_routes from "../api/index.js";
import resquel from "../lib/index.js";
import config from "../config/index.js";
import passport from "../services/passport.js";
import fileUpload from "express-fileupload";
import hbs from 'hbs';
const __dirname = config.__dirname;

const app = express();
app.set('view engine', 'hbs');
app.set('views', './views')


// Choose what fronten framework to serve the dist from
const distDir = "../client/dist/browser/";

app.use(express.static(path.join(__dirname, distDir)));
app.use("/json/*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  // res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  if (req.baseUrl.endsWith(".json")) {
    res.sendFile(`${path.join(__dirname, distDir, "assets/", req.baseUrl)}`);
  } else if (req.baseUrl) {
    res.sendFile(
      `${path.join(__dirname, distDir, "assets/", req.baseUrl)}.json`
    );
  } else {
    next();
  }
});

app.use(/^((?!(api)).)*/, (req, res) => {
  res.sendFile(path.join(__dirname, distDir + "/index.html"));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());
app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

app.use(passport.initialize());

Object.keys(config.db).forEach(name => {
  resquel.routes(config, name).then((db_route) => {
    app.use(db_route);
  });
});

//app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use("/api/", api_routes);

// catch 404 and forward to error handler
// app.use((req, res, next) => {
//   const err = new httpError(404);
//   return next();
// });

// error handler, send stacktrace only during development
app.use((err, req, res, next) => {
  if (err.isJoi) {
    err.message = err.details.map((e) => e.message).join("; ");
    err.status = 400;
  }

  res.status(err.status || 500).json({
    message: err.message,
  });
  next(err);
});

export default app;
