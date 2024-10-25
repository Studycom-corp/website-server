import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { User } from "./entities/user.entity";

export const GetUser = createParamDecorator((data: keyof User, ctx: ExecutionContext)=> {
    let extract: {email_address: string, id: string} | string;

    if (ctx.getType() == 'ws'){
        extract = ctx.switchToWs().getClient().handshake.user
    } else if(ctx.getType() == 'http'){
        extract = ctx.switchToHttp().getRequest().user
    }

    return data ? extract?.[data] : extract
})