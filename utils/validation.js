'use strict';

const _ = require('lodash');

module.exports = {
  isValidObjectId: function(val) {
    var regexp = /^[0-9a-fA-F]{24}$/;
    return _.isString(val) && regexp.test(val);
  },
  isValidEmail: function(val) {
    var regexp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return _.isString(val) && regexp.test(val);
  },
  isValidLink: function(val) {
    var regexp = /^http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return _.isString(val) && regexp.test(val);
  },
  isValidHttp: function(val) {
    var regexp = /^http(s)?:\/\/.*/g;
    return _.isString(val) && regexp.test(val);
  },
};
