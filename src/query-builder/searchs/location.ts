import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'country_concept_id') query = db.selectFrom('location').select('country_concept_id');

  return query;
};