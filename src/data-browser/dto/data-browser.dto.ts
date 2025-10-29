// src/data-browser/dto/data-browser.dto.ts (수정본)

import { ApiProperty, PartialType, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsArray, IsIn, MaxLength } from 'class-validator';

// Helper (unchanged)
const TransformToArray = () => Transform(({ value }) => { /* ... */
  if (value === null || value === undefined || value === '') { return undefined; } if (Array.isArray(value)) { return value.filter(item => item !== null && item !== undefined && item !== ''); } return String(value).split(',').map(item => item.trim()).filter(item => item !== '');
});

// DomainSummaryDto (unchanged)
export class DomainSummaryDto { @ApiProperty() domain_name: string; @ApiProperty() participant_count: number; @ApiProperty() concept_count: number; }

// SummaryQueryDto (unchanged)
export class SummaryQueryDto { @ApiProperty({ required: false }) @IsOptional() @IsString() keyword?: string; @ApiProperty({ required: false, type: [String], description: 'Comma-separated cohort IDs (max 5)' }) @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(36, { each: true }) @TransformToArray() cohortIds?: string[]; }

// TopConceptsParamsDto (unchanged)
export class TopConceptsParamsDto { @ApiProperty({ enum: ['conditions', 'drugs', 'measurements', 'procedures'] }) @IsIn(['conditions', 'drugs', 'measurements', 'procedures']) domain: string; }

// TopConceptsQueryDto (viewBy 제거 - unchanged)
export class TopConceptsQueryDto { 
  @ApiProperty({ required: false, type: [String], description: 'Comma-separated cohort IDs (max 5)' }) 
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(36, { each: true }) @TransformToArray() 
  cohortIds?: string[]; 
}
export class CohortQueryDto {
  @ApiProperty({ 
    required: false, 
    type: [String], // ✅ Swagger UI를 배열 입력으로 변경
    description: 'Comma-separated cohort IDs (max 5)' 
  }) 
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(36, { each: true }) 
  @TransformToArray() // ✅ Transform 파이프 적용
  cohortIds?: string[]; 
}
// TopConceptDto (unchanged)
export class TopConceptDto {
  @ApiProperty()
  concept_id: string; 
  @ApiProperty()
  concept_name: string;
  @ApiProperty()
  total_participant_count: number; 
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'number' }})
  vocabulary_counts?: { [vocabId: string]: number };
  @ApiPropertyOptional({ type: () => [TopConceptDto] })
  descendent_concept?: TopConceptDto[];
  @ApiPropertyOptional({ description: 'The target OMOP concept ID this source code maps to (source view only)' })
  target_concept_id?: string;
  @ApiPropertyOptional({ type: [String], description: 'List of source codes from snuh_concept that map to this standard concept (target view only)' })
  mapped_source_codes?: string[];
}

// ❌ (삭제) TopConceptsResponseDto 클래스 전체 제거
// export class TopConceptsResponseDto { ... }

// ConceptDetailParamsDto (unchanged)
export class ConceptDetailParamsDto { @ApiProperty({ enum: ['conditions', 'drugs', 'measurements', 'procedures'] }) @IsIn(['conditions', 'drugs', 'measurements', 'procedures']) domain: string; @ApiProperty() @IsString() conceptId: string; }

// DemographicsDto (unchanged - private class)
class DemographicsDto { @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }}) age: { [ageRange: string]: number }; @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }}) sex: { [gender: string]: number }; }

// ✅ ConceptDetailResponseDto (이 코드는 올바르므로 그대로 유지)
export class ConceptDetailResponseDto { 
  @ApiProperty() 
  conceptId: string; 
  
  @ApiProperty() 
  conceptName: string; 
  
  @ApiProperty({ 
    type: 'object', 
    description: 'Demographics 데이터가 코호트 ID ("all"은 전체)로 매핑된 객체',
    // ✅ 'additionalProperties'를 사용하여 맵(객체)의 값 타입을 정의합니다.
    additionalProperties: { $ref: getSchemaPath(DemographicsDto) } 
  }) 
  demographics: { [cohortId: string]: DemographicsDto }; 
}

// ValueDistributionParamsDto (unchanged)
export class ValueDistributionParamsDto { @ApiProperty() @IsString() conceptId: string; }

// ValueDistributionResponseDto (unchanged)
export class ValueDistributionResponseDto {
    @ApiProperty()
    unit_name: string;
    @ApiProperty()
    gender_name: string;
    @ApiProperty()
    range_label: string;
    @ApiProperty()
    sort_order: number;
    @ApiProperty()
    total_participant_count: number;
}

// ❌ (삭제) ValueDistributionMapResponseDto 클래스 전체 제거
// export class ValueDistributionMapResponseDto { ... }
// // src/data-browser/dto/data-browser.dto.ts (수정본)

// import { ApiProperty, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
// import { Transform } from 'class-transformer';
// import { IsOptional, IsString, IsArray, IsIn, MaxLength } from 'class-validator';

// // Helper (unchanged)
// const TransformToArray = () => Transform(({ value }) => { /* ... */
//   if (value === null || value === undefined || value === '') { return undefined; } if (Array.isArray(value)) { return value.filter(item => item !== null && item !== undefined && item !== ''); } return String(value).split(',').map(item => item.trim()).filter(item => item !== '');
// });

// // DomainSummaryDto (unchanged)
// export class DomainSummaryDto { @ApiProperty() domain_name: string; @ApiProperty() participant_count: number; @ApiProperty() concept_count: number; }

// // SummaryQueryDto (unchanged)
// export class SummaryQueryDto { @ApiProperty({ required: false }) @IsOptional() @IsString() keyword?: string; @ApiProperty({ required: false, type: [String], description: 'Comma-separated cohort IDs (max 5)' }) @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(36, { each: true }) @TransformToArray() cohortIds?: string[]; }

// // TopConceptsParamsDto (unchanged)
// export class TopConceptsParamsDto { @ApiProperty({ enum: ['conditions', 'drugs', 'measurements', 'procedures'] }) @IsIn(['conditions', 'drugs', 'measurements', 'procedures']) domain: string; }

// // TopConceptsQueryDto (unchanged)
// export class TopConceptsQueryDto { @ApiProperty({ required: false, type: [String], description: 'Comma-separated cohort IDs (max 5)' }) @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(36, { each: true }) @TransformToArray() cohortIds?: string[]; @ApiProperty({ required: false, enum: ['source', 'target'], description: "View by 'source' (SNUH) or 'target' (OMOP Standard)" }) @IsOptional() @IsIn(['source', 'target']) viewBy?: 'source' | 'target'; }

// // ✅ TopConceptDto - 수정: cohort_counts 제거, target_concept_id, mapped_source_codes 추가
// export class TopConceptDto {
//   @ApiProperty()
//   concept_id: string; // source_code (source view) or target_concept_id (target view)

//   @ApiProperty()
//   concept_name: string;

//   @ApiProperty()
//   total_participant_count: number; // 'all' count for selected cohorts

//   @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'number' }})
//   vocabulary_counts?: { [vocabId: string]: number };

//   @ApiPropertyOptional({ type: () => [TopConceptDto] })
//   descendent_concept?: TopConceptDto[];

//   @ApiPropertyOptional({ description: 'The target OMOP concept ID this source code maps to (source view only)' })
//   target_concept_id?: string; // ✅ (Source View)

//   @ApiPropertyOptional({ type: [String], description: 'List of source codes from snuh_concept that map to this standard concept (target view only)' })
//   mapped_source_codes?: string[]; // ✅ (Target View)
// }

// // ConceptDetailParamsDto (unchanged)
// export class ConceptDetailParamsDto { @ApiProperty({ enum: ['conditions', 'drugs', 'measurements', 'procedures'] }) @IsIn(['conditions', 'drugs', 'measurements', 'procedures']) domain: string; @ApiProperty() @IsString() conceptId: string; }

// // DemographicsDto & ConceptDetailResponseDto (unchanged)
// class DemographicsDto { @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }}) age: { [ageRange: string]: number }; @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }}) sex: { [gender: string]: number }; }
// export class ConceptDetailResponseDto { @ApiProperty() conceptId: string; @ApiProperty() conceptName: string; @ApiProperty() demographics: DemographicsDto; }

// // ValueDistributionParamsDto (unchanged)
// export class ValueDistributionParamsDto { @ApiProperty() @IsString() conceptId: string; }

// // ✅ ValueDistributionResponseDto - 수정: cohort_counts 제거
// export class ValueDistributionResponseDto {
//     @ApiProperty()
//     unit_name: string;
//     @ApiProperty()
//     gender_name: string;
//     @ApiProperty()
//     range_label: string;
//     @ApiProperty()
//     sort_order: number;
//     @ApiProperty()
//     total_participant_count: number;
// }


