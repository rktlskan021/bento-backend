import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({example: 'user'})
    @IsString()
    email: string;

    @ApiProperty({example: 'password'})
    @IsString()
    password: string;
}