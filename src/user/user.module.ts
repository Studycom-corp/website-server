import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { Verification } from './entities/verification.entity';
import { EmailService } from './emailer.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Verification]), JwtModule.register({
    global: true,
    secret: process.env.JWT_KEY,
    signOptions: {
      expiresIn: '1d'
    }
  })],
  controllers: [UserController],
  providers: [UserService, AuthGuard, EmailService],
  exports: [TypeOrmModule, UserService]
})
export class UserModule {}
