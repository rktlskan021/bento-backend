import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (
  db: Kysely<Database>,
  column: string,
) => {
  let query;
    
  if(column === 'period_type_concept_id') query = db.selectFrom('observation_period').select('period_type_concept_id'); // 안뜸

  return query;
};