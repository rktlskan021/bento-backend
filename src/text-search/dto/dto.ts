import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { Text_Search } from "src/types/type";

const searchTextExample = {
    contains: "ABC",
}

export class SearchTextDto {
    @ApiProperty({description: '테이블 이름', example: 'condition_occurrence'})
    @IsString()
    table_name: string;

    @ApiProperty({description: '컬럼 이름', example: 'condition_source_value'})
    @IsString()
    column_name: string;

    @ApiProperty({description: '검색 쿼리', example: searchTextExample})
    query: Text_Search;
}