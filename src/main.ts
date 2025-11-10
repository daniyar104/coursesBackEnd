import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173', // разрешаем запросы с фронтенда
    credentials: true, // если используешь cookie
  });
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
