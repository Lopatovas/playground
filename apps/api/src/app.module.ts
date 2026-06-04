import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ScansController } from "./scans/scans.controller.js";
import { ScansService, SCAN_QUEUE_NAME } from "./scans/scans.service.js";
import { ScansProcessor } from "./scans/scans.processor.js";
import { ScansRepository } from "./scans/scans.repository.js";
import { FileParserService } from "./scanner/file-parser.service.js";
import { ProfilingService } from "./scanner/profiling.service.js";
import { RiskDetectorService } from "./scanner/risk-detector.service.js";
import { ScoringService } from "./scanner/scoring.service.js";
import { ReportService } from "./scanner/report.service.js";
import { ReportChatService } from "./scanner/report-chat.service.js";
import { LlmService } from "./llm/llm.service.js";
import { MistralLlmProvider } from "./llm/mistral.provider.js";
import { PrismaService } from "./prisma/prisma.service.js";

const redisHost = process.env.REDIS_HOST ?? "localhost";
const redisPort = Number(process.env.REDIS_PORT ?? 6379);
const bullBoardPath = process.env.BULL_BOARD_PATH ?? "/queues";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisHost,
        port: redisPort,
      },
    }),
    BullModule.registerQueue({ name: SCAN_QUEUE_NAME }),
    BullBoardModule.forRoot({
      route: bullBoardPath,
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: SCAN_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ScansController],
  providers: [
    PrismaService,
    ScansRepository,
    ScansService,
    ScansProcessor,
    FileParserService,
    ProfilingService,
    RiskDetectorService,
    ScoringService,
    ReportService,
    ReportChatService,
    LlmService,
    MistralLlmProvider,
  ],
})
export class AppModule {}
