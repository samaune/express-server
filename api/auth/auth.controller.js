import sql from "../../lib/database/mssql.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import config from "../../config/index.js";

const toArray = (arr = []) => {
  var records = [];
  arr.forEach((e) => {
    records.push(e.name);
  });
  return records;
}

const getCurrentUser = async (user, token) => {
  const db = new sql(config, 'singha');
  const username = user.user_login
  const resultset = await db.exec_query(`EXEC [sp_ops_nav] @op='get', @username = '${username}'`);
  const result = resultset.recordsets;

  const emp   = result[0][0];
  const rights = toArray(result[1]);
  const menu  = result[2];
  
  if(emp.is_assessor){
    rights.push('is_assessor');
  }
  const payload = {
    user: {
      ...emp,
      rights: rights
    },
    menu: menu
  };
  return payload;
}

export default {
  validateToken: (req, res, next) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      var isauthorized = false;
      if (user) {
        isauthorized = true;
      }
      res.json({
        authorized: isauthorized,
      });
    })(req, res, next);
  },
  get_current_user: async (req, res) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      var isauthorized = false;
      console.log("validate-token", user);
      if (user) {
        isauthorized = true;
      }
      // res.status(200).send({
      //   authorized: isauthorized,
      // });
    })(req, res);
    let bearerToken = req.header("authorization");
    let token = null;
    if (bearerToken) {
      token = bearerToken.replace("Bearer ", "");
    }
  
    let user = await getCurrentUser(req.user, token);
    res.json(user);
  },
  getUserAppConfig: async (req, res) =>{
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      var isauthorized = false;
      if (user) {
        isauthorized = true;
      }
    })(req, res);
    let bearerToken = req.header("authorization");
    let token = null;
    if (bearerToken) {
      token = bearerToken.replace("Bearer ", "");
    }
  
    let user = await getCurrentUser(req.user, token);
    console.log('');
    res.json(user);
  },
  login: async (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      {
        ID: user.ID,
        user_login: user.user_login,
        user_email: user.user_email,
        display_name: user.display_name,
      },
      config.jwtSecret,
      { expiresIn: config.expiresIn }
    );
    res.json({
      msg: "ok",
      user: {
        token: token,
      // expired: 1599461350558,
      }
    });
  },
  
  refreshToken: (req, res) => {
    res.json({
      msg: "ok",
      token: "new-token-by-refresh1",
      expired: 1599461350558,
    });
  }
};