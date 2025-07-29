import { ClickhouseDialect } from './db/clickhouse';
// import { db } from './db/types';
import { Kysely, sql } from 'kysely';
import { PostgresDialect } from 'kysely';
import { Database } from './db/types';
import * as dotenv from 'dotenv';

dotenv.config();

const db = new Kysely<Database>({
  dialect:
    process.env.DB_TYPE === 'clickhouse' || !process.env.DB_TYPE
      ? new ClickhouseDialect({
          options: {
            url: `http://172.23.100.146:8123`,
            username: 'clickhouse',
            password: 'clickhouse',
            database: 'default',
          },
        })
      : new PostgresDialect(undefined as any),
});

async function testConnection() {
    const result = await db
        .selectFrom('condition_era')
        .select('condition_concept_id')
        .limit(4)
        .execute();

    console.log(result);
}

testConnection();