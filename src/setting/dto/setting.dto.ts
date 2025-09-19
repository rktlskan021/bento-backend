// import { ApiProperty } from "@nestjs/swagger";

import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsString } from "class-validator";

const settingExample = [
    {
        table_name: 'condition_occurrence',
        column_name: 'condition_concept_id',
        is_active: 0
    },
    {
        table_name: 'condition_occurrence',
        column_name: 'condition_end_date',
        is_active: 0
    },
];

export class SettingColumn {
    @ApiProperty({description: '테이블 이름', example:'condition_occurrence'})
    @IsString()
    table_name: string;

    @ApiProperty({description: '컬럼 이름', example:'condition_concept_id'})
    @IsString()
    column_name: string;

    @ApiProperty({description: '활성화 여부', example:0})
    @IsNumber()
    is_active: number;
}

export class SettingColumnDto {
    @ApiProperty({
        description: 'Test',
        type: [SettingColumn],
        example: settingExample
    })
    @IsArray()
    options: SettingColumn[];
}

