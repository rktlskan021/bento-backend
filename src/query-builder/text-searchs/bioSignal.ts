import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('bio_signal').select(({fn}) => [fn.count('bio_signal_concept_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'bio_signal_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'bio_signal.bio_signal_source_value',
      query as StringOperator
    );
  }
  else if(column_name === 'condition_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'bio_signal.file_path',
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