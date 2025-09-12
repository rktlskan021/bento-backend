import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('device_exposure').select(({fn}) => [fn.count('device_exposure_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'unique_device_id') {
    countQuery = handleTextWithOperator(
      countQuery,
      'device_exposure.unique_device_id',
      query as StringOperator
    );
  }
  else if(column_name === 'production_id') {
    countQuery = handleTextWithOperator(
      countQuery,
      'device_exposure.production_id',
      query as StringOperator
    );  
  }
  else if(column_name === 'device_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'device_exposure.device_source_value',
      query as StringOperator
    ); 
  }
  else if(column_name === 'unit_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'device_exposure.unit_source_value',
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