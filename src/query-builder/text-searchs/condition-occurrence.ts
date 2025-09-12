import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('condition_occurrence').select(({fn}) => [fn.count('condition_concept_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'stop_reason') {
    countQuery = handleTextWithOperator(
      countQuery,
      'condition_occurrence.stop_reason',
      query as StringOperator
    );
  }
  else if(column_name === 'condition_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'condition_occurrence.condition_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'condition_status_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'condition_occurrence.condition_status_source_value',
      query as StringOperator
    ); 
  }
  else if(column_name === 'ext_cond_source_value_kcd') {
    countQuery = handleTextWithOperator(
      countQuery,
      'condition_occurrence.ext_cond_source_value_kcd',
      query as StringOperator
    ); 
  }
  else if(column_name === 'ext_cond_source_value_cc_text') {
    countQuery = handleTextWithOperator(
      countQuery,
      'condition_occurrence.ext_cond_source_value_cc_text',
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