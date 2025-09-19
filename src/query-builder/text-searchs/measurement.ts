import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('measurement').select(({fn}) => [fn.count('measurement_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'measurement_time') {
    countQuery = handleTextWithOperator(
      countQuery,
      'measurement.measurement_time',
      query as StringOperator
    );
  }
  else if(column_name === 'measurement_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'measurement.measurement_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'unit_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'measurement.unit_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'value_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'measurement.value_source_value',
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