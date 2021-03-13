'use strict';

const snowflake = require('./lib/snowflake').app;

module.exports = agent => {
  if (agent.config.snowflake.agent) snowflake(agent);
};
