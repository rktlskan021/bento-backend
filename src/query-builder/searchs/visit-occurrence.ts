import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'visit_concept_id') query = db.selectFrom('visit_occurrence').select('visit_concept_id'); // 안뜸
  else if(column === 'visit_type_concept_id') query = db.selectFrom('visit_occurrence').select('visit_type_concept_id'); // 안뜸
  else if(column === 'care_site_id') query = db.selectFrom('visit_occurrence').select('care_site_id'); // 안뜸
  else if(column === 'visit_source_concept_id') query = db.selectFrom('visit_occurrence').select('visit_source_concept_id'); // 안뜸
  else if(column === 'admitted_from_concept_id') query = db.selectFrom('visit_occurrence').select('admitted_from_concept_id'); // 안뜸
  else if(column === 'discharged_to_concept_id') query = db.selectFrom('visit_occurrence').select('discharged_to_concept_id'); // 안뜸
  else if(column === 'preceding_visit_occurrence_id') query = db.selectFrom('visit_occurrence').select('preceding_visit_occurrence_id'); // 안뜸

  return query;
};