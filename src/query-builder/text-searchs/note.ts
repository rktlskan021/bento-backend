import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('note').select(({fn}) => [fn.count('note_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'note_title') {
    countQuery = handleTextWithOperator(
      countQuery,
      'note.note_title',
      query as StringOperator
    );
  }
  else if(column_name === 'note_text') {
    countQuery = handleTextWithOperator(
      countQuery,
      'note.note_text',
      query as StringOperator
    );  
  }
  else if(column_name === 'note_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'note.note_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'note_source_value2') {
    countQuery = handleTextWithOperator(
      countQuery,
      'note.note_source_value2',
      query as StringOperator
    );  
  }
  else if(column_name === 'note_source_value3') {
    countQuery = handleTextWithOperator(
      countQuery,
      'note.note_source_value3',
      query as StringOperator
    );  
  }
  else if(column_name === 'note_source_value4') {
    countQuery = handleTextWithOperator(
      countQuery,
      'note.note_source_value4',
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