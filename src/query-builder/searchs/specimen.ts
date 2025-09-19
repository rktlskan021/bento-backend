import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'specimen_concept_id') query = db.selectFrom('specimen').select('specimen_concept_id');
  else if(column === 'specimen_type_concept_id') query = db.selectFrom('specimen').select('specimen_type_concept_id'); // 안뜸
  else if(column === 'unit_concept_id') query = db.selectFrom('specimen').select('unit_concept_id'); // 안뜸
  else if(column === 'anatomic_site_concept_id') query = db.selectFrom('specimen').select('anatomic_site_concept_id');
  else if(column === 'disease_status_concept_id') query = db.selectFrom('specimen').select('disease_status_concept_id');
  
  return query;
};