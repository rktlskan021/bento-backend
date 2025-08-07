import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'note_type_concept_id') query = db.selectFrom('note').select('note_type_concept_id'); // 안뜸
  else if(column === 'note_class_concept_id') query = db.selectFrom('note').select('note_class_concept_id'); // 안뜸
  else if(column === 'encoding_concept_id') query = db.selectFrom('note').select('encoding_concept_id'); // 안뜸
  else if(column === 'language_concept_id') query = db.selectFrom('note').select('language_concept_id');
  else if(column === 'provider_id') query = db.selectFrom('note').select('provider_id');
  else if(column === 'visit_occurrence_id') query = db.selectFrom('note').select('visit_occurrence_id');
  else if(column === 'visit_detail_id') query = db.selectFrom('note').select('visit_detail_id'); // 안뜸
  else if(column === 'note_event_id') query = db.selectFrom('note').select('note_event_id');
  else if(column === 'note_event_field_concept_id') query = db.selectFrom('note').select('note_event_field_concept_id'); // 안뜸
  else if(column === 'ext_format_id') query = db.selectFrom('note').select('ext_format_id'); // 안뜸
  else if(column === 'provider_id2') query = db.selectFrom('note').select('provider_id2'); // 안뜸
  
  return query;
};