import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('care_site').select(({fn}) => [fn.count('care_site_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'care_site_name') {
    countQuery = handleTextWithOperator(
      countQuery,
      'care_site.care_site_name',
      query as StringOperator
    );
  }
  else if(column_name === 'care_site_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'care_site.care_site_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'place_of_service_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'care_site.place_of_service_source_value',
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