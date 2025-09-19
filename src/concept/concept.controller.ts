import { Controller, Get, Query, Param, UseGuards, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ConceptService } from './concept.service';
import {
  ConceptResponseDto,
  ConceptSearchResponseDto,
  SearchConceptDto,
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
  @ApiBody({ type: SearchConceptDto })
  @Post('search')
  async searchConcepts(
    @Body() searchConcetpDto: SearchConceptDto,
  ): Promise<ConceptSearchResponseDto> {
    const {table, column, query, source_code, source_code_description, target_concept_id, target_concept_name, vocabulary_id, page = 0, limit = 100 } = searchConcetpDto;
    return this.conceptService.searchConcepts(table, column, query, source_code, source_code_description, target_concept_id, target_concept_name, vocabulary_id, page, limit);
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
