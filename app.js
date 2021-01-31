'use strict';

const snowflake = require('./lib/snowflake');

module.exports = app => {
  if (app.config.snowflake.app) snowflake(app);
};
