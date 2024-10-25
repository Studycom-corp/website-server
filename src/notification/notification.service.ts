import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ){}

  async create(createNotificationDto: CreateNotificationDto) {
    const newNotification = this.notificationRepository.create({
      target: createNotificationDto.target,
      source: createNotificationDto.source,
      subject: createNotificationDto.subject,
      link: createNotificationDto.link,
      layout: createNotificationDto.layout
    })

    try {
      await this.notificationRepository.save(newNotification)
    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    return true
  }

  async findAll(user_email: string) {
    let notifications: Notification[]
    try {
      notifications = await this.notificationRepository.find({
        where: {target: user_email},
        order: {createdAt: 'asc'}
      })
    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    const filtered = notifications.map(value => {
      const {target, ...noti} = value
      return noti
    })

    return filtered;
  }

  async remove(id: string) {
    let notification: Notification;
    try {
      notification = await this.notificationRepository.findOneBy({id: id})
    } catch (error) {
      throw new InternalServerErrorException(error)
    }

    if (!notification) {
      return true
    }

    if(notification.target.length > 1){
      const index = notification.target.findIndex(value => value == id)
      if(index == -1)
        return

      notification.target.splice(index, 1)
      try {
        await this.notificationRepository.save(notification)
      } catch (error) {
        throw new InternalServerErrorException(error)
      }
    } else {
      try {
        await this.notificationRepository.delete(id)
      } catch (error) {
        throw new InternalServerErrorException(error)
      }
    }

    return true
  }
}
