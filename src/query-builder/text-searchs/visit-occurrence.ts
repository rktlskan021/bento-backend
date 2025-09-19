import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('visit_occurrence').select(({fn}) => [fn.count('visit_occurrence_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'provider_id') {
    countQuery = handleTextWithOperator(
      countQuery,
      'visit_occurrence.provider_id',
      query as StringOperator
    );
  }
  else if(column_name === 'visit_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'visit_occurrence.visit_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'admitted_from_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'visit_occurrence.admitted_from_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'discharged_to_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'visit_occurrence.discharged_to_source_value',
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