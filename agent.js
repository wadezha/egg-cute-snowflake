'use strict';

const snowflake = require('./lib/snowflake');

module.exports = agent => {
  if (agent.config.snowflake.agent) snowflake(agent);
};
