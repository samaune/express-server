"use strict";

import _ from "lodash";
import debug from "debug";
const _debug = {
  getRequestData: debug("resquel:util:getRequestData")
};

function toCamel(o) {
  var newO, origKey, newKey, value;
  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = toCamel(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = (
          origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey
        ).toString();
        value = o[origKey];
        if (
          value instanceof Array ||
          (value !== null && value.constructor === Object)
        ) {
          value = toCamel(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}

function decodeJson(o) {
  var newO, origKey, value;
  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = decodeJson(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        value = o[origKey];
        try {
          newO[origKey] = JSON.parse(value);
        } catch (e) {
          newO[origKey] = value;
        }
      }
    }
  }
  return newO;
}


export default {
  toCamel: toCamel,
  decodeJson: decodeJson
};
