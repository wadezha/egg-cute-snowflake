'use strict';

const assert = require('assert');
const { Big } = require('big.js');
const utils = require('./utils.js');

const timeGen = Symbol('timeGen');
const getWorkId = Symbol('getWorkId');
const getDataCenterId = Symbol('getDataCenterId');
const tilNextMillis = Symbol('tilNextMillis');

const EVENT_APP_INIT = 'egg-cute-snowflake:app-init';
const EVENT_AGENT_REPLY = 'egg-cute-snowflake:agent-reply';
const EVENT_EGG_READY = 'egg-ready';

/**
 * 雪花算法分布式唯一ID生成器
 * 每个机器号最高支持每秒64000（1000*2的6次方）个序列, 当秒序列不足时启用备份机器号, 若备份机器也不足时借用备份机器下一秒可用序列
 * 
 * 
 * JS的Number类型精度最高只有53bit，53 bits 趋势自增ID结构如下:
 * |--- timestamp ---|-machine-|-worker -|-- serial --|
 * |----- 41 bit ----|- 3 bit -|- 3 bit -|--- 6 bit --|
 * |                 |         |         |            |
 *  00000000000000000    000       000    000000000000
 * 
 * 1, 41bit毫秒时间戳
 * 2, 6bit机器编号, 最高可支持64个节点；可以部署在2**6=64个节点，包括3位machine和3位worker；5位可以表示的最大正整数是2**3-1=7，表示支持0-7台机器，每台机器0-7个节点
 * 3, 6bit自增序列, 单节点最高可支持64个ID/ms
 * 注：Egg中如果CPU大于8核时，请调整worker值，降低机器数量
 * 
 * 
/** 
 * JAVA的Long类型精度最高有64bit，64 bits 趋势自增ID结构如下:
 * |---|--- timestamp ---|- machine -|- worker -|-- serial --|
 * |-1-|----- 41 bit ----|---- 5 ----|--- 5 ----|---- 12 ----|
 * |   |                 |           |          |            |
 *   0  00000000000000000    00000       00000   000000000000
 * 
 * 1, 高位1bit固定0表示正数
 * 2, 41bit毫秒时间戳
 * 3, 10bit机器编号, 最高可支持1024个节点；可以部署在2**10=1024个节点，包括5位machine和5位worker；5位可以表示的最大正整数是2**5-1=31，表示支持0-31台机器，每台机器0-31个节点
 * 4, 12bit自增序列, 单节点最高可支持4096个ID/ms
 * 
 **/
class Snowflake {
  constructor(app, {
    // TW纪元，初始偏移时间戳 (41bit，要求小于当前时间戳大于2000年时间戳)
    twepoch = 1480166465631,
    // 数据中心id所占位数
    dataCenterIdBits = 5,
    // 机器id所占位数
    workerIdBits = 5,
    // 自增序列所占位数
    sequenceBits = 12,
  }) {

    // Twitter纪元
    this.twepoch = twepoch;

    /** 数据中心Id所占位数 */
    this.dataCenterIdBits = dataCenterIdBits;

    /** 机器id所占的位数 */
    this.workerIdBits = workerIdBits;

    /** 自增序列所占位数 */
    this.sequenceBits = sequenceBits;

    /** 支持的最大数据中心Id */
    this.maxDataCenterId  = -1 ^ (-1 << dataCenterIdBits);

    /** 支持的最大机器Id */
    this.maxWorkerId  = -1 ^ (-1 << workerIdBits);

    /** 机器Id向左移位数 */
    this.workerIdShift = sequenceBits;

    /** 数据中心Id向左移位数 */
    this.dataCenterIdShift = sequenceBits + workerIdBits;

    /** 自增序列偏移位数 */
    this.timestampLeftShift = sequenceBits + workerIdBits + dataCenterIdBits;

    /** 自增序列最大值 */
    this.sequenceMask = -1 ^ (-1 << sequenceBits);

    /** 数据中心Id */
    this.dataCenterId = this[getDataCenterId]();

    /** 工作机器Id */
    this.workerId = this[getWorkId]();

    /** 自增序列（毫秒内） */
    this.sequence = 0;

    /** 上次生成Id的时间截 */
    this.lastTimestamp = -1;

    assert(!(this.twepoch >= this[timeGen]() && this.twepoch <= 946656000000), '[egg-cute-snowflake] twepoch value must be between 2000-01-01 and now.');
    
    assert(!(this.workerId > this.maxWorkerId || this.workerId < 0), `[egg-cute-snowflake] workerId can't be greater than ${this.maxWorkerId} or less than 0`);
    
    assert(!(this.dataCenterId > this.maxDataCenterId || this.dataCenterId < 0), `[egg-cute-snowflake] dataCenterId can not be greater than ${this.maxDataCenterId} or less than 0`);
    
    const { messenger } = app;

    // APP Work的Id
    this.appId = -1;
    
    messenger.once(EVENT_EGG_READY, () => {
      const { pid } = process;
      // APP Work初化始成功后通知Agent，等待Agent分配appId
      messenger.sendToAgent(EVENT_APP_INIT, { pid });
      app.coreLogger.info('[egg-cute-snowflake] init hostname: %s, IP: %s, dataCenterId: %s, workerId: %s, pid: %s', utils.getHostName(), utils.getIPAddress(), this.dataCenterId, this.workerId, pid);
    });

    messenger.once(EVENT_AGENT_REPLY, ({ pid, appId }) => {
      this.appId = appId;
      app.coreLogger.info('[egg-cute-snowflake] init pid: %s, app id: %s', pid, appId);
    });
  }

  [getDataCenterId]() {
    const sums = utils.mathSum(utils.toCodePoints(utils.getHostName()));
    return sums % this.maxDataCenterId;
  }

  [getWorkId]() {
    try {
      const ipAddress = utils.getIPAddress();
      if (!ipAddress) {
        throw new Error('Host IP address is error.');
      }
  
      const sums = utils.mathSum(utils.toCodePoints(ipAddress));
      return sums % this.maxWorkerId;
    } catch(ex) {
      return utils.randomRange(0, this.maxWorkerId);
    }
  }

  /** 
   * 
   * 返回以毫秒为单位的当前时间
   * @return 当前时间(毫秒)
   * 
   **/
  [timeGen]() {
    return new Date().getTime();
  }

  /** 
   * 
   * 阻塞到下一个毫秒，直到获得新的时间戳
   * @param lastTimestamp 上次生成ID的时间截
   * @return 当前时间戳
   **/
  [tilNextMillis](lastTimestamp) {
    let timestamp = this[timeGen]();
    while (timestamp <= lastTimestamp) {
      timestamp = this[timeGen]();
    }
    return timestamp;
  }

  async nextId() {
    console.log('snowflake nextId hostname: %s, IP: %s, dataCenterId: %s, workerId: %s, appId: %s', utils.getHostName(), utils.getIPAddress(), this.dataCenterId, this.workerId, this.appId)

    let timestamp = this[timeGen]();

    // 如果当前时间小于上一次ID生成的时间戳，说明系统时钟回退过这个时候应当抛出异常
    assert(!(timestamp < this.lastTimestamp), `[egg-cute-snowflake] lock moved backwards. Refusing to generate id for ${this.lastTimestamp - timestamp} milliseconds`);

    // 如果是同一时间生成的，则进行毫秒内序列
    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1) & this.sequenceMask;
      // 毫秒内序列溢出
      if (this.sequence === 0) {
        // 阻塞到下一个毫秒,获得新的时间戳
        timestamp = this[tilNextMillis](this.lastTimestamp);
      }
    } else {
      // 时间戳改变，毫秒内序列重置
      this.sequence = 0;
    }

    // 上次生成ID的时间截
    this.lastTimestamp = timestamp;
    
    // 缺少代理模式下进程集成（appId）
    return new Big(2).pow(this.timestampLeftShift).times(timestamp - this.twepoch).plus(this.dataCenterId << this.dataCenterIdShift)
      .plus(this.workerId << this.workerIdShift).plus(this.sequence).toString();

    // return ((timestamp - this.twepoch) << this.timestampLeftShift) | (this.dataCenterId << this.dataCenterIdShift) | (this.workerId << this.workerIdShift) | this.sequence;
    // return ((timestamp - this.twepoch) * (2 ** this.timestampLeftShift)) + (this.dataCenterId << this.dataCenterIdShift) + (this.workerId << this.workerIdShift) + this.sequence;
  }
}

function create(config = {}, app) {
  return new Snowflake(app, config);
}

exports.app = app => {
  app.addSingleton('snowflake', create);
};

exports.agent = agent => {
  // APP Work计数
  let appCount = 0;
  // 代理收到 APP Work 的初始化通知后，将APP Work计数加1作为appId反馈给APP Work
  agent.messenger.on(EVENT_APP_INIT, ({ pid }) => {
    agent.messenger.sendTo(pid, EVENT_AGENT_REPLY, { pid: pid, appId: appCount++ });
  })
};
