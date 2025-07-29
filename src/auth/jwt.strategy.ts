import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import * as passportJwt from 'passport-jwt';
import { UserService } from "src/user/user.service";

const Strategy = passportJwt.Strategy as any;
const ExtractJwt = passportJwt.ExtractJwt as any;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private userService: UserService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: any){
        const user = await this.userService.findByEmail(payload.email);
        if(!user){
            throw new Error('User Not Found');
        }

        return user;
    }
}