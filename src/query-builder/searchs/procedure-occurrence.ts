import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'procedure_concept_id') query = db.selectFrom('procedure_occurrence').select('procedure_concept_id');
  else if(column === 'procedure_type_concept_id') query = db.selectFrom('procedure_occurrence').select('procedure_type_concept_id'); // 안뜸
  else if(column === 'modifier_concept_id') query = db.selectFrom('procedure_occurrence').select('modifier_concept_id'); // 안뜸
  else if(column === 'provider_id') query = db.selectFrom('procedure_occurrence').select('provider_id');
  else if(column === 'visit_occurrence_id') query = db.selectFrom('procedure_occurrence').select('visit_occurrence_id');
  else if(column === 'visit_detail_id') query = db.selectFrom('procedure_occurrence').select('visit_detail_id'); // 안뜸
  else if(column === 'procedure_source_concept_id') query = db.selectFrom('procedure_occurrence').select('procedure_source_concept_id');
  
  return query;
};