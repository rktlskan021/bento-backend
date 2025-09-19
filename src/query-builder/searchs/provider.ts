import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'specialty_concept_id') query = db.selectFrom('provider').select('specialty_concept_id');
  else if(column === 'care_site_id') query = db.selectFrom('provider').select('care_site_id'); // 안뜸
  else if(column === 'gender_concept_id') query = db.selectFrom('provider').select('gender_concept_id'); // 안뜸
  else if(column === 'specialty_source_concept_id') query = db.selectFrom('provider').select('specialty_source_concept_id'); // 안뜸  
  else if(column === 'gender_source_concept_id') query = db.selectFrom('provider').select('gender_source_concept_id'); // 안뜸 

  return query;
};