import { Injectable, NotFoundException } from '@nestjs/common';
import { Kysely, sql, SelectQueryBuilder } from 'kysely';
import { Database } from '../db/types';

@Injectable()
export class DataBrowserService {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * 파이프라인 1단계: 모든 도메인의 컨셉 및 환자 수 집계
   */
  async getDomainSummary(keyword?: string, cohortId?: string) {
    const personSubQuery = cohortId
      ? this.db.selectFrom('cohort_detail').select('person_id').where('cohort_id', '=', cohortId)
      : this.db.selectFrom('person').select('person_id');

    let conceptSubQuery = this.db.selectFrom('snuh_concept').select('target_concept_id');
    if (keyword) {
      conceptSubQuery = conceptSubQuery.where('target_concept_name', 'ilike', `%${keyword}%`);
    }

    const domains = ['conditions', 'drugs', 'measurements', 'procedures'];
    
    const results = await Promise.all(
        domains.map(async (domain) => {
            let queryResult;
            switch(domain) {
                case 'conditions':
                    queryResult = await this.db.selectFrom('condition_occurrence')
                        .select(eb => [
                            eb.fn.count('person_id').distinct().as('participant_count'),
                            eb.fn.count('condition_concept_id').distinct().as('concept_count')
                        ])
                        .where('person_id', 'in', personSubQuery)
                        .where('condition_concept_id', 'in', conceptSubQuery)
                        .executeTakeFirstOrThrow();
                    break;
                case 'drugs':
                    queryResult = await this.db.selectFrom('drug_exposure')
                        .select(eb => [
                            eb.fn.count('person_id').distinct().as('participant_count'),
                            eb.fn.count('drug_concept_id').distinct().as('concept_count')
                        ])
                        .where('person_id', 'in', personSubQuery)
                        .where('drug_concept_id', 'in', conceptSubQuery)
                        .executeTakeFirstOrThrow();
                    break;
                case 'measurements':
                    queryResult = await this.db.selectFrom('measurement')
                        .select(eb => [
                            eb.fn.count('person_id').distinct().as('participant_count'),
                            eb.fn.count('measurement_concept_id').distinct().as('concept_count')
                        ])
                        .where('person_id', 'in', personSubQuery)
                        .where('measurement_concept_id', 'in', conceptSubQuery)
                        .executeTakeFirstOrThrow();
                    break;
                case 'procedures':
                    queryResult = await this.db.selectFrom('procedure_occurrence')
                        .select(eb => [
                            eb.fn.count('person_id').distinct().as('participant_count'),
                            eb.fn.count('procedure_concept_id').distinct().as('concept_count')
                        ])
                        .where('person_id', 'in', personSubQuery)
                        .where('procedure_concept_id', 'in', conceptSubQuery)
                        .executeTakeFirstOrThrow();
                    break;
                default:
                    throw new NotFoundException(`Domain '${domain}' not found.`);
            }
            return {
                domain_name: domain,
                participant_count: Number(queryResult.participant_count),
                concept_count: Number(queryResult.concept_count),
            }
        })
    );
    return results;
  }

  /**
   * 파이프라인 2단계: 특정 도메인의 상위 컨셉 목록 조회
   */
  async getTopConceptsForDomain(
    domain: string,
    cohortId?: string,
    viewBy: 'source' | 'target' = 'target',
    limit: number = 50
  ) {
    const personSubQuery = cohortId
      ? this.db.selectFrom('cohort_detail').select('person_id').where('cohort_id', '=', cohortId)
      : this.db.selectFrom('person').select('person_id');

    let query: SelectQueryBuilder<any, any, any>;
    
    switch (domain) {
        case 'conditions':
            if (viewBy === 'source') {
                query = this.db.selectFrom('condition_occurrence')
                    .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'condition_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .groupBy(['sc.source_code', 'sc.source_code_description'])
                    .select(eb => ['sc.source_code as concept_id', 'sc.source_code_description as concept_name', eb.fn.count('person_id').distinct().as('participant_count')]);
            } else {
                const domainCountsQuery = this.db.selectFrom('condition_occurrence')
                    .innerJoin('concept as con', 'con.concept_id', 'condition_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .where('con.concept_class_id', '=', 'Clinical Finding')
                    .groupBy('condition_concept_id')
                    .select(eb => ['condition_concept_id as concept_id', eb.fn.count('person_id').distinct().as('participant_count')]);
                query = this.db.selectFrom(domainCountsQuery.as('dc')).innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dc.concept_id').select(['sc.target_concept_name as concept_name', 'dc.participant_count', sql<string>`CAST(dc.concept_id AS String)`.as('concept_id')]);
            }
            break;
        case 'drugs':
             if (viewBy === 'source') {
                query = this.db.selectFrom('drug_exposure')
                    .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'drug_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .groupBy(['sc.source_code', 'sc.source_code_description'])
                    .select(eb => ['sc.source_code as concept_id', 'sc.source_code_description as concept_name', eb.fn.count('person_id').distinct().as('participant_count')]);
            } else {
                const domainCountsQuery = this.db.selectFrom('drug_exposure')
                    .innerJoin('concept as con', 'con.concept_id', 'drug_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .groupBy('drug_concept_id')
                    .select(eb => ['drug_concept_id as concept_id', eb.fn.count('person_id').distinct().as('participant_count')]);
                query = this.db.selectFrom(domainCountsQuery.as('dc')).innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dc.concept_id').select(['sc.target_concept_name as concept_name', 'dc.participant_count', sql<string>`CAST(dc.concept_id AS String)`.as('concept_id')]);
            }
            break;
        case 'measurements':
             if (viewBy === 'source') {
                query = this.db.selectFrom('measurement')
                    .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'measurement_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .groupBy(['sc.source_code', 'sc.source_code_description'])
                    .select(eb => ['sc.source_code as concept_id', 'sc.source_code_description as concept_name', eb.fn.count('person_id').distinct().as('participant_count')]);
            } else {
                const domainCountsQuery = this.db.selectFrom('measurement')
                    .innerJoin('concept as con', 'con.concept_id', 'measurement_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .groupBy('measurement_concept_id')
                    .select(eb => ['measurement_concept_id as concept_id', eb.fn.count('person_id').distinct().as('participant_count')]);
                query = this.db.selectFrom(domainCountsQuery.as('dc')).innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dc.concept_id').select(['sc.target_concept_name as concept_name', 'dc.participant_count', sql<string>`CAST(dc.concept_id AS String)`.as('concept_id')]);
            }
            break;
        case 'procedures':
             if (viewBy === 'source') {
                query = this.db.selectFrom('procedure_occurrence')
                    .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'procedure_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .groupBy(['sc.source_code', 'sc.source_code_description'])
                    .select(eb => ['sc.source_code as concept_id', 'sc.source_code_description as concept_name', eb.fn.count('person_id').distinct().as('participant_count')]);
            } else {
                const domainCountsQuery = this.db.selectFrom('procedure_occurrence')
                    .innerJoin('concept as con', 'con.concept_id', 'procedure_concept_id')
                    .where('person_id', 'in', personSubQuery)
                    .groupBy('procedure_concept_id')
                    .select(eb => ['procedure_concept_id as concept_id', eb.fn.count('person_id').distinct().as('participant_count')]);
                query = this.db.selectFrom(domainCountsQuery.as('dc')).innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dc.concept_id').select(['sc.target_concept_name as concept_name', 'dc.participant_count', sql<string>`CAST(dc.concept_id AS String)`.as('concept_id')]);
            }
            break;
        default:
             throw new NotFoundException(`Domain '${domain}' not found.`);
    }
    
    const result = await query.orderBy('participant_count', 'desc').orderBy('concept_name', 'asc').limit(limit).execute();
    return result.map((row: any) => ({ ...row, participant_count: Number(row.participant_count) }));
  }

  /**
   * 파이프라인 3단계: 특정 컨셉의 상세 인구통계 조회
   */
  async getConceptDetails(domain: string, conceptId: string, cohortId?: string) {
    const { dateColumn } = this.getDomainInfo(domain);

    const conceptNameResult = await this.db.selectFrom('snuh_concept')
      .select('target_concept_name')
      .where('target_concept_id', '=', conceptId)
      .executeTakeFirst();

    if (!conceptNameResult) {
      throw new NotFoundException(`Concept ID ${conceptId} not found.`);
    }

    let ageDataPromise, sexDataPromise;

    switch (domain) {
      case 'conditions': {
        let baseQuery = this.db.selectFrom('condition_occurrence').selectAll().where('condition_concept_id', '=', conceptId);
        if (cohortId) { baseQuery = baseQuery.where('person_id', 'in', this.db.selectFrom('cohort_detail').select('person_id').where('cohort_id', '=', cohortId)); }
        ageDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').select(eb => [eb.fn('floor', [eb(eb(eb.fn('year', [sql.ref(`domain_table.${dateColumn}`)]), '-', eb.ref('p.year_of_birth')), '/', 10)]).as('age_group_floor'), eb.fn.count('p.person_id').distinct().as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute();
        sexDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute();
        break;
      }
      case 'drugs': {
        let baseQuery = this.db.selectFrom('drug_exposure').selectAll().where('drug_concept_id', '=', conceptId);
        if (cohortId) { baseQuery = baseQuery.where('person_id', 'in', this.db.selectFrom('cohort_detail').select('person_id').where('cohort_id', '=', cohortId)); }
        ageDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').select(eb => [eb.fn('floor', [eb(eb(eb.fn('year', [sql.ref(`domain_table.${dateColumn}`)]), '-', eb.ref('p.year_of_birth')), '/', 10)]).as('age_group_floor'), eb.fn.count('p.person_id').distinct().as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute();
        sexDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute();
        break;
      }
      case 'measurements': {
        let baseQuery = this.db.selectFrom('measurement').selectAll().where('measurement_concept_id', '=', conceptId);
        if (cohortId) { baseQuery = baseQuery.where('person_id', 'in', this.db.selectFrom('cohort_detail').select('person_id').where('cohort_id', '=', cohortId)); }
        ageDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').select(eb => [eb.fn('floor', [eb(eb(eb.fn('year', [sql.ref(`domain_table.${dateColumn}`)]), '-', eb.ref('p.year_of_birth')), '/', 10)]).as('age_group_floor'), eb.fn.count('p.person_id').distinct().as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute();
        sexDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute();
        break;
      }
      case 'procedures': {
        let baseQuery = this.db.selectFrom('procedure_occurrence').selectAll().where('procedure_concept_id', '=', conceptId);
        if (cohortId) { baseQuery = baseQuery.where('person_id', 'in', this.db.selectFrom('cohort_detail').select('person_id').where('cohort_id', '=', cohortId)); }
        ageDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').select(eb => [eb.fn('floor', [eb(eb(eb.fn('year', [sql.ref(`domain_table.${dateColumn}`)]), '-', eb.ref('p.year_of_birth')), '/', 10)]).as('age_group_floor'), eb.fn.count('p.person_id').distinct().as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute();
        sexDataPromise = this.db.selectFrom(baseQuery.as('domain_table')).innerJoin('person as p', 'p.person_id', 'domain_table.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute();
        break;
      }
      default:
        throw new NotFoundException(`Domain '${domain}' not found.`);
    }

    const [ageData, sexData] = await Promise.all([ageDataPromise, sexDataPromise]);

    const age = ageData.reduce((acc, row: any) => {
        const startAge = Number(row.age_group_floor) * 10;
        if (startAge >= 0 && startAge < 200) { acc[`${startAge}-${startAge + 9}`] = Number(row.count); }
        return acc;
    }, {});
    const sex = sexData.reduce((acc, row: any) => { acc[row.gender] = Number(row.count); return acc; }, {});

    return {
      conceptId,
      conceptName: conceptNameResult.target_concept_name,
      demographics: { age, sex },
    };
  }
  
  /**
   * Measurement 측정 컨셉의 값 분포 통계 조회
   */
  async getConceptValueDistribution(measurementConceptId: string) {
    const query = sql<any>`
        WITH
            base_data AS (SELECT m.person_id, m.value_as_number, p.gender_concept_id, coalesce(m.unit_concept_id, -1) AS unit_concept_id FROM measurement AS m INNER JOIN person AS p ON p.person_id = m.person_id WHERE m.measurement_concept_id = ${sql.val(measurementConceptId)} AND m.value_as_number IS NOT NULL),
            unit_boundaries AS (SELECT unit_concept_id, quantile(0.05)(value_as_number) AS p05_value, quantile(0.95)(value_as_number) AS p95_value, GREATEST(round((p95_value - p05_value) / 10), 1) AS dynamic_bin_size FROM base_data GROUP BY unit_concept_id),
            gender_totals_per_unit AS (SELECT unit_concept_id, gender_concept_id, count(DISTINCT person_id) AS total_gender_count FROM base_data GROUP BY unit_concept_id, gender_concept_id),
            labeled_data AS (SELECT bd.person_id, bd.unit_concept_id, bd.gender_concept_id, CASE WHEN bd.value_as_number < ub.p05_value THEN concat('< ', toString(round(ub.p05_value, 1))) WHEN bd.value_as_number >= ub.p95_value THEN concat('>= ', toString(round(ub.p95_value, 1))) ELSE concat(toString(round(ub.p05_value + floor((bd.value_as_number - ub.p05_value) / ub.dynamic_bin_size) * ub.dynamic_bin_size, 1)), ' - ', toString(round(LEAST(ub.p05_value + floor((bd.value_as_number - ub.p05_value) / ub.dynamic_bin_size) * ub.dynamic_bin_size + ub.dynamic_bin_size - 0.1, ub.p95_value), 1))) END AS range_label, CASE WHEN bd.value_as_number < ub.p05_value THEN -1 WHEN bd.value_as_number >= ub.p95_value THEN 99999 ELSE ub.p05_value + floor((bd.value_as_number - ub.p05_value) / ub.dynamic_bin_size) * ub.dynamic_bin_size END AS sort_order FROM base_data AS bd INNER JOIN unit_boundaries AS ub ON bd.unit_concept_id = ub.unit_concept_id)
        SELECT unit_concept.concept_name AS unit_name, gender_concept.concept_name AS gender_name, any(gt.total_gender_count) AS total_gender_count, ld.range_label, count(DISTINCT ld.person_id) AS participant_count, any(ld.sort_order) AS sort_order FROM labeled_data AS ld INNER JOIN gender_totals_per_unit AS gt ON ld.unit_concept_id = gt.unit_concept_id AND ld.gender_concept_id = gt.gender_concept_id LEFT JOIN concept AS unit_concept ON ld.unit_concept_id = unit_concept.concept_id INNER JOIN concept AS gender_concept ON ld.gender_concept_id = gender_concept.concept_id GROUP BY unit_name, gender_name, ld.range_label ORDER BY unit_name, gender_name, sort_order;
    `;

    const result = await query.execute(this.db);
    return (result.rows).map(row => ({
        ...row,
        total_gender_count: Number(row.total_gender_count),
        participant_count: Number(row.participant_count),
        sort_order: Number(row.sort_order)
    }));
  }

  private getDomainInfo(domain: string) {
    switch (domain.toLowerCase()) {
      case 'conditions': return { tableName: 'condition_occurrence', conceptColumn: 'condition_concept_id', dateColumn: 'condition_start_date' };
      case 'drugs': return { tableName: 'drug_exposure', conceptColumn: 'drug_concept_id', dateColumn: 'drug_exposure_start_date' };
      case 'measurements': return { tableName: 'measurement', conceptColumn: 'measurement_concept_id', dateColumn: 'measurement_date' };
      case 'procedures': return { tableName: 'procedure_occurrence', conceptColumn: 'procedure_concept_id', dateColumn: 'procedure_date' };
      default: throw new NotFoundException(`Domain '${domain}' not found.`);
    }
  }
}
