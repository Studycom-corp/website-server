import { IsEmail, IsNotEmpty } from "class-validator";

export class ResendOtpDto {
    @IsNotEmpty()
    @IsEmail()
    email_address: string
}