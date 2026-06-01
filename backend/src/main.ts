import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Competitor Intelligence API')
    .setDescription(
      'API for the Adaptive Competitor Intelligence System. ' +
      'Track competitors through automated source discovery, content ingestion, ' +
      'and signal extraction. Delivers a ranked intelligence feed with pricing changes, ' +
      'feature launches, hiring spikes, and positioning shifts.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'User registration and authentication')
    .addTag('Entities', 'Company and competitor management')
    .addTag('Sources', 'Source discovery and management')
    .addTag('Signals', 'Signal extraction and listing')
    .addTag('Feed', 'Ranked intelligence feed')
    .addTag('Feedback', 'Signal relevance feedback')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`Bull Board at http://localhost:${port}/admin/queues`);
}
bootstrap();
