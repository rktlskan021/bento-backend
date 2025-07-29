import { Dialect, DatabaseIntrospector } from 'kysely';
import { ClickHouseClient, createClient } from '@clickhouse/client';
import {
  Kysely,
  Driver,
  QueryCompiler,
  MysqlQueryCompiler
} from 'kysely';
import { NodeClickHouseClientConfigOptions } from '@clickhouse/client/dist/config';
import { ClickhouseDriver } from './clickhouse-driver';
import { ClickhouseIntrospector } from './clickhouse-introspector';
import { ClickhouseAdapter } from './clickhouse-adapter';

export interface ClickhouseDialectConfig {
  options?: NodeClickHouseClientConfigOptions;
}

export class ClickhouseDialect implements Dialect {
    #config: ClickhouseDialectConfig;

    constructor(config?: ClickhouseDialectConfig){
        this.#config = config ?? {};
    }

    createAdapter() {
        return new ClickhouseAdapter();
    }

    createDriver(): Driver {
        return new ClickhouseDriver(this.#config);
    }

    createQueryCompiler(): QueryCompiler {
        return new MysqlQueryCompiler();
    }

    createIntrospector(db: Kysely<any>): DatabaseIntrospector {
        return new ClickhouseIntrospector(db);
    }
}