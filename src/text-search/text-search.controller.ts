import { Body, Controller, Post } from '@nestjs/common';
import { TextSearchService } from './text-search.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SearchTextDto } from './dto/dto';

@ApiTags('Text-Search')
@Controller('/api/text-search')
export class TextSearchController {
    constructor(private readonly textSearchService:TextSearchService){}

    @ApiBody({type: SearchTextDto})
    @Post()
    async searchText(
        @Body() searchTextDto: SearchTextDto
    ) {
        return this.textSearchService.SearchCount(searchTextDto);
    }
}
