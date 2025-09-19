import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('location').select(({fn}) => [fn.count('location_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'address_1') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.address_1',
      query as StringOperator
    );
  }
  else if(column_name === 'address_2') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.address_2',
      query as StringOperator
    );  
  }
  else if(column_name === 'city') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.city',
      query as StringOperator
    );  
  }
  else if(column_name === 'state') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.state',
      query as StringOperator
    );  
  }
  else if(column_name === 'zip') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.zip',
      query as StringOperator
    );  
  }
  else if(column_name === 'county') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.county',
      query as StringOperator
    );  
  }
  else if(column_name === 'location_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.location_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'country_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'location.country_source_value',
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