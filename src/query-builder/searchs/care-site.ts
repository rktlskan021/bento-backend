import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'place_of_service_concept_id') query = db.selectFrom('care_site').select('place_of_service_concept_id'); // 안뜸
  else if(column === 'location_id') query = db.selectFrom('care_site').select('location_id'); // 안뜸

  return query;
};