import { Injectable, NotFoundException } from '@nestjs/common';
import { getBaseDB } from '../query-builder/base';
import {
  ConceptResponseDto,
  ConceptSearchResponseDto,
  DomainType,
} from './dto/concept.dto';
import { buildSearchConceptQuery } from 'src/query-builder/concept';
import { sql } from 'kysely';

@Injectable()
export class ConceptService {
  async searchConcepts(
    table: string,
    column: string,
    query?: string,
    source_code?: string,
    source_code_description?: string,
    target_concept_id?: string,
    target_concept_name?: string,
    vocabulary_id?: string,
    page: number = 0,
    limit: number = 100,
  ): Promise<ConceptSearchResponseDto> {
    const offset = page * limit;
    
    query = query?.trim() || '';
    source_code = source_code?.trim() || '';
    source_code_description = source_code_description?.trim() || '';
    target_concept_id = target_concept_id?.trim() || '';
    target_concept_name = target_concept_name?.trim() || '';
    vocabulary_id = vocabulary_id?.trim() || '';

    const isInteger = !isNaN(Number(query));

    let subQuery = buildSearchConceptQuery(getBaseDB(), {table, column, database: process.env.DB_TYPE})
    let conceptQuery = getBaseDB().selectFrom('snuh_concept').selectAll().where('target_concept_id', 'in', subQuery);

    // 검색어가 있는 경우에만 검색 조건 추가
    if (query) {
      if(isInteger){
        conceptQuery = conceptQuery.where((eb) => eb.or([
          eb(sql`CAST(target_concept_id AS String)`, 'ilike', `%${query.replaceAll('%', '%%')}%`),
        ]));
      } else{
        conceptQuery = conceptQuery.where((eb) => eb.or([
          eb('source_code', 'ilike', `%${query.replaceAll('%', '%%')}%`),
          eb('target_concept_name', 'ilike', `%${query.replaceAll('%', '%%')}%`),
          eb('source_code_description', 'ilike', `%${query.replaceAll('%', '%%')}%`),
        ]));
      }
    }

    // 2차 필터링
    if(source_code){
      conceptQuery = conceptQuery.where(
        'source_code',
        'ilike',
        `%${source_code.replaceAll('%', '%%')}%`
      )
    }
    if(source_code_description){
      conceptQuery = conceptQuery.where(
        'source_code_description',
        'ilike',
        `%${source_code_description.replaceAll('%', '%%')}%`
      )
    }
    if(target_concept_id){
      conceptQuery = conceptQuery.where(
        sql`CAST(target_concept_id AS String)`,
        'like',
        `%${target_concept_id.replaceAll('%', '%%')}%`
      )
    }
    if(target_concept_name){
      conceptQuery = conceptQuery.where(
        'target_concept_name',
        'ilike',
        `%${target_concept_name.replaceAll('%', '%%')}%`
      )
    }
    if(vocabulary_id){
      conceptQuery = conceptQuery.where(
        'target_vocabulary_id',
        'ilike',
        `%${vocabulary_id.replaceAll('%', '%%')}%`
      )
    }

    // 총 결과 수를 계산하기 위한 쿼리
    let countQuery = getBaseDB()
      .selectFrom('snuh_concept')
      .select(({ fn }) => [fn.count('source_code').as('total')])
      .where('target_concept_id', 'in', subQuery);

    // 검색어가 있는 경우에만 검색 조건 추가
    if (query) {
      if(isInteger){
        conceptQuery = conceptQuery.where((eb) => eb.or([
          eb(sql`CAST(target_concept_id AS String)`, 'ilike', `%${query.replaceAll('%', '%%')}%`),
        ]));
      } else{
        countQuery = countQuery.where((eb) => eb.or([
          eb('source_code', 'ilike', `%${query.replaceAll('%', '%%')}%`),
          eb('target_concept_name', 'ilike', `%${query.replaceAll('%', '%%')}%`),
          eb('source_code_description', 'ilike', `%${query.replaceAll('%', '%%')}%`),
        ]));
      }
    }

    // 2차 필터링
    if(source_code){
      countQuery = countQuery.where(
        'source_code',
        'ilike',
        `%${source_code.replaceAll('%', '%%')}%`
      )
    }
    if(source_code_description){
      countQuery = countQuery.where(
        'source_code_description',
        'ilike',
        `%${source_code_description.replaceAll('%', '%%')}%`
      )
    }
    if(target_concept_id){
      countQuery = countQuery.where(
        sql`CAST(target_concept_id AS String)`,
        'like',
        `%${target_concept_id.replaceAll('%', '%%')}%`
      )
    }
    if(target_concept_name){
      countQuery = countQuery.where(
        'target_concept_name',
        'ilike',
        `%${target_concept_name.replaceAll('%', '%%')}%`
      )
    }

    // 두 쿼리를 병렬로 실행
    const [concepts, countResult] = await Promise.all([
      conceptQuery.limit(Number(limit)).offset(offset).orderBy('source_code').execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      concepts: concepts.map((concept) => ({
        source_code: concept.source_code,
        source_code_description: concept.source_code_description,
        target_concept_id: concept.target_concept_id,
        target_concept_name: concept.target_concept_name,
        domain_id: concept.domain_id,
        vocabulary_id: concept.target_vocabulary_id,
      })),
      total: Number(countResult?.total || 0),
      page: page,
      limit: limit,
    };
  }

  // async getConceptById(conceptId: string): Promise<ConceptResponseDto> {
  //   const concept = await getBaseDB()
  //     .selectFrom('snuh_concept')
  //     .selectAll()
  //     .where('concept_id', '=', conceptId)
  //     .executeTakeFirst();

  //   if (!concept) {
  //     throw new NotFoundException(`Concept with ID ${conceptId} not found`);
  //   }

  //   return concept;
  // }
}
