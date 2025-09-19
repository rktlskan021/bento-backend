import { Kysely } from 'kysely';
import { Database } from '../../db/types';
import { StringOperator, Text_Search } from 'src/types/type';
import { handleTextWithOperator } from '../base';

export const getQuery = async (
  db: Kysely<Database>,
  column_name: string,
  query: Text_Search
) => {
  let countQuery = db.selectFrom('drug_exposure').select(({fn}) => [fn.count('drug_exposure_id').as('total')]);
  let totalCountQuery = countQuery;
  if(column_name === 'stop_reason') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.stop_reason',
      query as StringOperator
    );
  }
  else if(column_name === 'sig') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.sig',
      query as StringOperator
    );  
  }
  else if(column_name === 'lot_number') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.lot_number',
      query as StringOperator
    ); 
  }
  else if(column_name === 'drug_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.drug_source_value',
      query as StringOperator
    ); 
  }
  else if(column_name === 'route_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.route_source_value',
      query as StringOperator
    ); 
  }
  else if(column_name === 'dose_unit_source_value') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.dose_unit_source_value',
      query as StringOperator
    );  
  }
  else if(column_name === 'atc_cd') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.atc_cd',
      query as StringOperator
    ); 
  }
  else if(column_name === 'effective_drug_dose') {
    countQuery = handleTextWithOperator(
      countQuery,
      'drug_exposure.effective_drug_dose',
      query as StringOperator
    ); 
  }

  const [count, totalCount] = await Promise.all([
    countQuery.execute(),
    totalCountQuery.execute(),
  ])

  return {
    queryCount: Number(count[0].total),
    totalCount: Number(totalCount[0].total),
  };
};