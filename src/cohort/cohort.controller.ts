import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { CohortService } from './cohort.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateCohortDto,
  UpdateCohortDto,
  CohortIdParam,
  CohortNameDto,
  PaginationQuery,
  CohortResponse,
  CohortStatisticsResponse,
  CreateCohortResponse,
  UpdateCohortResponse,
  DeleteCohortResponse,
  CohortListResponse,
  CohortPersonsResponse,
  CohortDetailResponse,
  PaginationSearchQuery,
} from './dto/cohort.dto';

@ApiBearerAuth()
@ApiTags('Cohort')
@Controller('/api/cohort')
export class CohortController {
  constructor(private readonly cohortService: CohortService) {}

  @ApiOperation({ summary: 'Get cohort list' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Search query',
  })
  @ApiResponse({
    status: 200,
    description: 'Cohort list',
    type: CohortListResponse,
  })
  @Get()
  async getCohorts(@Query() { page, limit, query }: PaginationSearchQuery) {
    return await this.cohortService.getCohorts(page, limit, query);
  }

  @ApiOperation({summary: 'Check Duplicate Cohort Name'})
  @Post('check')
  async checkDuplicateCohortName(@Body() cohortNameDto: CohortNameDto){
    const {cohortName} = cohortNameDto;
    const isDuplicate = await this.cohortService.isCohortNameDuplicate(cohortName);

    if(isDuplicate){
      return {
        status: false,
        meaage: '이미 사용 중인 코호트 이름입니다.',
      };
    }
    else{
      return {
        status: true,
        meaage: '사용 가능한 이름입니다.',
      };
    }
  }

  @ApiOperation({ summary: 'Get cohort details' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiOkResponse({
    description: 'Cohort information',
    type: CohortDetailResponse,
  })
  @ApiNotFoundResponse({ description: 'Cohort not found' })
  @Get(':cohortId')
  async getCohort(@Param() { cohortId }: CohortIdParam) {
    return await this.cohortService.getCohort(cohortId);
  }

  @ApiOperation({ summary: 'Get cohort statistics' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiOkResponse({
    description: 'Cohort statistics information',
    type: CohortStatisticsResponse,
  })
  @ApiNotFoundResponse({ description: 'Cohort not found' })
  @Get(':cohortId/statistics')
  async getCohortStatistics(@Param() { cohortId }: CohortIdParam) {
    return await this.cohortService.getCohortStatistics(cohortId);
  }

  @ApiOperation({ summary: 'Get cohort patients list' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiOkResponse({
    description: 'Cohort patients list',
    type: CohortPersonsResponse,
  })
  @ApiNotFoundResponse({ description: 'Cohort not found' })
  @Get(':cohortId/persons')
  async getCohortPersons(
    @Param() { cohortId }: CohortIdParam,
    @Query() { page, limit }: PaginationQuery,
  ) {
    return await this.cohortService.getCohortPersons(cohortId, page, limit);
  }

  @ApiOperation({ summary: 'Create cohort' })
  @ApiBody({ type: CreateCohortDto })
  @ApiCreatedResponse({
    description: 'Cohort created successfully',
    type: CreateCohortResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCohort(@Body() createCohortDto: CreateCohortDto) {
    const { name, description, cohortDefinition, temporary } = createCohortDto;
    if(await this.cohortService.isCohortNameDuplicate(name)){
      throw new ConflictException('이미 존재하는 코호트 이름입니다.');
    }
    return await this.cohortService.createNewCohort(
      name,
      description,
      cohortDefinition,
      temporary,
    );
  }

  @ApiOperation({ summary: 'Update cohort' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiBody({ type: UpdateCohortDto })
  @ApiOkResponse({
    description: 'Cohort updated successfully',
    type: UpdateCohortResponse,
  })
  @ApiNotFoundResponse({ description: 'Cohort not found' })
  @Put(':cohortId')
  async updateCohort(
    @Param() { cohortId }: CohortIdParam,
    @Body() updateCohortDto: UpdateCohortDto,
  ) {
    const { name, description, cohortDefinition } = updateCohortDto;
    return await this.cohortService.updateExistingCohort(
      cohortId,
      name,
      description,
      cohortDefinition,
    );
  }

  @ApiOperation({ summary: 'Delete cohort' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiOkResponse({
    description: 'Cohort deleted successfully',
    type: DeleteCohortResponse,
  })
  @ApiNotFoundResponse({ description: 'Cohort not found' })
  @Delete(':cohortId')
  async deleteCohort(@Param() { cohortId }: CohortIdParam) {
    return await this.cohortService.removeExistingCohort(cohortId);
  }
}
