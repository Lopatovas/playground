import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EntitiesModule } from './entities/entities.module';
import { SourcesModule } from './sources/sources.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { LlmModule } from './llm/llm.module';
import { SignalsModule } from './signals/signals.module';
import { FeedModule } from './feed/feed.module';
import { FeedbackModule } from './feedback/feedback.module';
import { JobsModule } from './jobs/jobs.module';
import { BullBoardModule } from './bull-board/bull-board.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('LOG_LEVEL', 'info'),
          transport:
            configService.get<string>('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
          autoLogging: {
            ignore: (req: any) =>
              req.url === '/health' || req.url?.startsWith('/admin/queues'),
          },
          serializers: {
            req: (req: any) => ({
              method: req.method,
              url: req.url,
              query: req.query,
            }),
            res: (res: any) => ({
              statusCode: res.statusCode,
            }),
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    EntitiesModule,
    SourcesModule,
    IngestionModule,
    LlmModule,
    SignalsModule,
    FeedModule,
    FeedbackModule,
    JobsModule,
    BullBoardModule,
  ],
})
export class AppModule {}
