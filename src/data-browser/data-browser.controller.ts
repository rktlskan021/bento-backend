// src/data-browser/data-browser.controller.ts (수정본)
import { Controller, Get, Param, Query, ParseArrayPipe, DefaultValuePipe } from '@nestjs/common';
import { DataBrowserService } from './data-browser.service';
// ✅ ApiExtraModels, getSchemaPath 임포트 확인
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import {
  SummaryQueryDto,
  DomainSummaryDto,
  TopConceptsParamsDto,
  TopConceptsQueryDto,
  TopConceptDto, // ✅ TopConceptDto는 참조용으로 필요
  ConceptDetailParamsDto,
  ConceptDetailResponseDto,
  ValueDistributionParamsDto,
  ValueDistributionResponseDto, // ✅ ValueDistributionResponseDto는 참조용으로 필요
  CohortQueryDto
  // ❌ 삭제된 DTO 임포트 제거
  // TopConceptsResponseDto,
  // ValueDistributionMapResponseDto
} from './dto/data-browser.dto';

@ApiTags('Data Browser')
@Controller('data-browser')
// ✅ Swagger가 DTO 내부의 DTO(DemographicsDto 등)를 참조할 수 있도록 ApiExtraModels에 추가
// (DemographicsDto는 private이므로 ConceptDetailResponseDto를 넣습니다)
@ApiExtraModels(TopConceptDto, ValueDistributionResponseDto, ConceptDetailResponseDto) 
export class DataBrowserController {
  constructor(private readonly dataBrowserService: DataBrowserService) {}

  // ... getSummary (변경 없음) ...
  @Get('/summary')
  @ApiOperation({ summary: 'Step 1: Get concept and participant counts for all domains' })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' })
  @ApiResponse({ status: 200, type: [DomainSummaryDto] })
  async getSummary(
    @Query() query: SummaryQueryDto,
  ): Promise<DomainSummaryDto[]> {
    return this.dataBrowserService.getDomainSummary(query.keyword, query.cohortIds);
  }


  @Get('/domains/:domain/concepts')
  @ApiOperation({ summary: 'Step 2: Get top concepts for a specific domain' })
  @ApiParam({ name: 'domain', enum: ['conditions', 'drugs', 'measurements', 'procedures'] })
  @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' })
  // ❌ viewBy ApiQuery 제거
  
  // ✅ ApiResponse 수정: type 대신 schema 사용
  @ApiResponse({ 
    status: 200, 
    description: 'Top concepts for the specified domain, aggregated across selected cohorts.',
    type: [TopConceptDto] // ✅ [TopConceptDto] 배열로 복원
  })
  async getTopConcepts(
    @Param() params: TopConceptsParamsDto,
    @Query() query: TopConceptsQueryDto,
  ): Promise<TopConceptDto[]> { // ✅ 반환 타입 TopConceptDto[] 배열로 복원
    return this.dataBrowserService.getTopConceptsForDomain(params.domain, query.cohortIds);
  }

  // ✅ getConceptDetails (변경 없음 - 이 코드는 이미 올바른 형식이었습니다)
  @Get('/domains/:domain/concepts/:conceptId/details')
  @ApiOperation({ summary: 'Step 3: Get detailed demographics for a specific concept' })
  @ApiParam({ name: 'domain', enum: ['conditions', 'drugs', 'measurements', 'procedures'] })
  @ApiParam({ name: 'conceptId', type: String })
  @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' })
  @ApiResponse({ status: 200, type: ConceptDetailResponseDto })
  async getConceptDetails(
    @Param() params: ConceptDetailParamsDto,
    // ✅ (수정) 수동 파이프 대신 CohortQueryDto 사용
    @Query() query: CohortQueryDto, 
  ): Promise<ConceptDetailResponseDto> {
    // ✅ (수정) 서비스 호출 시 query.cohortIds 전달
    return this.dataBrowserService.getConceptDetails(params.domain, params.conceptId, query.cohortIds);
  }


  @Get('/measurements/:conceptId/values')
  @ApiOperation({ summary: 'Get value distribution for a specific measurement concept' })
  @ApiParam({ name: 'conceptId', type: String })
  @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' })
  
  // ✅ ApiResponse 수정: type 대신 schema 사용
  @ApiResponse({ 
    status: 200, 
    description: 'Value distribution 리스트가 코호트 ID ("all"은 전체)로 매핑된 객체',
    schema: {
      type: 'object',
      // 'additionalProperties'를 사용하여 이 객체가 맵(map)임을 정의
      additionalProperties: {
        type: 'array',
        items: { $ref: getSchemaPath(ValueDistributionResponseDto) } // 맵의 값은 ValueDistributionResponseDto 배열
      }
    }
  })
async getConceptValues(
    @Param() params: ValueDistributionParamsDto,
    // ✅ (수정) 수동 파이프 대신 CohortQueryDto 사용
    @Query() query: CohortQueryDto,
  ): Promise<{[key: string]: ValueDistributionResponseDto[]}> { 
    // ✅ (수정) 서비스 호출 시 query.cohortIds 전달
    return this.dataBrowserService.getConceptValueDistribution(params.conceptId, query.cohortIds);
  }
}
// // src/data-browser/data-browser.controller.ts
// import { Controller, Get, Param, Query, ParseArrayPipe, DefaultValuePipe } from '@nestjs/common'; // Import necessary pipes
// import { DataBrowserService } from './data-browser.service';
// import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
// import {
//   SummaryQueryDto,
//   DomainSummaryDto,
//   TopConceptsParamsDto,
//   TopConceptsQueryDto,
//   TopConceptDto,
//   ConceptDetailParamsDto,
//   ConceptDetailResponseDto,
//   ValueDistributionParamsDto,
//   ValueDistributionResponseDto
// } from './dto/data-browser.dto';

// @ApiTags('Data Browser')
// @Controller('data-browser')
// export class DataBrowserController {
//   constructor(private readonly dataBrowserService: DataBrowserService) {}

//   @Get('/summary')
//   @ApiOperation({ summary: 'Step 1: Get concept and participant counts for all domains' })
//   // ✅ Update ApiQuery decorator for cohortIds
//   @ApiQuery({ name: 'keyword', required: false, type: String })
//   @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' }) // Use String for input
//   @ApiResponse({ status: 200, type: [DomainSummaryDto] })
//   async getSummary(
//     @Query() query: SummaryQueryDto, // DTO handles validation and transformation
//   ): Promise<DomainSummaryDto[]> {
//     // ✅ Pass cohortIds array to the service
//     return this.dataBrowserService.getDomainSummary(query.keyword, query.cohortIds);
//   }

//   @Get('/domains/:domain/concepts')
//   @ApiOperation({ summary: 'Step 2: Get top concepts for a specific domain' })
//   @ApiParam({ name: 'domain', enum: ['conditions', 'drugs', 'measurements', 'procedures'] })
//   // ✅ Update ApiQuery decorator for cohortIds
//   @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' })
//   @ApiQuery({ name: 'viewBy', required: false, enum: ['source', 'target'], description: "View by 'source' (SNUH) or 'target' (OMOP Standard)" })
//   @ApiResponse({ status: 200, type: [TopConceptDto] })
//   async getTopConcepts(
//     @Param() params: TopConceptsParamsDto,
//     @Query() query: TopConceptsQueryDto, // DTO handles validation and transformation
//   ): Promise<TopConceptDto[]> {
//     // ✅ Pass cohortIds array to the service
//     return this.dataBrowserService.getTopConceptsForDomain(params.domain, query.cohortIds, query.viewBy);
//   }

//   @Get('/domains/:domain/concepts/:conceptId/details')
//   @ApiOperation({ summary: 'Step 3: Get detailed demographics for a specific concept' })
//   @ApiParam({ name: 'domain', enum: ['conditions', 'drugs', 'measurements', 'procedures'] })
//   @ApiParam({ name: 'conceptId', type: String })
//   // ✅ Update ApiQuery decorator for cohortIds
//   @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' })
//   @ApiResponse({ status: 200, type: ConceptDetailResponseDto })
//   async getConceptDetails(
//     @Param() params: ConceptDetailParamsDto,
//     // ✅ Use the transformation pipe directly if not using a full DTO
//     @Query('cohortIds', new DefaultValuePipe(undefined), new ParseArrayPipe({ items: String, separator: ',', optional: true })) cohortIds?: string[],
//   ): Promise<ConceptDetailResponseDto> {
//     // ✅ Pass cohortIds array to the service
//     return this.dataBrowserService.getConceptDetails(params.domain, params.conceptId, cohortIds);
//   }


//   @Get('/measurements/:conceptId/values')
//   @ApiOperation({ summary: 'Get value distribution for a specific measurement concept' })
//   @ApiParam({ name: 'conceptId', type: String })
//   // ✅ Update ApiQuery decorator for cohortIds
//   @ApiQuery({ name: 'cohortIds', required: false, type: String, description: 'Comma-separated cohort IDs' })
//   @ApiResponse({ status: 200, type: [ValueDistributionResponseDto] })
//   async getConceptValues(
//     @Param() params: ValueDistributionParamsDto,
//     // ✅ Use the transformation pipe directly
//     @Query('cohortIds', new DefaultValuePipe(undefined), new ParseArrayPipe({ items: String, separator: ',', optional: true })) cohortIds?: string[],
//   ): Promise<ValueDistributionResponseDto[]> { // ✅ Ensure return type matches DTO
//     // ✅ Pass cohortIds array to the service
//     return this.dataBrowserService.getConceptValueDistribution(params.conceptId, cohortIds);
//   }
// }

