"use strict";

import express from "express"
import method_override from "method-override"

import _ from "lodash"
let router = express.Router();
import passport from "passport";
import body_parser from "body-parser";

import db_query from "./query.js";
import db_context from "../database/mssql.js";
import request from "./request.js";
import security from "./security.js";

async function build_route(ctx_name, route, callback) {
  var method = route.method;
  if (route.anonymous === 1) {
    router[method.toString().toLowerCase()](
      `/api/${ctx_name}/${route.endpoint}`,
      async (req, res) => {
        callback(req, res);
      }
    );
  } else {
    router[method.toString().toLowerCase()](
      `/api/${ctx_name}/${route.endpoint}`,
      passport.authenticate("jwt", { session: false }),
      async (req, res) => {
        callback(req, res);
      }
    );
  }
}

export default {
  routes: async (config, ctx_name) => {
    const ctx = new db_context(config, ctx_name);
    const endpoints = await ctx.init();

    security.basic_auth(router);
    // Add Middleware necessary for REST API's
    router.use(body_parser.urlencoded({ extended: true }));
    router.use(body_parser.json());
    router.use(method_override("X-HTTP-Method-Override"));

    router['get'](
      `/api/${ctx_name}/ps/:store_proc/:op`,
      async (req, res) => {
        let payload = request.extract_payload(req);
        const result = {
          object_name: '[xmpp].[users]',
          endpoint: 'xmpp-users/:id',
          method: 'GET',
          anonymous: 1,
          query: null,
          count: null,
          single: 1,
          is_deleted: null
        };
        res.status(200).send(payload);
        return;
      }
    );
    
    endpoints.forEach(function (route) {
      //console.log('route.endpoint', route.endpoint);
      build_route(ctx_name, route, async (req, res) => {
        let payload = request.extract_payload(req);
        try {
          await request.before(route, req, res);
          let result = {};
          if (route.method == "GET") {
            let data = payload.query;
            const is_paging = !!(data.pi && data.ps);
            if(is_paging){
              const {query, count} = db_query.get_query_paging(route, payload);
              result = await ctx.paging(query, count);
            }else{
              const query = db_query.get_query_string(route, payload);
              result = await ctx.query(query);
            }
          }else{
            const query = db_query.get_query_trans(route, payload);
            result = await ctx.exec(query);
          }
          res.result = result;
          return await request.after(route, req, res);
        } catch(err) {
          console.log(err);
          //return res.status(204).json({});
          return res.status(500).send(err.message || err);
        }

      });
    });
    return router;
  }
};
