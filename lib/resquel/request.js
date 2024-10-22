"use strict";

import Q from "q";
import _ from "lodash";

  
  /**
   * Get the input data from the given request.
   *
   * @param {object} req
   *   The express request object.
   *
   * @returns {object}
   *   The data from the incoming request.
   */
  var getRequestData = function (req) {
    var data = {};
  
    // Start building the core data obj to replace string properties with.
    if (_.has(req, "body")) {
      data = _.assign(data, _.get(req, "body"));
    }
  
    // Let the params have priority over request body data.
    if (_.has(req, "params")) {
      data = _.assign(data, { params: _.get(req, "params") });
    }
  
    // Let the query have priority over request body data.
    if (_.has(req, "query") && !data.query) {
      data = _.assign(data, { query: _.get(req, "query") });
    }
  
    if (_.has(req, "files")) {
      data = _.assign(data, { files: _.get(req, "files") });
    }
    //debug.getRequestData(data);
    return data;
  };
  
  
  /**
   * Check if the current route has a before fn defined, if so, execute it and proceed.
   *
   * @param {object} route
   *   The route object.
   * @param {object} req
   *   The express request object.
   * @param {object} res
   *   The express response object.
   *
   * @returns {Promise}
   */
  var before = async function before(route, req, res) {
    if (!route.hasOwnProperty("before") || typeof route.before !== "function") {
      return Q();
    }
  
    // Ensure they can hook into the before handler.
    route.before(req, res, function (err, result) {
      if (err) {
        throw err;
      }
  
      return result;
    });
  };
  
  /**
   * Check if the current route has a after fn defined, if so, execute it and proceed.
   *
   * @param {object} route
   *   The route object.
   * @param {object} req
   *   The express request object.
   * @param {object} res
   *   The express response object.
   *
   * @returns {Promise}
   */
  var after = async function after(route, req, res) {
    if (!route.hasOwnProperty("after") || typeof route.after !== "function") {
      // Send the result.
      res.status(res.result.status).send(res.result);
      return;
    }
  
    // Ensure they can hook into the after handler.
    route.after(req, res, function (err, result) {
      result = result || res.result;
      if (err) {
        throw err;
      }
  
      // Send the result.
      res.status(result.status).send(result);
      return result;
    });
  };

  function getIp(req){
    // Put user login into data in server to prevent hack from client side
    var raw_ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.socket.remoteAddress;
    const ip = raw_ip.replace('::ffff:', '');
    return ip;
  }

  function extract_payload(req){
      let payload = getRequestData(req);
      const ip = getIp(req);
      
      
      if(req.user){
        payload.params.identity = {
          code: req.user.user_login,
          name: req.user.display_name,
          ip: ip
        };
      }else{
        payload.params.identity = {
          code: payload.username,
          ip: ip
        };
      }
    
      if(payload && payload.query && payload.params){
        payload.params.json_data = JSON.stringify({
          ...payload.query,
          ...payload.data
        });
      }

      console.log('payload', payload);
      return payload;
  }

  export default {
    extract_payload: extract_payload,
    before: before,
    after: after
  };