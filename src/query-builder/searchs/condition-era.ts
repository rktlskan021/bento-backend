import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'condition_concept_id') {
    query = db.selectFrom('condition_era').select('condition_concept_id');
  }

  return query;
};