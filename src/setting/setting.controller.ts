import { Body, Controller, Get, Post } from '@nestjs/common';
import { SettingService } from './setting.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { SettingColumnDto } from './dto/setting.dto';

@Controller('/setting')
export class SettingController {
    constructor(private readonly settingService: SettingService) {}

    @ApiOperation({summary: '코호트 생성에서 띄워질 테이블별 컬럼'})
    @Get('/active')
    async getActiveColumns(){
        return await this.settingService.getActiveColumns();
    }

    @ApiOperation({summary: '코호트 생성에서 띄워질 테이블별 컬럼'})
    @Get()
    async getColumns(){
        return await this.settingService.getColumns();
    }

    @ApiOperation({summary: '코호트 생성에서 띄워질 테이블별 컬럼 설정'})
    @ApiBody({type: SettingColumnDto})
    @Post()
    async postColumns(@Body() settingColumnDto:SettingColumnDto){
        return this.settingService.postColumns(settingColumnDto.options);
    }
}
