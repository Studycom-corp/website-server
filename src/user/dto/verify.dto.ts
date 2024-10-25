import { IsEmail, IsNotEmpty, IsNumber } from "class-validator";

export class VerifyDto {
    @IsNotEmpty()
    @IsNumber()
    otp: number

    @IsNotEmpty()
    @IsEmail()
    email_address: string
}