import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { FileModule } from './file/file.module';
import { NotificationModule } from './notification/notification.module';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: 'studycom',
    autoLoadEntities: true,
    synchronize: true,
  }), UserModule, FileModule, NotificationModule,
  EventEmitterModule.forRoot()
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
