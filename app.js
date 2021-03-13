'use strict';

const snowflake = require('./lib/snowflake').app;

module.exports = app => {
  if (app.config.snowflake.app) snowflake(app);
};
