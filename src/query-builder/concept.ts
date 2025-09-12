import { searchSubQuery } from './base';
import { Database } from '../db/types';
import { Kysely, SelectQueryBuilder } from 'kysely';

export const buildSearchConceptQuery = (
    db: Kysely<Database>,
    options: {
        table: string;
        column: string;
        database?: 'clickhouse' | 'postgres' | string;
    },
) : SelectQueryBuilder<Database, any, any> => {
    let {table, column, database} = options;
    database = database || 'clickhouse';
    
    const query: SelectQueryBuilder<Database, any, any> = searchSubQuery(
        db,
        database,
        table,
        column
    )

    return query
}