import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
import * as dotenv from 'dotenv'
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.use(cookieParser(process.env.COOKIE_KEY))
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: '*',
  })
  
  await app.listen(3000);
}
bootstrap();
