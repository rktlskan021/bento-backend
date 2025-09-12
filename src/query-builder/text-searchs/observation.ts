import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('observation').select(({fn}) => [fn.count('observation_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'value_as_string') {
    countQuery = handleTextWithOperator(
      countQuery,
      'observation.value_as_string',
      query as StringOperator
    );
  }
  else if(column_name === 'observation_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'observation.observation_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'unit_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'observation.unit_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'qualifier_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'observation.qualifier_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'value_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'observation.value_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'ext_etc_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'observation.ext_etc_source_value',
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