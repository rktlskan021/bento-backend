import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'observation_concept_id') query = db.selectFrom('observation').select('observation_concept_id');
  else if(column === 'observation_type_concept_id') query = db.selectFrom('observation').select('observation_type_concept_id');
  else if(column === 'value_as_concept_id') query = db.selectFrom('observation').select('value_as_concept_id');
  else if(column === 'qualifier_concept_id') query = db.selectFrom('observation').select('qualifier_concept_id'); // 안뜸
  else if(column === 'unit_concept_id') query = db.selectFrom('observation').select('unit_concept_id'); // 안뜸
  else if(column === 'provider_id') query = db.selectFrom('observation').select('provider_id');
  else if(column === 'visit_occurrence_id') query = db.selectFrom('observation').select('visit_occurrence_id');
  else if(column === 'visit_detail_id') query = db.selectFrom('observation').select('visit_detail_id'); // 안뜸
  else if(column === 'observation_source_concept_id') query = db.selectFrom('observation').select('observation_source_concept_id'); // 안뜸
  else if(column === 'observation_event_id') query = db.selectFrom('observation').select('observation_event_id'); // 안뜸
  else if(column === 'obs_event_field_concept_id') query = db.selectFrom('observation').select('obs_event_field_concept_id'); // 안뜸
  else if(column === 'ext_obs_value_subject_ccp_id') query = db.selectFrom('observation').select('ext_obs_value_subject_ccp_id'); // 안뜸

  return query;
};