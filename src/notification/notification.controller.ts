import { Controller, Get, Param, Delete, Sse, UseGuards, Req, Res } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Observable, Subject, fromEvent, map } from 'rxjs';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AuthGuard } from 'src/user/auth.guard';
import { GetUser } from 'src/user/getUser.decoratot';
import { Request, Response, response } from 'express';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notification')
export class NotificationController {
  private readonly connections = new Map<string, Subject<unknown>>()

  constructor(
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@GetUser('email_address') user_email: string, @Res() response: Response) {
    const notifications =  await this.notificationService.findAll(user_email);
    return response.send(notifications)
  }

  @UseGuards(AuthGuard)
  @Sse('sse')
  handleNotifications(@Req() request: Request, @GetUser('email_address') user: string):Observable<unknown> {
    const userStream = new Subject()
    this.connections.set(user, userStream)

    request.on('close',() => {
      this.connections.delete(user)
      userStream.complete()
    })

    return userStream.asObservable()
  }

  @OnEvent('notification.send')
  sendNotification(payload: CreateNotificationDto){
    payload.target.forEach((value) => {
      const conn = this.connections.get(value)

      if (conn) {
        const {target, ...notification} = payload
        try {
          conn.next({data: notification})
        } catch (error) {
          console.log(error)
        }
      }
    })
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() response: Response) {
    const deleted = await this.notificationService.remove(id);
    return response.send(deleted)
  }
}
