import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ){}

    async login(loginDto: LoginDto){
        const {email, password} = loginDto;
        
        const user = await this.userService.findByEmail(email);
        if(!user){
            throw new NotFoundException('존재하지 않는 이메일입니다.');
        }

        const isPasswordValid = await this.userService.validatePassword(
            password,
            user.password
        );

        if (!isPasswordValid){
            throw new UnauthorizedException('비밀번호가 옳바르지 않습니다.');
        }

        const payload = {email: user.email};
        const accessToken = this.jwtService.sign(payload);

        return {
            access_token: accessToken,
        }
    }
}