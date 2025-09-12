import { Injectable } from '@nestjs/common';
import { SearchTextDto } from './dto/dto';
import { getBaseDB } from 'src/query-builder/base';
import { buildSearchTextCountQuery } from 'src/query-builder/text_search';

@Injectable()
export class TextSearchService {
    async SearchCount(
        searchTextDto: SearchTextDto
    ){
        const {table_name, column_name, query} = searchTextDto;
        return buildSearchTextCountQuery(getBaseDB(), {table_name, column_name, query})
    }
}
