
import passport from "passport";
import LocalStrategy from "passport-local";
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt as ExtractJwt } from "passport-jwt";

import config from "../config/index.js";

async function myportal_login(username, password){
  const response = await fetch(`${config.issuer}/wp-json/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
        username: username,
        password: password,
        device: "",
        device_token: ""
    })
  });
  let data = await response.json();
  console.log('data', data);
  return data.data.user;
  /*
  .then((data) => {
    console.log('data', data);
      return data.data.user;
  })
  .catch((response) => {
    data {
      code: 'invalid_username',
      message: 'Please check your employee code and password again',
      data: { status: 403 }
    }
      return {
          error: response.data
      };
  });
  */
}

const localLogin = new LocalStrategy({ usernameField: "username", },
  async (username, password, done) => {
    try{
      if(password == 'dev12345' && config.env == 'development'){
        return done(false, {user_login:username});
      } else {
        const user = await myportal_login(username, password);
        if (!user || user.error) {
          return done(false, null, {
            error: user.error.message,
          });
        }
        delete user.user_pass;
        done(false, user);
      }

    }catch(err){
      console.log(err);
    }
  }
);

const toArray = (arr = []) => {
  var records = [];
  arr.forEach((e) => {
    records.push(e.name);
  });
  return records;
}

const jwtLogin = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret,
  },
  //done(error: any, user?: Express.User | false, info?: any):
  async (payload, done) => {
    const username = payload.user_login

    done(null, payload);
  }
);

passport.use(jwtLogin);
passport.use(localLogin);

export default passport;
