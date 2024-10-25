import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { Verification } from './entities/verification.entity';
import { decryptText, encryptText } from 'src/encryption.helper';
import { VerifyDto } from './dto/verify.dto';
import { ResendOtpDto } from './dto/resendOtp.dto';
import { EmailService } from './emailer.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Verification)
    private verifyRepository: Repository<Verification>,

    private jwtService: JwtService,
    private emailer: EmailService
  ){}

  blackList: string[] = [];

  addToBlackList(token: string){
    this.blackList.push(token)
  }

  // User signup method
  async create(createUserDto: CreateUserDto) {
    // Check email availability
    let user: User;
    try {
      user = await this.userRepository.findOneBy({email_address: createUserDto.email_address})
    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    if(user)
      throw new ConflictException(`Account with email ${createUserDto.email_address} already exists`)

    let new_user = this.userRepository.create()
    let hashedPassword = await bcrypt.hash(createUserDto.password, 10)

    if (createUserDto.profile_photo) {
      new_user.profile_photo = createUserDto.profile_photo.filename
    }

    new_user.email_address = createUserDto.email_address
    new_user.full_name = createUserDto.full_name
    new_user.password = hashedPassword
    new_user.profession = createUserDto?.profession
    new_user.user_name = createUserDto.user_name ? createUserDto.user_name : createUserDto.email_address
    
    let createdUser: User
    try {
      createdUser = await this.userRepository.save(new_user)
    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    // Prepare verification statements
    const {result, expiresAt} = await this.assignOtp(new_user.full_name, new_user.email_address)

    const verification = this.verifyRepository.create()
    verification.associated_email = createdUser.email_address
    verification.expiresAt = expiresAt
    verification.result = JSON.stringify(result)

    try {
      await this.verifyRepository.save(verification)
    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    const {password, id, ...sanitizedUser} = createdUser

    return sanitizedUser
  }

  async login(loginObj: LoginDto){
    let user: User;

    try {
      user = await this.userRepository.findOneBy({email_address: loginObj.email_address})
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
    
    if(!user){
      throw new NotFoundException('Invalid input, Email not recognized')
    }

    const authorized = await bcrypt.compare(loginObj.password, user.password)

    if(!authorized)
      throw new UnauthorizedException('Invalid input, Wrong password')

    const {password, id, ...sanitizedUser} = user
    const jwt_token = this.jwtService.sign(
      {sub: id, email_address: sanitizedUser.email_address},
      {secret: process.env.JWT_KEY}
    )

    return {sanitizedUser, jwt_token}
  }

  async verifyEmail(body: VerifyDto){
    let user: User;

    // Obtain the user to verify from database
    try{
      user = await this.userRepository.findOneBy({email_address: body.email_address})
    } catch(error){
      throw new InternalServerErrorException(error)
    }

    // Throw execptions for scenarios where either user 
    // doesn't exist or already verified
    if(!user)
      throw new NotFoundException('User not recognized')

    if(user.verified)
      throw new ConflictException('Account already verified')
    
    let verfication: Verification;
    // Check for verification details corresponding user email
    try{
      verfication = await this.verifyRepository.findOneBy({associated_email: body.email_address})
    } catch(error){
      throw new InternalServerErrorException(error)
    }

    // Throw exceptions for scenarios where either no 
    // history exists or provided OTP is expired
    if(!verfication)
      throw new NotFoundException('Verification history not found')

    if(verfication.expiresAt.getTime() >= new Date().getTime())
      throw new BadRequestException('Verification invalid, request for another OTP')
    
    try {
      let otp = decryptText(JSON.parse(verfication.result));
      if(Number(otp) != body.otp)
        throw new BadRequestException('Invalid otp, request for another OTP')

    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    // Update user account to verified = true
    user.verified = true
    const saveUser = async () => {
      try {
        let updatedUser = await this.userRepository.save(user)
        return updatedUser
      } catch (error) {
        throw new InternalServerErrorException(error)
      }
    }
    const {id, password, ...filteredUser} = await saveUser()

    // Delete the verification record from database
    try {
      await this.verifyRepository.delete({associated_email: body.email_address})
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
    
    // Generate jwt token and return both the filtered object and token to caller
    const payload = {sub: id, email_address: filteredUser.email_address}

    const signToken = ()=>{
      try {
        const token = this.jwtService.sign(payload, {secret: process.env.JWT_KEY})
        return token
      } catch (error) {
        throw new InternalServerErrorException(error)
      }
    }

    const token = signToken()

    return {sanitizedUser: filteredUser, jwt_token: token};
  }

  async resendOtp(request: ResendOtpDto){
    // Check for presence of account associated with email
    let user: User;
    try {
      user = await this.userRepository.findOneBy({email_address: request.email_address})
    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    if(!user)
      throw new NotFoundException('Email address not recognised')

    // Send the OTP to user email address and save the verification datails
    const {result, expiresAt} = await this.assignOtp(user.full_name, user.email_address)

    let verfication: Verification = this.verifyRepository.create({
        expiresAt: expiresAt,
        associated_email: user.email_address,
        result: JSON.stringify(result)
      })

      try{
        await this.verifyRepository.save(verfication);
      } catch(error) {
        throw new InternalServerErrorException(error)
      }

      return true
    }

  // Utility function for generating and transmiting OTP to 
  // user email for verification
  async assignOtp(user_name: string, email_address: string){
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes()+31)

    const OTP = Math.floor(100000 + Math.random() * 900000);
    const result = encryptText(OTP.toString())

    const subject = `Verify your email to approve your Studycom account`

    const text = `Hello ${user_name},\n\nThanks for your interest in 
    creating a Studycom account. To complete email verification as a requirement for 
    account approval, provide ${OTP} on the verification page.\n\nThanks\n\nThe Studycom Team`

    const html = `<div style="display: flex; flex-direction: column;">
          <h2>Hello <span style="font-weight: bold;">${user_name}</span></h2>
          <p>Thanks for your interest in  creating a Studycom account. To complete 
              email verification as a requirement for account approval, provide 
              ${OTP} on the verification page.
          </p>
          <p style="margin-top: 1rem;">Thanks</p>    
          <p style="margin-top: 1rem; font-weight: bold;">The Studycom Team</p>
        </div>`
    try {
      await this.emailer.sendEmail(email_address, subject, text, html)
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException(error)
    }

    return {result, expiresAt}
  }
}
