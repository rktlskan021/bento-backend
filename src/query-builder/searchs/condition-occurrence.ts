import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'condition_concept_id') query = db.selectFrom('condition_occurrence').select('condition_concept_id');
  else if(column === 'condition_type_concept_id') query = db.selectFrom('condition_occurrence').select('condition_type_concept_id'); // 안뜸
  else if(column === 'condition_status_concept_id') query = db.selectFrom('condition_occurrence').select('condition_status_concept_id'); // 안뜸
  else if(column === 'provider_id') query = db.selectFrom('condition_occurrence').select('provider_id'); 
  else if(column === 'visit_occurrence_id') query = db.selectFrom('condition_occurrence').select('visit_occurrence_id'); // 안뜸 
  else if(column === 'visit_detail_id') query = db.selectFrom('condition_occurrence').select('visit_detail_id'); 
  else if(column === 'condition_source_concept_id') query = db.selectFrom('condition_occurrence').select('condition_source_concept_id'); // 안뜸
  else if(column === 'ext_cond_type_1_concept_id') query = db.selectFrom('condition_occurrence').select('ext_cond_type_1_concept_id'); // 안뜸
  else if(column === 'ext_cond_type_2_concept_id') query = db.selectFrom('condition_occurrence').select('ext_cond_type_2_concept_id'); // 안뜸

  return query;
};