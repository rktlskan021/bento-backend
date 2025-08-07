import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'measurement_concept_id') query = db.selectFrom('measurement').select('measurement_concept_id');
  else if(column === 'measurement_type_concept_id') query = db.selectFrom('measurement').select('measurement_type_concept_id'); // 안뜸
  else if(column === 'operator_concept_id') query = db.selectFrom('measurement').select('operator_concept_id'); // 안뜸
  else if(column === 'value_as_concept_id') query = db.selectFrom('measurement').select('value_as_concept_id');
  else if(column === 'unit_concept_id') query = db.selectFrom('measurement').select('unit_concept_id');
  else if(column === 'provider_id') query = db.selectFrom('measurement').select('provider_id');
  else if(column === 'visit_occurrence_id') query = db.selectFrom('measurement').select('visit_occurrence_id');
  else if(column === 'visit_detail_id') query = db.selectFrom('measurement').select('visit_detail_id'); // 안뜸
  else if(column === 'measurement_source_concept_id') query = db.selectFrom('measurement').select('measurement_source_concept_id'); // 안뜸
  else if(column === 'unit_source_concept_id') query = db.selectFrom('measurement').select('unit_source_concept_id'); // 안뜸
  else if(column === 'measurement_event_id') query = db.selectFrom('measurement').select('measurement_event_id'); // 안뜸
  else if(column === 'meas_event_field_concept_id') query = db.selectFrom('measurement').select('meas_event_field_concept_id'); // 안뜸
  
  return query;
};