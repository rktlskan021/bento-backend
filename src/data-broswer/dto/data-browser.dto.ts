// src/data-browser/dto/data-browser.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

// --- 공통(Shared) ---

const validDomains = ['conditions', 'drugs', 'measurements', 'procedures'] as const;
type DomainTuple = typeof validDomains;
type Domain = DomainTuple[number];

// --- API 1: Domain Summary ---

export class SummaryQueryDto {
  @ApiPropertyOptional({ description: 'Keyword to filter concepts', example: 'Pain' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Cohort ID to filter patients', example: 'your-cohort-id' })
  @IsString()
  @IsOptional()
  cohortId?: string;
}

export class DomainSummaryDto {
  @ApiProperty({ example: 'Conditions' })
  domain_name: string;

  @ApiProperty({ example: 2060680 })
  participant_count: number;

  @ApiProperty({ example: 4626 })
  concept_count: number;
}


// --- API 2: Top Concepts in Domain ---

export class TopConceptsParamsDto {
  @ApiProperty({ enum: validDomains, description: 'Domain name' })
  @IsIn(validDomains)
  domain: Domain;
}

export class TopConceptsQueryDto {
    @ApiPropertyOptional({ description: 'View by standard OMOP concept (target) or hospital source concept (source)', enum: ['source', 'target'], default: 'target' })
    @IsIn(['source', 'target'])
    @IsOptional()
    viewBy?: 'source' | 'target';

    @ApiPropertyOptional({ description: 'Cohort ID to filter patients', example: 'your-cohort-id' })
    @IsString()
    @IsOptional()
    cohortId?: string;
}

export class TopConceptDto {
  @ApiProperty({ example: '4329041' })
  concept_id: string;
  
  @ApiProperty({ example: 'Pain' })
  concept_name: string;
  
  @ApiProperty({ example: 310465 })
  participant_count: number;
}


// --- API 3: Concept Details ---

export class ConceptDetailParamsDto {
  @ApiProperty({ enum: validDomains, description: 'Domain name' })
  @IsIn(validDomains)
  domain: Domain;

  @ApiProperty({ description: 'Concept ID', example: '4329041' })
  @IsString()
  @IsNotEmpty()
  conceptId: string;
}


// --- API 4: Value Distribution (New) ---

export class ValueDistributionParamsDto {
    @ApiProperty({ description: 'Measurement Concept ID', example: '3025315' })
    @IsString()
    @IsNotEmpty()
    conceptId: string;
}

export class ValueDistributionResponseDto {
    @ApiProperty({ example: 'kilogram' })
    unit_name: string | null;

    @ApiProperty({ example: 'FEMALE' })
    gender_name: string;

    @ApiProperty({ example: 518693 })
    total_gender_count: number;

    @ApiProperty({ example: '6.5 - 13.4' })
    range_label: string;

    @ApiProperty({ example: 48978 })
    participant_count: number;

    @ApiProperty({ example: 6.5 })
    sort_order: number;
}


// --- 공통 응답 DTOs ---

class AgeDemographicsDto {
  [ageRange: string]: number;
}

class SexDemographicsDto {
  [gender: string]: number;
}

class DemographicsDto {
  @ApiProperty({ example: { '20-29': 10234, '30-39': 25832 } })
  age: AgeDemographicsDto;
  
  @ApiProperty({ example: { 'FEMALE': 180200, 'MALE': 104200 } })
  sex: SexDemographicsDto;
}

export class ConceptDetailResponseDto {
  @ApiProperty({ example: '4329041' })
  conceptId: string;

  @ApiProperty({ example: 'Pain' })
  conceptName: string;

  @ApiProperty()
  demographics: DemographicsDto;
}