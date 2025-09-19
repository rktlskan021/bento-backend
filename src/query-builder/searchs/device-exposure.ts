import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'device_concept_id') query = db.selectFrom('device_exposure').select('device_concept_id'); // 안뜸
  else if(column === 'device_type_concept_id') query = db.selectFrom('device_exposure').select('device_type_concept_id'); // 안뜸
  else if(column === 'provider_id') query = db.selectFrom('device_exposure').select('provider_id'); // 안뜸
  else if(column === 'visit_occurrence_id') query = db.selectFrom('device_exposure').select('visit_occurrence_id'); // 안뜸
  else if(column === 'visit_detail_id') query = db.selectFrom('device_exposure').select('visit_detail_id'); // 안뜸
  else if(column === 'device_source_concept_id') query = db.selectFrom('device_exposure').select('device_source_concept_id'); // 안뜸
  else if(column === 'unit_concept_id') query = db.selectFrom('device_exposure').select('unit_concept_id'); // 안뜸
  else if(column === 'unit_source_concept_id') query = db.selectFrom('device_exposure').select('unit_source_concept_id'); // 안뜸
  
  return query;
};