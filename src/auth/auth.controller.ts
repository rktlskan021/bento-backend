import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Post('login')
    @ApiOperation({summary: '로그인', description: '이메일과 비밀번호로 로그인합니다.'})
    @ApiResponse({status: 201, description: '로그인 성공, JWT 반환'})
    @ApiResponse({status: 401, description: '인증 실패'})
    async login(@Body() loginDto: LoginDto){
        return this.authService.login(loginDto);
    }
}
