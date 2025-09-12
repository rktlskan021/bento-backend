import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('procedure_occurrence').select(({fn}) => [fn.count('procedure_occurrence_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'procedure_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'procedure_occurrence.procedure_source_value',
      query as StringOperator
    );
  }
  else if(column_name === 'modifier_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'procedure_occurrence.modifier_source_value',
      query as StringOperator
    );  
  }
  // 엑셀 파일에는 있는데 DB 구조에는 없음.
  // else if(column_name === 'ext_accesstion_number') {
  //   countQuery = handleTextWithOperator(
  //     countQuery,
  //     'procedure_occurrence.ext_accesstion_number',
  //     query as StringOperator
  //   );  
  // }

  const [count, totalCount] = await Promise.all([
    countQuery.execute(),
    totalCountQuery.execute(),
  ])

  return {
    queryCount: Number(count[0].total),
    totalCount: Number(totalCount[0].total),
  };
};