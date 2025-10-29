// src/data-browser.service.ts (최종 수정본)

import { Injectable, NotFoundException } from '@nestjs/common';
import { Kysely, sql, SelectQueryBuilder } from 'kysely';
import { Database } from '../db/types';
import { 
  ValueDistributionResponseDto, 
  TopConceptDto,
  // ✅ DTO 임포트 수정
  ConceptDetailResponseDto 
} from './dto/data-browser.dto';
// ✅ DemographicsDto가 service.ts 내부에서 쓰이므로 DTO에서 가져오거나 여기서 정의
// DTO 파일에서 DemographicsDto를 export 하거나, 여기에 간단히 정의합니다.
class DemographicsDto { age: { [ageRange: string]: number }; sex: { [gender: string]: number }; }


// Interface matching the DTO structure for Value Distribution
// ... (Interface 정의들은 기존과 동일하게 유지) ...
interface ValueDistributionResultForService extends Omit<ValueDistributionResponseDto, 'unit_name' | 'gender_name' | 'cohort_counts'> {
  unit_concept_id: string;
  gender_concept_id: string;
}
interface TopConceptResultInternal {
  concept_id: string;
  concept_name: string;
  total_participant_count: number;
  vocabulary_counts?: { [vocabId: string]: number };
  descendent_concept?: TopConceptResultInternal[];
  target_concept_id?: string;
  mapped_source_codes?: string[];
}
interface AggregatedCountsInternalValue {
    concept_id: string;
    concept_name: string;
    total_participant_count: number;
    vocabulary_counts: { [key: string]: number };
    person_ids?: Set<string>; 
    cohort_vocabulary_counts?: { [key: string]: { [key: string]: number } };
    target_concept_id?: string;
}
interface AggregatedCountsInternal {
  [key: string]: AggregatedCountsInternalValue;
}
interface ValueDistributionResultInternal extends Omit<ValueDistributionResponseDto, 'unit_name' | 'gender_name' | 'cohort_counts'> {
  unit_concept_id: string;
  gender_concept_id: string;
}


@Injectable()
export class DataBrowserService {
  constructor(private readonly db: Kysely<Database>) {}

  // ... getDomainSummary (변경 없음) ...
async getDomainSummary(keyword?: string, cohortIds?: string[]) {
    const personSubQuery = cohortIds && cohortIds.length > 0 
      ? this.db.selectFrom('snuh_cohort_detail').select('person_id').where('cohort_id', 'in', cohortIds) 
      : this.db.selectFrom('person').select('person_id');
      
    let conceptSubQuery = this.db.selectFrom('snuh_concept').select('target_concept_id'); 
    if (keyword) { 
      conceptSubQuery = conceptSubQuery.where('target_concept_name', 'ilike', `%${keyword}%`); 
    }
    
    const domains = ['conditions', 'drugs', 'measurements', 'procedures'];
    
    const results = await Promise.all(domains.map(async (domain) => {
      let queryResult;
      switch (domain) {
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
        default: throw new NotFoundException(`Domain '${domain}' not found.`);
      }
      return { 
        domain_name: domain, 
        participant_count: Number(queryResult.participant_count), 
        concept_count: Number(queryResult.concept_count) 
      };
    })); 
    
    return results; // ✅ 이 return 문이 누락되었습니다.
   }

  async getTopConceptsForDomain(
    domain: string, 
    cohortIds?: string[], 
    limit: number = 50
  ): Promise<TopConceptDto[]> { // ✅ 반환 타입 TopConceptDto[] 배열로 변경

    // ❌ 헬퍼 함수(getTopConceptsForSingleCohort) 및 Promise.all 로직 제거

    // ✅ 1. (수정) personSubQuery를 합집합 기준으로 생성
    const personSubQuery = (cohortIds && cohortIds.length > 0)
      // 여러 코호트 ID를 'in'으로 묶어 합집합(UNION) 환자군 생성
      ? this.db.selectFrom('snuh_cohort_detail').select('person_id').distinct().where('cohort_id', 'in', cohortIds)
      // cohortIds가 없으면 'all' (전체 환자)
      : this.db.selectFrom('person').select('person_id');

    // ✅ 2. (수정) 헬퍼 함수 내부에 있던 'target' 뷰 로직을 메인 함수로 이동
    let queryBuilder: SelectQueryBuilder<any, any, any>;
    let distinctCountsQueryBase: SelectQueryBuilder<any, any, any>;
    let domainConceptColumn: string;

    switch (domain) {
      case 'conditions':
        domainConceptColumn = 'condition_concept_id';
        queryBuilder = this.db.selectFrom('condition_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.condition_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.condition_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null);
        distinctCountsQueryBase = this.db.selectFrom('condition_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.condition_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2');
        
        // ✅ 3. (수정) 쿼리 빌더 로직 단순화
        queryBuilder = queryBuilder
          .where('dt.person_id', 'in', personSubQuery)
          .groupBy(['c2.concept_id', 'c1.vocabulary_id'])
          .select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); 
        break;
      
      case 'drugs': 
        domainConceptColumn = 'drug_concept_id'; 
        queryBuilder = this.db.selectFrom('drug_exposure as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.drug_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.drug_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null); 
        distinctCountsQueryBase = this.db.selectFrom('drug_exposure as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.drug_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2'); 

        // ✅ 3. (수정) 쿼리 빌더 로직 단순화
        queryBuilder = queryBuilder
          .where('dt.person_id', 'in', personSubQuery)
          .groupBy(['c2.concept_id', 'c1.vocabulary_id'])
          .select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']);
        break;
      
      case 'measurements': 
        domainConceptColumn = 'measurement_concept_id'; 
        queryBuilder = this.db.selectFrom('measurement as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.measurement_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.measurement_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null); 
        distinctCountsQueryBase = this.db.selectFrom('measurement as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.measurement_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2'); 
        
        // ✅ 3. (수정) 쿼리 빌더 로직 단순화
        queryBuilder = queryBuilder
          .where('dt.person_id', 'in', personSubQuery)
          .groupBy(['c2.concept_id', 'c1.vocabulary_id'])
          .select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']);
        break;
      
      case 'procedures': 
        domainConceptColumn = 'procedure_concept_id'; 
        queryBuilder = this.db.selectFrom('procedure_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.procedure_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.procedure_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null); 
        distinctCountsQueryBase = this.db.selectFrom('procedure_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.procedure_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2'); 
        
        // ✅ 3. (수정) 쿼리 빌더 로직 단순화
        queryBuilder = queryBuilder
          .where('dt.person_id', 'in', personSubQuery)
          .groupBy(['c2.concept_id', 'c1.vocabulary_id'])
          .select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']);
        break;
      
      default: throw new NotFoundException(`Domain '${domain}' not found.`);
    }

    // ✅ 4. (유지) 이하 모든 집계 로직은 personSubQuery에 의존하므로
    //    수정 없이 단일 합집합 쿼리로 올바르게 동작합니다.
    queryBuilder = queryBuilder.select(eb => eb.fn.count('dt.person_id').distinct().as('participant_count'));

    const counts = await queryBuilder
      .orderBy('participant_count', 'desc')
      .limit(3000) 
      .execute();

    if (counts.length === 0) return [];

    const aggregatedCounts: AggregatedCountsInternal = counts.reduce((acc, row: any) => {
      // ... (기존 로직 동일)
      const conceptId = row.concept_id; 
      const vocabId = row.source_vocabulary_id; 
      const count = Number(row.participant_count);
      if (!acc[conceptId]) {
          acc[conceptId] = {
              concept_id: conceptId, concept_name: '', total_participant_count: 0,
              vocabulary_counts: {}, 
          };
      }
      acc[conceptId].vocabulary_counts[vocabId] = (acc[conceptId].vocabulary_counts[vocabId] || 0) + count;
      return acc;
     }, {});

     // --- Create a query for TOTAL distinct count per concept ---
    let distinctTotalQuery;
            switch (domain) {
                // ... (switch 문 동일)
                case 'conditions': 
                    distinctTotalQuery = this.db.selectFrom('condition_occurrence as dt')
                        .where('dt.condition_concept_id', 'in', Object.keys(aggregatedCounts)) 
                        .select(['dt.condition_concept_id as concept_id']); 
                    break;
                case 'drugs': 
                    distinctTotalQuery = this.db.selectFrom('drug_exposure as dt')
                        .where('dt.drug_concept_id', 'in', Object.keys(aggregatedCounts)) 
                        .select(['dt.drug_concept_id as concept_id']); 
                    break;
                case 'measurements': 
                    distinctTotalQuery = this.db.selectFrom('measurement as dt')
                        .where('dt.measurement_concept_id', 'in', Object.keys(aggregatedCounts)) 
                        .select(['dt.measurement_concept_id as concept_id']); 
                    break;
                case 'procedures': 
                    distinctTotalQuery = this.db.selectFrom('procedure_occurrence as dt')
                        .where('dt.procedure_concept_id', 'in', Object.keys(aggregatedCounts))
                        .select(['dt.procedure_concept_id as concept_id']); 
                    break;
                default: throw new NotFoundException("Domain not found for distinct count");
            }
      distinctTotalQuery = distinctTotalQuery
          .where('dt.person_id', 'in', personSubQuery) // ✅ personSubQuery (합집합) 사용
          .groupBy('concept_id')
          .select(eb => eb.fn.count('dt.person_id').distinct().as('total_count'));

     const totalCounts = await distinctTotalQuery.execute();
     // ... (totalCountsMap, sourceCodeMappings, sourceCodeMap 로직 동일) ...
     const totalCountsMap = new Map(totalCounts.map(row => [row.concept_id, Number(row.total_count)]));

     Object.keys(aggregatedCounts).forEach(conceptId => {
       aggregatedCounts[conceptId].total_participant_count = Number(totalCountsMap.get(conceptId)) || 0;
     });

     const topConceptIds = Object.keys(aggregatedCounts);
     const sourceCodeMappings = await this.db.selectFrom('snuh_concept')
         .select(['target_concept_id', 'source_code'])
         .where('target_concept_id', 'in', topConceptIds)
         .execute();

     const sourceCodeMap = sourceCodeMappings.reduce((map, row) => {
         if (!map.has(row.target_concept_id)) { map.set(row.target_concept_id, []); }
         map.get(row.target_concept_id)!.push(row.source_code);
         return map;
     }, new Map<string, string[]>());

     const topConcepts: AggregatedCountsInternalValue[] = Object.values(aggregatedCounts).sort((a, b) => b.total_participant_count - a.total_participant_count);
     const finalTopConceptIds = topConcepts.slice(0, limit * 2).map(c => c.concept_id);

     const relationships = await this.db.selectFrom('concept_ancestor').select(['ancestor_concept_id', 'descendant_concept_id']).where('min_levels_of_separation', '=', 1).where('ancestor_concept_id', 'in', finalTopConceptIds).where('descendant_concept_id', 'in', finalTopConceptIds).execute();
     const conceptNames = await this.db.selectFrom('concept').select(['concept_id', 'concept_name']).where('concept_id', 'in', finalTopConceptIds).execute(); const conceptNameMap = new Map(conceptNames.map(c => [c.concept_id, c.concept_name]));
     
     const nodes = new Map<string, TopConceptResultInternal>();

     for (const concept of topConcepts) {
         if (!finalTopConceptIds.includes(concept.concept_id)) continue;
         nodes.set(concept.concept_id, {
             concept_id: concept.concept_id,
             concept_name: conceptNameMap.get(concept.concept_id) || 'Unknown Concept',
             total_participant_count: concept.total_participant_count,
             vocabulary_counts: concept.vocabulary_counts,
             mapped_source_codes: sourceCodeMap.get(concept.concept_id) || [], 
             descendent_concept: []
          });
      }
     const rootNodes = new Set(finalTopConceptIds);
     for (const rel of relationships) { const parent = nodes.get(rel.ancestor_concept_id); const child = nodes.get(rel.descendant_concept_id); if (parent && child) { (parent.descendent_concept ??= []).push(child); rootNodes.delete(rel.descendant_concept_id); } }
     const finalResult = Array.from(rootNodes).map(id => nodes.get(id)!);
     finalResult.sort((a, b) => b.total_participant_count - a.total_participant_count);

    // ✅ 5. (유지) 최종 반환 타입은 TopConceptDto[]
    return finalResult.slice(0, limit).map((item): TopConceptDto => ({
      concept_id: item.concept_id,
      concept_name: item.concept_name,
      total_participant_count: item.total_participant_count,
      vocabulary_counts: item.vocabulary_counts,
      mapped_source_codes: item.mapped_source_codes,
      descendent_concept: item.descendent_concept?.map(d => d as TopConceptDto)
    }));
  }

  // ✅ getConceptDetails 수정
  async getConceptDetails(
    domain: string, 
    conceptId: string, 
    cohortIds?: string[]
  ): Promise<ConceptDetailResponseDto> { // ✅ 반환 타입 DTO로 명시

    // ✅ 1. 공통 정보 (컨셉명) 먼저 조회
    const { dateColumn } = this.getDomainInfo(domain); 
    const conceptNameResult = await this.db.selectFrom('snuh_concept')
      .select('target_concept_name')
      .where('target_concept_id', '=', conceptId)
      .executeTakeFirst(); 
      
    if (!conceptNameResult) { 
      throw new NotFoundException(`Concept ID ${conceptId} not found.`); 
    }

    // --- 헬퍼 함수 정의: 단일 코호트(또는 'all')에 대한 Demographics 조회 ---
const getDemographicsForCohort = async (cohortId: string): Promise<DemographicsDto> => {
      
      const isAllCohorts = cohortId === 'all';
      
      const personSubQuery = isAllCohorts
        ? this.db.selectFrom('person').select('person_id')
        : this.db.selectFrom('snuh_cohort_detail').select('person_id').distinct().where('cohort_id', '=', cohortId);

      let ageDataPromise, sexDataPromise;

      switch (domain) {
        case 'conditions': { 
          // ✅ (수정) 'person_id' -> 'condition_occurrence.person_id'
          let q = this.db.selectFrom('condition_occurrence')
                        .where('condition_concept_id', '=', conceptId)
                        .where('condition_occurrence.person_id', 'in', personSubQuery); 
          ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'condition_occurrence.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); 
          sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'condition_occurrence.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); 
          break; 
        }
        case 'drugs': { 
          // ✅ (수정) 'person_id' -> 'drug_exposure.person_id'
          let q = this.db.selectFrom('drug_exposure')
                        .where('drug_concept_id', '=', conceptId)
                        .where('drug_exposure.person_id', 'in', personSubQuery);
          ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'drug_exposure.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); 
          sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'drug_exposure.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); 
          break; 
        }
        case 'measurements': { 
          // ✅ (수정) 'person_id' -> 'measurement.person_id'
          let q = this.db.selectFrom('measurement')
                        .where('measurement_concept_id', '=', conceptId)
                        .where('measurement.person_id', 'in', personSubQuery);
          ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'measurement.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); 
          sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'measurement.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); 
          break; 
        }
        case 'procedures': { 
          // ✅ (수정) 'person_id' -> 'procedure_occurrence.person_id'
          let q = this.db.selectFrom('procedure_occurrence')
                        .where('procedure_concept_id', '=', conceptId)
                        .where('procedure_occurrence.person_id', 'in', personSubQuery);
          ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'procedure_occurrence.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); 
          sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'procedure_occurrence.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); 
          break; 
        }
        default: throw new NotFoundException(`Domain '${domain}' not found.`);
      }
      // ✅ 4. await 및 reduce 로직을 헬퍼 함수 내부로 이동
      const [ageData, sexData] = await Promise.all([ageDataPromise, sexDataPromise]); 
      
      const age = ageData.reduce((acc, row: any) => { 
        const startAge = Number(row.age_group_floor) * 10; 
        if (startAge >= 0 && startAge < 200) { 
          acc[`${startAge}-${startAge + 9}`] = Number(row.count); 
        } 
        return acc; 
      }, {}); 
      
      const sex = sexData.reduce((acc, row: any) => { 
        acc[row.gender] = Number(row.count); 
        return acc; 
      }, {});

      return { age, sex };

    }; // --- 헬퍼 함수 정의 끝 ---

    // ✅ 5. 메인 함수 로직: 헬퍼 함수를 병렬로 실행하고 결과 매핑
    const cohortsToRun = (cohortIds && cohortIds.length > 0) ? cohortIds : ['all'];

    const demographicPromises = cohortsToRun.map(cid => getDemographicsForCohort(cid));
    const demographicResults = await Promise.all(demographicPromises);

    const demographicsMap: { [cohortId: string]: DemographicsDto } = {};
    demographicResults.forEach((result, index) => {
      const cohortId = cohortsToRun[index];
      demographicsMap[cohortId] = result;
    });

    return { 
      conceptId, 
      conceptName: conceptNameResult.target_concept_name, 
      demographics: demographicsMap // ✅ DTO 구조에 맞게 반환
    };
   }

  // ✅ getConceptValueDistribution 수정
  async getConceptValueDistribution(
    measurementConceptId: string, 
    cohortIds?: string[]
  ): Promise<{[key: string]: ValueDistributionResponseDto[]}> { // ✅ 반환 타입 객체로 수정
    
    // --- 헬퍼 함수 정의: 단일 코호트(또는 'all')에 대한 Value Distribution 조회 ---
    const getValuesForCohort = async (cohortId: string): Promise<ValueDistributionResponseDto[]> => {
      
      const isAllCohorts = cohortId === 'all';

      // ✅ 1. (수정) person_id 하위 쿼리 정의 (단일 코호트 기준)
      const personSubQuery = isAllCohorts
        ? this.db.selectFrom('person').select('person_id').distinct()
        : this.db.selectFrom('snuh_cohort_detail').select('person_id').distinct().where('cohort_id', '=', cohortId);

      // ✅ 2. (유지) 이하 모든 로직은 personSubQuery에 의존하므로 수정 없이 헬퍼 함수 내에서 그대로 실행
      
      // 2. (수정) 백분위수(p05, p95) 및 bin 크기를 DB에서 계산하는 CTE 정의
      const percentileCte = this.db
        .selectFrom('measurement as m')
        .select([
          sql`coalesce(m.unit_concept_id, -1)`.as('ucid'),
          sql`quantile(0.05)(m.value_as_number)`.as('p05'),
          sql`quantile(0.95)(m.value_as_number)`.as('p95'),
          sql`greatest(round((p95 - p05) / 10), 1)`.as('bin_size')
        ])
        .where('m.measurement_concept_id', '=', measurementConceptId)
        .where('m.value_as_number', 'is not', null)
  .where(sql<boolean>`isFinite(m.value_as_number)`)
        .where('m.person_id', 'in', personSubQuery) // ✅ 이 부분은 이미 personSubQuery를 참조
        .groupBy('ucid')
        .having(sql<boolean>`p05 < p95`);
      
      // 3. (추가) DB에서 동적 binning 로직을 수행하기 위한 SQL 정의
      const bin_start_calc = sql`(up.p05 + floor((m.value_as_number - up.p05) / up.bin_size) * up.bin_size)`;
      
      const binLogic = sql<string>`
        CASE
          WHEN m.value_as_number < up.p05 THEN concat('< ', toString(round(up.p05, 1)))
          WHEN m.value_as_number >= up.p95 THEN concat('>= ', toString(round(up.p95, 1)))
          ELSE
            concat(
              toString(round(${bin_start_calc}, 1)),
              ' - ',
              toString(round(least(${bin_start_calc} + up.bin_size - 0.1, up.p95), 1))
            )
        END
      `.as('range_label');

      const sortOrderLogic = sql<number>`
        CASE
          WHEN m.value_as_number < up.p05 THEN -1
          WHEN m.value_as_number >= up.p95 THEN 99999
          ELSE round(${bin_start_calc}, 1) -- bin_start 값으로 정렬
        END
      `.as('sort_order');

      // 4. (수정) CTE를 사용하여 DB에서 모든 집계를 수행하는 메인 쿼리
      const dbResult = await this.db
        .with('unit_percentiles', (eb) => percentileCte)
        .selectFrom('measurement as m')
        .innerJoin('person as p', (join) => join.on(sql`toString(m.person_id)`, '=', sql`toString(p.person_id)`))
        .innerJoin('unit_percentiles as up', (join) => join.on(sql`coalesce(m.unit_concept_id, -1)`, '=', sql`up.ucid`))
        .select([
          'up.ucid as unit_concept_id',
          'p.gender_concept_id',
          binLogic,
          sortOrderLogic,
          sql`uniq(m.person_id)`.as('total_participant_count') 
        ])
        .where('m.measurement_concept_id', '=', measurementConceptId)
        .where('m.value_as_number', 'is not', null)
        .where(sql<boolean>`isFinite(m.value_as_number)`)      
        .where('m.person_id', 'in', personSubQuery) // ✅ 이 부분은 이미 personSubQuery를 참조
        .groupBy([
          'unit_concept_id',
          'p.gender_concept_id',
          'range_label',
          'sort_order'
        ])
        .execute();

      // 5. (수정) 집계된 결과(dbResult)를 DTO로 변환
      if (dbResult.length === 0) return [];

      const conceptIds = [...new Set(dbResult.flatMap(r => [
          String(r.unit_concept_id), 
          String(r.gender_concept_id)
      ]))]; 
      
      const concepts = await this.db.selectFrom('concept')
        .select(['concept_id', 'concept_name'])
        .where('concept_id', 'in', conceptIds)
        .execute();
      const conceptNameMap = new Map(concepts.map(c => [String(c.concept_id), c.concept_name]));

      const enrichedResult: ValueDistributionResponseDto[] = dbResult.map(r => ({
        unit_name: conceptNameMap.get(String(r.unit_concept_id)) || 'N/A',
        gender_name: conceptNameMap.get(String(r.gender_concept_id)) || 'N/A',
        range_label: r.range_label,
        sort_order: r.sort_order,
        total_participant_count: Number(r.total_participant_count)
      }));

      return enrichedResult.sort((a, b) => { 
        if (a.unit_name !== b.unit_name) return a.unit_name.localeCompare(b.unit_name); 
        if (a.gender_name !== b.gender_name) return a.gender_name.localeCompare(b.gender_name); 
        return a.sort_order - b.sort_order; 
      });
    }; // --- 헬퍼 함수 정의 끝 ---

    // ✅ 메인 함수 로직: 헬퍼 함수를 병렬로 실행
    const cohortsToRun = (cohortIds && cohortIds.length > 0) ? cohortIds : ['all'];

    const valuePromises = cohortsToRun.map(cid => getValuesForCohort(cid));
    const valueResults = await Promise.all(valuePromises);

    const finalResult: { [key: string]: ValueDistributionResponseDto[] } = {};
    valueResults.forEach((result, index) => {
      const cohortId = cohortsToRun[index];
      finalResult[cohortId] = result;
    });

    return finalResult;
   }


  // getDomainInfo (변경 없음)
  private getDomainInfo(domain: string) { /* ... unchanged ... */
    switch (domain.toLowerCase()) {
      case 'conditions': return { tableName: 'condition_occurrence', conceptColumn: 'condition_concept_id', dateColumn: 'condition_start_date' };
      case 'drugs': return { tableName: 'drug_exposure', conceptColumn: 'drug_concept_id', dateColumn: 'drug_exposure_start_date' };
      case 'measurements': return { tableName: 'measurement', conceptColumn: 'measurement_concept_id', dateColumn: 'measurement_date' };
      case 'procedures': return { tableName: 'procedure_occurrence', conceptColumn: 'procedure_concept_id', dateColumn: 'procedure_date' };
      default: throw new NotFoundException(`Domain '${domain}' not found.`);
    }
  }
}
// // src/data-browser.service.ts (이전 최종 완성본 - 전체 코드)

// import { Injectable, NotFoundException } from '@nestjs/common';
// import { Kysely, sql, SelectQueryBuilder } from 'kysely';
// import { Database } from '../db/types';
// import { ValueDistributionResponseDto, TopConceptDto } from './dto/data-browser.dto';

// // Interface matching the DTO structure for Value Distribution
// interface ValueDistributionResultForService extends Omit<ValueDistributionResponseDto, 'unit_name' | 'gender_name' | 'cohort_counts'> {
//   unit_concept_id: string;
//   gender_concept_id: string;
// }

// // TopConceptDto Structure - Simplified cohort counts
// interface TopConceptResultInternal {
//   concept_id: string;
//   concept_name: string;
//   total_participant_count: number;
//   vocabulary_counts?: { [vocabId: string]: number };
//   descendent_concept?: TopConceptResultInternal[];
//   target_concept_id?: string; // for source view
//   mapped_source_codes?: string[]; // for target view
// }

// // Interface for the aggregated counts object used internally
// interface AggregatedCountsInternalValue {
//     concept_id: string;
//     concept_name: string;
//     total_participant_count: number;
//     vocabulary_counts: { [key: string]: number };
//     person_ids?: Set<string>; 
//     cohort_vocabulary_counts?: { [key: string]: { [key: string]: number } };
//     target_concept_id?: string;
// }
// interface AggregatedCountsInternal {
//   [key: string]: AggregatedCountsInternalValue;
// }

// // Internal interface for Value Distribution (simplified)
// interface ValueDistributionResultInternal extends Omit<ValueDistributionResponseDto, 'unit_name' | 'gender_name' | 'cohort_counts'> {
//   unit_concept_id: string;
//   gender_concept_id: string;
// }


// @Injectable()
// export class DataBrowserService {
//   constructor(private readonly db: Kysely<Database>) {}

//   async getDomainSummary(keyword?: string, cohortIds?: string[]) {
//     const personSubQuery = cohortIds && cohortIds.length > 0 ? this.db.selectFrom('snuh_cohort_detail').select('person_id').where('cohort_id', 'in', cohortIds) : this.db.selectFrom('person').select('person_id');
//     let conceptSubQuery = this.db.selectFrom('snuh_concept').select('target_concept_id'); if (keyword) { conceptSubQuery = conceptSubQuery.where('target_concept_name', 'ilike', `%${keyword}%`); }
//     const domains = ['conditions', 'drugs', 'measurements', 'procedures'];
//     const results = await Promise.all(domains.map(async (domain) => {
//       let queryResult;
//       switch (domain) {
//         case 'conditions': queryResult = await this.db.selectFrom('condition_occurrence').select(eb => [eb.fn.count('person_id').distinct().as('participant_count'), eb.fn.count('condition_concept_id').distinct().as('concept_count')]).where('person_id', 'in', personSubQuery).where('condition_concept_id', 'in', conceptSubQuery).executeTakeFirstOrThrow(); break;
//         case 'drugs': queryResult = await this.db.selectFrom('drug_exposure').select(eb => [eb.fn.count('person_id').distinct().as('participant_count'), eb.fn.count('drug_concept_id').distinct().as('concept_count')]).where('person_id', 'in', personSubQuery).where('drug_concept_id', 'in', conceptSubQuery).executeTakeFirstOrThrow(); break;
//         case 'measurements': queryResult = await this.db.selectFrom('measurement').select(eb => [eb.fn.count('person_id').distinct().as('participant_count'), eb.fn.count('measurement_concept_id').distinct().as('concept_count')]).where('person_id', 'in', personSubQuery).where('measurement_concept_id', 'in', conceptSubQuery).executeTakeFirstOrThrow(); break;
//         case 'procedures': queryResult = await this.db.selectFrom('procedure_occurrence').select(eb => [eb.fn.count('person_id').distinct().as('participant_count'), eb.fn.count('procedure_concept_id').distinct().as('concept_count')]).where('person_id', 'in', personSubQuery).where('procedure_concept_id', 'in', conceptSubQuery).executeTakeFirstOrThrow(); break;
//         default: throw new NotFoundException(`Domain '${domain}' not found.`);
//       }
//       return { domain_name: domain, participant_count: Number(queryResult.participant_count), concept_count: Number(queryResult.concept_count) };
//     })); return results;
//    }

// async getTopConceptsForDomain(
//     domain: string, cohortIds?: string[], viewBy: 'source' | 'target' = 'target', limit: number = 50
//   ): Promise<TopConceptDto[]> {
//     const personSubQuery = cohortIds && cohortIds.length > 0
//       ? this.db.selectFrom('snuh_cohort_detail').select('person_id').distinct().where('cohort_id', 'in', cohortIds)
//       : this.db.selectFrom('person').select('person_id');

//     if (viewBy === 'source') {
//       let queryBuilder;
//       // ✅ domainConceptColumn 변수 추가 (target 뷰 로직과 동일)
//       let domainConceptColumn: string;

//       switch(domain) {
//         case 'conditions': 
//           domainConceptColumn = 'condition_concept_id';
//           queryBuilder = this.db.selectFrom('condition_occurrence as domain_table').innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'domain_table.condition_concept_id').innerJoin('concept as c', 'c.concept_id', 'sc.target_concept_id'); 
//           break;
//         case 'drugs': 
//           domainConceptColumn = 'drug_concept_id';
//           queryBuilder = this.db.selectFrom('drug_exposure as domain_table').innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'domain_table.drug_concept_id').innerJoin('concept as c', 'c.concept_id', 'sc.target_concept_id'); 
//           break;
//         case 'measurements': 
//           domainConceptColumn = 'measurement_concept_id';
//           queryBuilder = this.db.selectFrom('measurement as domain_table').innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'domain_table.measurement_concept_id').innerJoin('concept as c', 'c.concept_id', 'sc.target_concept_id'); 
//           break;
//         case 'procedures': 
//           domainConceptColumn = 'procedure_concept_id';
//           queryBuilder = this.db.selectFrom('procedure_occurrence as domain_table').innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'domain_table.procedure_concept_id').innerJoin('concept as c', 'c.concept_id', 'sc.target_concept_id'); 
//           break;
//         default: throw new NotFoundException(`Domain '${domain}' not found.`);
//       }

//       // ✅ 1. (수정) DB에서 발생 건수(occurrence_count) 집계
//       const results = await queryBuilder.select([
//             'sc.source_code as concept_id', 'sc.source_code_description as concept_name',
//             'sc.target_concept_id',
//             'c.vocabulary_id as omop_vocabulary_id',
//             // 'person_id' 대신 COUNT(*) 집계
//             (eb) => eb.fn.count('domain_table.person_id').as('occurrence_count')
//           ])
//           .where('domain_table.person_id', 'in', personSubQuery)
//           // ✅ GROUP BY 추가
//           .groupBy([
//             'sc.source_code', 'sc.source_code_description', 
//             'sc.target_concept_id', 'c.vocabulary_id'
//           ])
//           .orderBy('occurrence_count', 'desc')
//           .limit(5000) // 대규모 집계 결과 제한
//           .execute();

//       // ✅ 2. (수정) 집계된 결과를 바탕으로 객체 생성
//       const aggregatedCounts: AggregatedCountsInternal = results.reduce((acc, row: any) => {
//           const key = row.concept_id; // key = source_code
//           if (!acc[key]) {
//               acc[key] = {
//                   concept_id: key,
//                   concept_name: row.concept_name,
//                   total_participant_count: 0, // 3단계에서 채워짐
//                   vocabulary_counts: {},
//                   // person_ids Set 제거
//                   target_concept_id: row.target_concept_id
//               };
//           }
//           // DB에서 집계한 'occurrence_count' 사용
//           acc[key].vocabulary_counts[row.omop_vocabulary_id] = Number(row.occurrence_count);
//           return acc;
//       }, {});

//       if (Object.keys(aggregatedCounts).length === 0) return [];

//       // ✅ 3. (추가) 고유 환자 수(total_participant_count)를 위한 두 번째 쿼리
//       const topSourceCodes = Object.keys(aggregatedCounts);
//       let distinctTotalQuery;

//       // target 뷰와 동일한 2차 쿼리 로직
//       switch (domain) {
//           case 'conditions': 
//               distinctTotalQuery = this.db.selectFrom('condition_occurrence as dt')
//                   .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dt.condition_concept_id')
//                   .where('sc.source_code', 'in', topSourceCodes)
//                   .select(['sc.source_code as concept_id']);
//               break;
//           case 'drugs': 
//               distinctTotalQuery = this.db.selectFrom('drug_exposure as dt')
//                   .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dt.drug_concept_id')
//                   .where('sc.source_code', 'in', topSourceCodes)
//                   .select(['sc.source_code as concept_id']);
//               break;
//           case 'measurements': 
//               distinctTotalQuery = this.db.selectFrom('measurement as dt')
//                   .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dt.measurement_concept_id')
//                   .where('sc.source_code', 'in', topSourceCodes)
//                   .select(['sc.source_code as concept_id']);
//               break;
//           case 'procedures': 
//               distinctTotalQuery = this.db.selectFrom('procedure_occurrence as dt')
//                   .innerJoin('snuh_concept as sc', 'sc.target_concept_id', 'dt.procedure_concept_id')
//                   .where('sc.source_code', 'in', topSourceCodes)
//                   .select(['sc.source_code as concept_id']);
//               break;
//           default: throw new NotFoundException("Domain not found for distinct count");
//       }

//       distinctTotalQuery = distinctTotalQuery
//           .where('dt.person_id', 'in', personSubQuery)
//           .groupBy('sc.source_code') // source_code 기준으로 GROUP BY
//           .select(eb => eb.fn.count('dt.person_id').distinct().as('total_count'));

//      const totalCounts = await distinctTotalQuery.execute();
//      const totalCountsMap = new Map(totalCounts.map(row => [row.concept_id, Number(row.total_count)]));

//      // ✅ 4. (수정) 고유 환자 수 할당
//      Object.keys(aggregatedCounts).forEach(conceptId => {
//          aggregatedCounts[conceptId].total_participant_count = Number(totalCountsMap.get(conceptId)) || 0;
//          // 'person_ids' Set 삭제 로직 제거
//      });

//       // ✅ 5. (기존과 동일) 정렬 및 반환
//       const finalArray: AggregatedCountsInternalValue[] = Object.values(aggregatedCounts).sort(
//           (a, b) => b.total_participant_count - a.total_participant_count
//       );

//       return finalArray.slice(0, limit).map((item): TopConceptDto => ({
//           concept_id: item.concept_id,
//           concept_name: item.concept_name,
//           total_participant_count: item.total_participant_count,
//           vocabulary_counts: item.vocabulary_counts,
//           target_concept_id: item.target_concept_id,
//       }));

//     } else { // Target View
//       let queryBuilder: SelectQueryBuilder<any, any, any>;
//       let distinctCountsQueryBase: SelectQueryBuilder<any, any, any>;
//       const cohortIdLiteral = sql.literal('all').as('cohort_id');
//       let domainConceptColumn: string;

//       switch (domain) {
//         case 'conditions':
//           domainConceptColumn = 'condition_concept_id';
//           queryBuilder = this.db.selectFrom('condition_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.condition_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.condition_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null);
//           distinctCountsQueryBase = this.db.selectFrom('condition_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.condition_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2');
//           if (cohortIds && cohortIds.length > 0) { queryBuilder = queryBuilder.innerJoin('snuh_cohort_detail as cd', 'cd.person_id', 'dt.person_id').where('cd.cohort_id', 'in', cohortIds).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); } else { queryBuilder = queryBuilder.where('dt.person_id', 'in', personSubQuery).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); }
//           queryBuilder = queryBuilder.select(eb => eb.fn.count('dt.person_id').distinct().as('participant_count')); break;
//         case 'drugs': domainConceptColumn = 'drug_concept_id'; queryBuilder = this.db.selectFrom('drug_exposure as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.drug_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.drug_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null); distinctCountsQueryBase = this.db.selectFrom('drug_exposure as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.drug_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2'); if (cohortIds && cohortIds.length > 0) { queryBuilder = queryBuilder.innerJoin('snuh_cohort_detail as cd', 'cd.person_id', 'dt.person_id').where('cd.cohort_id', 'in', cohortIds).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); } else { queryBuilder = queryBuilder.where('dt.person_id', 'in', personSubQuery).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); } queryBuilder = queryBuilder.select(eb => eb.fn.count('dt.person_id').distinct().as('participant_count')); break;
//         case 'measurements': domainConceptColumn = 'measurement_concept_id'; queryBuilder = this.db.selectFrom('measurement as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.measurement_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.measurement_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null); distinctCountsQueryBase = this.db.selectFrom('measurement as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.measurement_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2'); if (cohortIds && cohortIds.length > 0) { queryBuilder = queryBuilder.innerJoin('snuh_cohort_detail as cd', 'cd.person_id', 'dt.person_id').where('cd.cohort_id', 'in', cohortIds).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); } else { queryBuilder = queryBuilder.where('dt.person_id', 'in', personSubQuery).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); } queryBuilder = queryBuilder.select(eb => eb.fn.count('dt.person_id').distinct().as('participant_count')); break;
//         case 'procedures': domainConceptColumn = 'procedure_concept_id'; queryBuilder = this.db.selectFrom('procedure_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.procedure_concept_id').innerJoin('concept as c1', 'c1.concept_id', 'cr.concept_id_1').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2').where('dt.procedure_concept_id', '!=', '0').where('cr.relationship_id', '=', 'Maps to').where('cr.invalid_reason', 'is', null).where('c1.invalid_reason', 'is', null).where('c2.standard_concept', '=', 'S').where('c2.invalid_reason', 'is', null); distinctCountsQueryBase = this.db.selectFrom('procedure_occurrence as dt').innerJoin('concept_relationship as cr', 'cr.concept_id_1', 'dt.procedure_concept_id').innerJoin('concept as c2', 'c2.concept_id', 'cr.concept_id_2'); if (cohortIds && cohortIds.length > 0) { queryBuilder = queryBuilder.innerJoin('snuh_cohort_detail as cd', 'cd.person_id', 'dt.person_id').where('cd.cohort_id', 'in', cohortIds).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); } else { queryBuilder = queryBuilder.where('dt.person_id', 'in', personSubQuery).groupBy(['c2.concept_id', 'c1.vocabulary_id']).select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']); } queryBuilder = queryBuilder.select(eb => eb.fn.count('dt.person_id').distinct().as('participant_count')); break;
//         default: throw new NotFoundException(`Domain '${domain}' not found.`);
//       }

//       // Group by Standard Concept ID AND Source Vocabulary ID
//       if (cohortIds && cohortIds.length > 0) {
//         queryBuilder = queryBuilder.innerJoin('snuh_cohort_detail as cd', 'cd.person_id', 'dt.person_id')
//             .where('cd.cohort_id', 'in', cohortIds)
//             .groupBy(['c2.concept_id', 'c1.vocabulary_id'])
//             .select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']);
//       } else {
//         queryBuilder = queryBuilder.where('dt.person_id', 'in', personSubQuery)
//             .groupBy(['c2.concept_id', 'c1.vocabulary_id'])
//             .select(['c2.concept_id as concept_id', 'c1.vocabulary_id as source_vocabulary_id']);
//       }
//       queryBuilder = queryBuilder.select(eb => eb.fn.count('dt.person_id').distinct().as('participant_count'));


//       const counts = await queryBuilder
//         .orderBy('participant_count', 'desc')
//         .limit(3000 * (cohortIds?.length || 1))
//         .execute();

//       if (counts.length === 0) return [];

//       const aggregatedCounts: AggregatedCountsInternal = counts.reduce((acc, row: any) => {
//         const conceptId = row.concept_id; 
//         const vocabId = row.source_vocabulary_id; 
//         const count = Number(row.participant_count);
//         if (!acc[conceptId]) {
//             acc[conceptId] = {
//                 concept_id: conceptId, concept_name: '', total_participant_count: 0,
//                 vocabulary_counts: {}, 
//             };
//         }
//         acc[conceptId].vocabulary_counts[vocabId] = (acc[conceptId].vocabulary_counts[vocabId] || 0) + count;
//         return acc;
//        }, {});

//        // --- Create a query for TOTAL distinct count per concept ---
//       let distinctTotalQuery;
//               switch (domain) {
//                   case 'conditions': 
//                       distinctTotalQuery = this.db.selectFrom('condition_occurrence as dt')
//                           .where('dt.condition_concept_id', 'in', Object.keys(aggregatedCounts)) // ✅ 수정됨
//                           .select(['dt.condition_concept_id as concept_id']); 
//                       break;
//                   case 'drugs': 
//                       distinctTotalQuery = this.db.selectFrom('drug_exposure as dt')
//                           .where('dt.drug_concept_id', 'in', Object.keys(aggregatedCounts)) // ✅ 수정됨
//                           .select(['dt.drug_concept_id as concept_id']); 
//                       break;
//                   case 'measurements': 
//                       distinctTotalQuery = this.db.selectFrom('measurement as dt')
//                           .where('dt.measurement_concept_id', 'in', Object.keys(aggregatedCounts)) // ✅ 수정됨
//                           .select(['dt.measurement_concept_id as concept_id']); 
//                       break;
//                   case 'procedures': 
//                       distinctTotalQuery = this.db.selectFrom('procedure_occurrence as dt')
//                           .where('dt.procedure_concept_id', 'in', Object.keys(aggregatedCounts)) // ✅ 수정됨
//                           .select(['dt.procedure_concept_id as concept_id']); 
//                       break;
//                   default: throw new NotFoundException("Domain not found for distinct count");
//               }
//         distinctTotalQuery = distinctTotalQuery
//             .where('dt.person_id', 'in', personSubQuery)
//             .groupBy('concept_id')
//             .select(eb => eb.fn.count('dt.person_id').distinct().as('total_count'));

//        const totalCounts = await distinctTotalQuery.execute();
//        const totalCountsMap = new Map(totalCounts.map(row => [row.concept_id, Number(row.total_count)]));

//        // Assign total counts
//        Object.keys(aggregatedCounts).forEach(conceptId => {
// aggregatedCounts[conceptId].total_participant_count = Number(totalCountsMap.get(conceptId)) || 0;       });

//        // ✅ Fetch source codes (mapped_source_codes) from snuh_concept
//        const topConceptIds = Object.keys(aggregatedCounts);
//        const sourceCodeMappings = await this.db.selectFrom('snuh_concept')
//            .select(['target_concept_id', 'source_code'])
//            .where('target_concept_id', 'in', topConceptIds)
//            .execute();

//        const sourceCodeMap = sourceCodeMappings.reduce((map, row) => {
//            if (!map.has(row.target_concept_id)) { map.set(row.target_concept_id, []); }
//            map.get(row.target_concept_id)!.push(row.source_code);
//            return map;
//        }, new Map<string, string[]>());

//        const topConcepts: AggregatedCountsInternalValue[] = Object.values(aggregatedCounts).sort((a, b) => b.total_participant_count - a.total_participant_count);
//        const finalTopConceptIds = topConcepts.slice(0, limit * 2).map(c => c.concept_id);

//        const relationships = await this.db.selectFrom('concept_ancestor').select(['ancestor_concept_id', 'descendant_concept_id']).where('min_levels_of_separation', '=', 1).where('ancestor_concept_id', 'in', finalTopConceptIds).where('descendant_concept_id', 'in', finalTopConceptIds).execute();
//        const conceptNames = await this.db.selectFrom('concept').select(['concept_id', 'concept_name']).where('concept_id', 'in', finalTopConceptIds).execute(); const conceptNameMap = new Map(conceptNames.map(c => [c.concept_id, c.concept_name]));
       
//        const nodes = new Map<string, TopConceptResultInternal>();

//        // Build final node structure
//        for (const concept of topConcepts) {
//            if (!finalTopConceptIds.includes(concept.concept_id)) continue;
//            nodes.set(concept.concept_id, {
//                concept_id: concept.concept_id,
//                concept_name: conceptNameMap.get(concept.concept_id) || 'Unknown Concept',
//                total_participant_count: concept.total_participant_count,
//                vocabulary_counts: concept.vocabulary_counts,
//                mapped_source_codes: sourceCodeMap.get(concept.concept_id) || [], // ✅ Add mapped source codes
//                descendent_concept: []
//             });
//         }
//        const rootNodes = new Set(finalTopConceptIds);
//        for (const rel of relationships) { const parent = nodes.get(rel.ancestor_concept_id); const child = nodes.get(rel.descendant_concept_id); if (parent && child) { (parent.descendent_concept ??= []).push(child); rootNodes.delete(rel.descendant_concept_id); } }
//        const finalResult = Array.from(rootNodes).map(id => nodes.get(id)!);
//        finalResult.sort((a, b) => b.total_participant_count - a.total_participant_count);

//       // ✅ Map to TopConceptDto structure
//       return finalResult.slice(0, limit).map((item): TopConceptDto => ({
//         concept_id: item.concept_id,
//         concept_name: item.concept_name,
//         total_participant_count: item.total_participant_count,
//         vocabulary_counts: item.vocabulary_counts,
//         mapped_source_codes: item.mapped_source_codes,
//         descendent_concept: item.descendent_concept?.map(d => d as TopConceptDto)
//       }));
//     }
//   }

//   async getConceptDetails(domain: string, conceptId: string, cohortIds?: string[]) { /* ... unchanged ... */
//     const { dateColumn } = this.getDomainInfo(domain); const conceptNameResult = await this.db.selectFrom('snuh_concept').select('target_concept_name').where('target_concept_id', '=', conceptId).executeTakeFirst(); if (!conceptNameResult) { throw new NotFoundException(`Concept ID ${conceptId} not found.`); }
//     let ageDataPromise, sexDataPromise;
//     switch (domain) {
//       case 'conditions': { let q = this.db.selectFrom('condition_occurrence').where('condition_concept_id', '=', conceptId); if (cohortIds && cohortIds.length > 0) { q = q.where('person_id', 'in', this.db.selectFrom('snuh_cohort_detail').select('person_id').where('cohort_id', 'in', cohortIds)); } ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'condition_occurrence.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'condition_occurrence.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); break; }
//       case 'drugs': { let q = this.db.selectFrom('drug_exposure').where('drug_concept_id', '=', conceptId); if (cohortIds && cohortIds.length > 0) { q = q.where('person_id', 'in', this.db.selectFrom('snuh_cohort_detail').select('person_id').where('cohort_id', 'in', cohortIds)); } ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'drug_exposure.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'drug_exposure.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); break; }
//       case 'measurements': { let q = this.db.selectFrom('measurement').where('measurement_concept_id', '=', conceptId); if (cohortIds && cohortIds.length > 0) { q = q.where('person_id', 'in', this.db.selectFrom('snuh_cohort_detail').select('person_id').where('cohort_id', 'in', cohortIds)); } ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'measurement.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'measurement.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); break; }
//       case 'procedures': { let q = this.db.selectFrom('procedure_occurrence').where('procedure_concept_id', '=', conceptId); if (cohortIds && cohortIds.length > 0) { q = q.where('person_id', 'in', this.db.selectFrom('snuh_cohort_detail').select('person_id').where('cohort_id', 'in', cohortIds)); } ageDataPromise = q.innerJoin('person as p', 'p.person_id', 'procedure_occurrence.person_id').where(sql.ref(dateColumn), 'is not', null).where('p.year_of_birth', 'is not', null).where('p.year_of_birth', '>', 1900).select([sql<number>`floor((year(${sql.ref(dateColumn)}) - p.year_of_birth) / 10)`.as('age_group_floor'), sql<number>`count(DISTINCT p.person_id)`.as('count')]).groupBy('age_group_floor').orderBy('age_group_floor').execute(); sexDataPromise = q.innerJoin('person as p', 'p.person_id', 'procedure_occurrence.person_id').innerJoin('concept as c', 'c.concept_id', 'p.gender_concept_id').select(['c.concept_name as gender', eb => eb.fn.count('p.person_id').distinct().as('count')]).groupBy('gender').execute(); break; }
//       default: throw new NotFoundException(`Domain '${domain}' not found.`);
//     }
//     const [ageData, sexData] = await Promise.all([ageDataPromise, sexDataPromise]); const age = ageData.reduce((acc, row: any) => { const startAge = Number(row.age_group_floor) * 10; if (startAge >= 0 && startAge < 200) { acc[`${startAge}-${startAge + 9}`] = Number(row.count); } return acc; }, {}); const sex = sexData.reduce((acc, row: any) => { acc[row.gender] = Number(row.count); return acc; }, {});
//     return { conceptId, conceptName: conceptNameResult.target_concept_name, demographics: { age, sex } };
//    }

// async getConceptValueDistribution(measurementConceptId: string, cohortIds?: string[]): Promise<ValueDistributionResponseDto[]> {
    
//     // 1. (수정) 코호트 또는 전체 인원에 대한 person_id 하위 쿼리 정의
//     const personSubQuery = (cohortIds && cohortIds.length > 0)
//       ? this.db.selectFrom('snuh_cohort_detail').select('person_id').distinct().where('cohort_id', 'in', cohortIds)
//       : this.db.selectFrom('person').select('person_id').distinct();

//     // 2. (수정) 백분위수(p05, p95) 및 bin 크기를 DB에서 계산하는 CTE 정의
//     const percentileCte = this.db
//       .selectFrom('measurement as m')
//       .select([
//         sql`coalesce(m.unit_concept_id, -1)`.as('ucid'),
//         // ClickHouse의 quantile 함수 사용
//         sql`quantile(0.05)(m.value_as_number)`.as('p05'),
//         sql`quantile(0.95)(m.value_as_number)`.as('p95'),
//         // ClickHouse의 greatest, round 함수 사용 (원본 로직과 동일)
//         sql`greatest(round((p95 - p05) / 10), 1)`.as('bin_size')
//       ])
//       .where('m.measurement_concept_id', '=', measurementConceptId)
//       .where('m.value_as_number', 'is not', null)
// .where(sql<boolean>`isFinite(m.value_as_number)`) // '!= inf' 보다 안전함      .where('m.person_id', 'in', personSubQuery)
//       .groupBy('ucid')
//       .having(sql<boolean>`p05 < p95`); // 유효한 범위만 선택
//     // 3. (추가) DB에서 동적 binning 로직을 수행하기 위한 SQL 정의
//     // 원본 JS 로직: binStart = p05 + Math.floor((value - p05) / dynamicBinSize) * dynamicBinSize
//     const bin_start_calc = sql`(up.p05 + floor((m.value_as_number - up.p05) / up.bin_size) * up.bin_size)`;
    
//     // 원본 JS 로직: rangeLabel
//     const binLogic = sql<string>`
//       CASE
//         WHEN m.value_as_number < up.p05 THEN concat('< ', toString(round(up.p05, 1)))
//         WHEN m.value_as_number >= up.p95 THEN concat('>= ', toString(round(up.p95, 1)))
//         ELSE
//           concat(
//             toString(round(${bin_start_calc}, 1)),
//             ' - ',
//             // 원본 JS 로직: binEnd = Math.min(binStart + dynamicBinSize - 0.1, p95)
//             toString(round(least(${bin_start_calc} + up.bin_size - 0.1, up.p95), 1))
//           )
//       END
//     `.as('range_label');

//     // 원본 JS 로직: sort_order
//     const sortOrderLogic = sql<number>`
//       CASE
//         WHEN m.value_as_number < up.p05 THEN -1
//         WHEN m.value_as_number >= up.p95 THEN 99999
//         ELSE round(${bin_start_calc}, 1) -- bin_start 값으로 정렬
//       END
//     `.as('sort_order');

//     // 4. (수정) CTE를 사용하여 DB에서 모든 집계를 수행하는 메인 쿼리
//     const dbResult = await this.db
//       .with('unit_percentiles', (eb) => percentileCte) // CTE 사용
//       .selectFrom('measurement as m')
//       .innerJoin('person as p', (join) => join.on(sql`toString(m.person_id)`, '=', sql`toString(p.person_id)`))
//       .innerJoin('unit_percentiles as up', (join) => join.on(sql`coalesce(m.unit_concept_id, -1)`, '=', sql`up.ucid`))
//       .select([
//         'up.ucid as unit_concept_id',
//         'p.gender_concept_id',
//         binLogic,         // DB에서 계산된 bin_label
//         sortOrderLogic,   // DB에서 계산된 sort_order
//         // ClickHouse의 uniq 함수로 고유 환자 수 계산
//         sql`uniq(m.person_id)`.as('total_participant_count') 
//       ])
//       .where('m.measurement_concept_id', '=', measurementConceptId)
//       .where('m.value_as_number', 'is not', null)
//       .where(sql<boolean>`isFinite(m.value_as_number)`)      
//       .where('m.person_id', 'in', personSubQuery)
//       .groupBy([ // 모든 집계 키로 그룹화
//         'unit_concept_id',
//         'p.gender_concept_id',
//         'range_label',
//         'sort_order'
//       ])
//       .execute(); // 👈 이제 원시 데이터가 아닌 집계된 결과만 반환됨

//     // 5. (수정) 집계된 결과(dbResult)를 DTO로 변환 (기존 후처리 로직 재사용)
//     if (dbResult.length === 0) return [];

//     const conceptIds = [...new Set(dbResult.flatMap(r => [
//         String(r.unit_concept_id), 
//         String(r.gender_concept_id)
//     ]))]; 
    
//     const concepts = await this.db.selectFrom('concept')
//       .select(['concept_id', 'concept_name'])
//       .where('concept_id', 'in', conceptIds)
//       .execute();
//     const conceptNameMap = new Map(concepts.map(c => [String(c.concept_id), c.concept_name]));

//     const enrichedResult: ValueDistributionResponseDto[] = dbResult.map(r => ({
//       unit_name: conceptNameMap.get(String(r.unit_concept_id)) || 'N/A',
//       gender_name: conceptNameMap.get(String(r.gender_concept_id)) || 'N/A',
//       range_label: r.range_label,
//       sort_order: r.sort_order,
//       total_participant_count: Number(r.total_participant_count) // 타입을 숫자로 변환
//     }));

//     // 원본과 동일한 정렬 로직
//     return enrichedResult.sort((a, b) => { 
//       if (a.unit_name !== b.unit_name) return a.unit_name.localeCompare(b.unit_name); 
//       if (a.gender_name !== b.gender_name) return a.gender_name.localeCompare(b.gender_name); 
//       return a.sort_order - b.sort_order; 
//     });
//    }


//   private getDomainInfo(domain: string) { /* ... unchanged ... */
//     switch (domain.toLowerCase()) {
//       case 'conditions': return { tableName: 'condition_occurrence', conceptColumn: 'condition_concept_id', dateColumn: 'condition_start_date' };
//       case 'drugs': return { tableName: 'drug_exposure', conceptColumn: 'drug_concept_id', dateColumn: 'drug_exposure_start_date' };
//       case 'measurements': return { tableName: 'measurement', conceptColumn: 'measurement_concept_id', dateColumn: 'measurement_date' };
//       case 'procedures': return { tableName: 'procedure_occurrence', conceptColumn: 'procedure_concept_id', dateColumn: 'procedure_date' };
//       default: throw new NotFoundException(`Domain '${domain}' not found.`);
//     }
//   }
// }



