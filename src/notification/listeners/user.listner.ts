import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { CreateNotificationDto } from "../dto/create-notification.dto";
import { NotificationService } from "../notification.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class userEventsListener {
    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly notificationService: NotificationService
    ){}

    @OnEvent('user.created')
    async handleUserCreated(payload: CreateNotificationDto){
        const created = await this.notificationService.create(payload)
        if(created){
            this.eventEmitter.emit('notification.send', payload)
        }
    }

}