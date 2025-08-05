import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ConceptService } from './concept.service';
import {
  ConceptResponseDto,
  ConceptSearchResponseDto,
  SearchConceptQueryDto,
} from './dto/concept.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';


@ApiTags('Concept')
@Controller('/api/concept')
export class ConceptController {
  constructor(private readonly conceptService: ConceptService) {}

  @ApiOperation({ summary: 'Search concepts' })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of concepts based on search query',
    type: ConceptSearchResponseDto,
  })
  // @ApiBearerAuth('access_token')
  // @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchConcepts(
    @Query() queryParams: SearchConceptQueryDto,
  ): Promise<ConceptSearchResponseDto> {
    const { query, source_code, source_code_description, target_concept_id, target_concept_name, vocabulary_id, page = 0, limit = 100, domain } = queryParams;
    return this.conceptService.searchConcepts(query, source_code, source_code_description, target_concept_id, target_concept_name, vocabulary_id, page, limit, domain);
  }

  // @ApiOperation({ summary: 'Get concept by ID' })
  // @ApiParam({
  //   name: 'conceptId',
  //   type: String,
  //   description: 'Concept ID',
  //   required: true,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Returns the concept with the specified ID',
  //   type: ConceptResponseDto,
  // })
  // @Get(':conceptId')
  // async getConceptById(
  //   @Param('conceptId') conceptId: string,
  // ): Promise<ConceptResponseDto> {
  //   return this.conceptService.getConceptById(conceptId);
  // }
}
