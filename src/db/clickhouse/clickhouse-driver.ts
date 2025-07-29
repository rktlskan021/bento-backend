import { Driver, CompiledQuery, QueryResult, DatabaseConnection } from 'kysely';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { NodeClickHouseClientConfigOptions } from '@clickhouse/client/dist/config';
import { ClickhouseDialectConfig } from './clickhouse-dialect';
import { ClickhouseConnection } from './clickhouse-connection';

export class ClickhouseDriver implements Driver {
  #config: ClickhouseDialectConfig;

  constructor(config: ClickhouseDialectConfig) {
    this.#config = config;
  }

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new ClickhouseConnection(this.#config);
  }

    async beginTransaction(conn: ClickhouseConnection): Promise<void> {
    return await conn.beginTransaction();
  }

  async commitTransaction(conn: ClickhouseConnection): Promise<void> {
    return await conn.commitTransaction();
  }

  async rollbackTransaction(conn: ClickhouseConnection): Promise<void> {
    return await conn.rollbackTransaction();
  }

  async releaseConnection(_conn: ClickhouseConnection): Promise<void> {}

  async destroy(): Promise<void> {}
}
