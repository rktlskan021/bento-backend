import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('provider').select(({fn}) => [fn.count('provider_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'provider_name') {
    countQuery = handleTextWithOperator(
      countQuery,
      'provider.provider_name',
      query as StringOperator
    );
  }
  else if(column_name === 'npi') {
    countQuery = handleTextWithOperator(
      countQuery,
      'provider.npi',
      query as StringOperator
    );  
  }
  else if(column_name === 'dea') {
    countQuery = handleTextWithOperator(
      countQuery,
      'provider.dea',
      query as StringOperator
    );  
  }
  else if(column_name === 'provider_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'provider.provider_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'specialty_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'provider.specialty_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'gender_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'provider.gender_source_value',
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