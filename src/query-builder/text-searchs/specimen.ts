import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('specimen').select(({fn}) => [fn.count('specimen_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'specimen_source_id') {
    countQuery = handleTextWithOperator(
      countQuery,
      'specimen.specimen_source_id',
      query as StringOperator
    );
  }
  else if(column_name === 'specimen_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'specimen.specimen_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'unit_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'specimen.unit_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'anatomic_site_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'specimen.anatomic_site_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'disease_status_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'specimen.disease_status_source_value',
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