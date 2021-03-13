'use strict';

module.exports = () => {
  const config = {};

  // JAVA
  config.snowflake = {
    app: true,
    agent: true,
    // client: {
    //   twepoch: 1480166465631,
    //   dataCenterIdBits: 5,
    //   workerIdBits: 5,
    //   sequenceBits: 12,
    // },
  };

  // JS
  // config.snowflake = {
  //   app: true,
  //   agent: true,
  //   client: {
  //     twepoch: 1480166465631,
  //     dataCenterIdBits: 3,
  //     workerIdBits: 3,
  //     sequenceBits: 6,
  //   },
  // };

  return config;
};
