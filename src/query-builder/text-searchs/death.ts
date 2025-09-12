import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('death').select(({fn}) => [fn.count('person_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'cause_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'death.cause_source_value',
      query as StringOperator
    );
  }

  const [count, totalCount] = await Promise.all([
    countQuery.execute(),
    totalCountQuery.execute(),
  ])

  return {
    queryCount: Number(count[0].total),
    totalCount: Number(totalCount[0].total),
  };
};