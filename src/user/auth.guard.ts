import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { Socket } from "socket.io";
import { UserService } from "./user.service";
import { WsException } from "@nestjs/websockets";
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ){}

    private cookie: string
    private exnCtx: string
    private token: string
    private jwt_key: string = process.env.JWT_KEY

    async canActivate(ctx: ExecutionContext): Promise<boolean>{
        this.exnCtx = ctx.getType()
        if (this.exnCtx == 'http') {
            let request: Request = ctx.switchToHttp().getRequest()
            this.cookie = request.headers.cookie
        } else if(this.exnCtx == 'ws'){
            let client: Socket = ctx.switchToWs().getClient()
            this.cookie = client.handshake.headers.cookie
        }

        if (!this.cookie) 
            throw new UnauthorizedException('Cookie not found')

        this.token = this.extractTokenFromCookie(this.cookie)

        if(!this.token)
            throw new UnauthorizedException('Missing access token')

        if(this.userService.blackList.includes(this.token))
            throw new UnauthorizedException('Invalid token')

        try {
            const payload = await this.jwtService.verify(this.token, { secret: this.jwt_key });
            if (this.exnCtx == 'http')
                ctx.switchToHttp().getRequest()['user'] = payload;
            
            else if(this.exnCtx == 'ws')
                ctx.switchToWs().getClient().handshake['user'] = payload

        } catch (error) {
            if(this.exnCtx == 'http')
                throw new UnauthorizedException("Invalid token");

            else if(this.exnCtx == 'ws')
                throw new WsException("Invalid token");
            
        }

        return true
    }

    extractTokenFromCookie(cookie: string): string | undefined {
        let extractedToken = cookie.split('; ').find(value => value.startsWith("access_token="))
        return extractedToken ? extractedToken.split('=')[1] : undefined
    }
}