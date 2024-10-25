import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class LoginDto {
    @IsNotEmpty()
    @IsEmail()
    email_address: string

    @IsNotEmpty()
    @IsString()
    password: string
}