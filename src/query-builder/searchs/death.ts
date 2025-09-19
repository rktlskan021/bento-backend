import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'death_type_concept_id') query = db.selectFrom('death').select('death_type_concept_id'); // 안뜸
  else if(column === 'cause_concept_id') query = db.selectFrom('death').select('cause_concept_id');
  else if(column === 'cause_source_concept_id') query = db.selectFrom('death').select('cause_source_concept_id'); // 안뜸

  return query;
};