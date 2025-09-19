import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'drug_concept_id') query = db.selectFrom('drug_exposure').select('drug_concept_id');
  else if(column === 'drug_type_concept_id') query = db.selectFrom('drug_exposure').select('drug_type_concept_id'); // 안뜸
  else if(column === 'route_concept_id') query = db.selectFrom('drug_exposure').select('route_concept_id'); // 안뜸
  else if(column === 'provider_id') query = db.selectFrom('drug_exposure').select('provider_id');
  else if(column === 'visit_occurrence_id') query = db.selectFrom('drug_exposure').select('visit_occurrence_id');
  else if(column === 'visit_detail_id') query = db.selectFrom('drug_exposure').select('visit_detail_id'); // 안뜸
  else if(column === 'drug_source_concept_id') query = db.selectFrom('drug_exposure').select('drug_source_concept_id'); // 안뜸
  else if(column === 'dose_unit_concept_id') query = db.selectFrom('drug_exposure').select('dose_unit_concept_id');
  
  return query;
};