import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    @IsEmail()
    email_address: string

    @IsNotEmpty()
    @IsString()
    password: string

    @IsNotEmpty()
    @IsString()
    full_name: string

    @IsString()
    user_name?: string

    @IsString()
    profession?: string

    profile_photo?: Express.Multer.File
}
