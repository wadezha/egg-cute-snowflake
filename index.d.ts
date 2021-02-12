
export declare class Snowflake {
    nextId(): Promise<string>;
}

interface ClusterOptions {
  twepoch?: number;
  dataCenterIdBits?: number;
  workerIdBits?: number;
  sequenceBits?: number;
}

interface EggSnowflakeOptions {
  app?: boolean;
  agent?: boolean;
  client?: ClusterOptions;
  clients?: Record<string, ClusterOptions>;
}

declare module 'egg' {
  interface Application {
    snowflake: Snowflake & Singleton<Snowflake>;
  }

  interface EggAppConfig {
    snowflake: EggSnowflakeOptions;
  }
}