// src/data-browser/data-browser.controller.ts

import { Controller, Get, Param, Query } from '@nestjs/common';
import { DataBrowserService } from './data-browser.service';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  SummaryQueryDto,
  DomainSummaryDto,
  TopConceptsParamsDto,
  TopConceptsQueryDto, // 수정
  TopConceptDto,
  ConceptDetailParamsDto,
  ConceptDetailResponseDto,
  ValueDistributionParamsDto, // 추가
  ValueDistributionResponseDto // 추가
} from './data-browser.dto';

@ApiTags('Data Browser')
@Controller('data-browser')
export class DataBrowserController {
  constructor(private readonly dataBrowserService: DataBrowserService) {}

  @Get('/summary')
  @ApiOperation({ summary: 'Step 1: Get concept and participant counts for all domains' })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'cohortId', required: false, type: String })
  @ApiResponse({ status: 200, type: [DomainSummaryDto] })
  async getSummary(
    @Query() query: SummaryQueryDto,
  ): Promise<DomainSummaryDto[]> {
    return this.dataBrowserService.getDomainSummary(query.keyword, query.cohortId);
  }

  @Get('/domains/:domain/concepts')
  @ApiOperation({ summary: 'Step 2: Get top concepts for a specific domain' })
  @ApiParam({ name: 'domain', enum: ['conditions', 'drugs', 'measurements', 'procedures'] })
  @ApiQuery({ name: 'cohortId', required: false, type: String })
  @ApiQuery({ name: 'viewBy', required: false, enum: ['source', 'target'], description: "View by 'source' (SNUH) or 'target' (OMOP Standard)" }) // 추가
  @ApiResponse({ status: 200, type: [TopConceptDto] })
  async getTopConcepts(
    @Param() params: TopConceptsParamsDto,
    @Query() query: TopConceptsQueryDto, // 수정
  ): Promise<TopConceptDto[]> {
    return this.dataBrowserService.getTopConceptsForDomain(params.domain, query.cohortId, query.viewBy);
  }

  @Get('/domains/:domain/concepts/:conceptId/details')
  @ApiOperation({ summary: 'Step 3: Get detailed demographics for a specific concept' })
  @ApiParam({ name: 'domain', enum: ['conditions', 'drugs', 'measurements', 'procedures'] })
  @ApiQuery({ name: 'cohortId', required: false, type: String })
  @ApiResponse({ status: 200, type: ConceptDetailResponseDto })
  async getConceptDetails(
    @Param() params: ConceptDetailParamsDto,
    @Query('cohortId') cohortId?: string,
  ): Promise<ConceptDetailResponseDto> {
    return this.dataBrowserService.getConceptDetails(params.domain, params.conceptId, cohortId);
  }

  @Get('/measurements/:conceptId/values') // 추가
  @ApiOperation({ summary: 'Get value distribution for a specific measurement concept' })
  @ApiResponse({ status: 200, type: [ValueDistributionResponseDto] })
  async getConceptValues(
    @Param() params: ValueDistributionParamsDto,
  ): Promise<ValueDistributionResponseDto[]> {
    return this.dataBrowserService.getConceptValueDistribution(params.conceptId);
  }
}