import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'bio_signal_concept_id') query = db.selectFrom('bio_signal').select('bio_signal_concept_id'); // 안뜸
  else if(column === 'visit_occurrence_id') query = db.selectFrom('bio_signal').select('visit_occurrence_id'); // 안뜸
  else if(column === 'event_id') query = db.selectFrom('bio_signal').select('event_id'); // 안뜸
  else if(column === 'event_field_concept_id') query = db.selectFrom('bio_signal').select('event_field_concept_id'); // 안뜸
  
  return query;
};