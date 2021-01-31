# egg-cute-snowflake

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-cute-snowflake.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-cute-snowflake
[travis-image]: https://img.shields.io/travis/eggjs/egg-cute-snowflake.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-cute-snowflake
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-cute-snowflake.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-cute-snowflake?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-cute-snowflake.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-cute-snowflake
[snyk-image]: https://snyk.io/test/npm/egg-cute-snowflake/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-cute-snowflake
[download-image]: https://img.shields.io/npm/dm/egg-cute-snowflake.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-cute-snowflake

<!--
Description here.
-->

## Install

```bash
$ npm i egg-cute-snowflake --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.snowflake = {
  enable: true,
  package: 'egg-cute-snowflake',
};
```

## Configuration

``` 
JAVA 64bit

config.snowflake = {
  app: true,
  agent: true,
  client: {
    twepoch: 1480166465631,
    dataCenterIdBits: 5,
    workerIdBits: 5,
    sequenceBits: 12,
  },
};

Return a 64bit string, for example '553211427826962432'
  
```

```
JS 53bit

config.snowflake = {
  app: true,
  agent: true,
  client: {
    twepoch: 1480166465631,
    dataCenterIdBits: 3,
    workerIdBits: 3,
    sequenceBits: 6,
  },
};

Return a 53bit number, for example '540245822818368'

```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
