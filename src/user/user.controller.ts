import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe, UseInterceptors, UploadedFile, Res, BadRequestException, Query, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from './auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer, diskStorage } from 'multer';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { VerifyDto } from './dto/verify.dto';
import { ResendOtpDto } from './dto/resendOtp.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService
  ) {}

  @Post('signup')
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('profile_photo', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        throw new BadRequestException('Unsupported image format')
      } else {
        cb(null, true)
      }
    },

    storage: diskStorage({
      destination: '../../uploads/dps',
      filename: (req, file, cb) => {
        let time = new Date()
        let yearTokens = time.getFullYear().toString().split('');
        let signature = time.getMinutes() + '' + time.getSeconds() + '' + time.getDate() + ''
                   + time.getMonth() + '' + yearTokens[3] + '' + yearTokens[2];
        
        cb(null, `${signature}.${file.originalname}`)
      }
    }),
    limits:{ fileSize: 5 * 1024 * 1024 }
  }))
  async create(@Body() createUserDto: CreateUserDto, @UploadedFile() profile_photo: Express.Multer.File, @Res() response: Response) {
    createUserDto.profile_photo = profile_photo ? profile_photo : undefined;
    let createdUser = await this.userService.create(createUserDto);
    
    return response.send(createdUser)
  }

  @UsePipes(new ValidationPipe())
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() response: Response){
    let {sanitizedUser, jwt_token} = await this.userService.login(loginDto)
    response.cookie('access_token', jwt_token, {
      maxAge: 7*24*60*60*1000,
      signed: true, sameSite: true,
      httpOnly: true, secure: false
    })
    return response.send(sanitizedUser)
  }

  @UsePipes(new ValidationPipe())
  @Get('verify_email')
  async verifyEmail(@Body() body: VerifyDto, @Res() response: Response){
    let {sanitizedUser, jwt_token} = await this.userService.verifyEmail(body)
    response.cookie('access_token', jwt_token, {
      maxAge: 7*24*60*60*1000,
      signed: true, sameSite: true,
      httpOnly: true, secure: false
    })

    return response.send(sanitizedUser)
  }

  @UsePipes(new ValidationPipe())
  @Post('resendOtp')
  async resendOtp(@Body() body: ResendOtpDto, @Res() response: Response) {
    const sent = await this.userService.resendOtp(body)
    return response.send(sent)
  }
}
