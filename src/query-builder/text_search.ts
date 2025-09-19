import { Kysely } from "kysely";
import { Database } from "src/db/types";
import { Text_Search } from "src/types/type";
import { searchTextQuery } from "./base";

export const buildSearchTextCountQuery = (
    db: Kysely<Database>,
    options: {
        table_name: string;
        column_name: string;
        query: Text_Search;
        database?: 'clickhouse' | 'postgres' | string;
    }
) => {
    let {table_name, column_name, query, database} = options;
    database = database || 'clickhouse';
    return searchTextQuery(
        db,
        database,
        table_name,
        column_name,
        query
    );
}