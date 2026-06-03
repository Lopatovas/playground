import { Module } from "@nestjs/common";
import { ScansController } from "./scans/scans.controller.js";
import { ScansService } from "./scans/scans.service.js";
import { FileParserService } from "./scanner/file-parser.service.js";
import { ProfilingService } from "./scanner/profiling.service.js";
import { RiskDetectorService } from "./scanner/risk-detector.service.js";
import { ScoringService } from "./scanner/scoring.service.js";
import { ReportService } from "./scanner/report.service.js";
import { LlmService } from "./llm/llm.service.js";
import { MistralLlmProvider } from "./llm/mistral.provider.js";

@Module({
  controllers: [ScansController],
  providers: [
    ScansService,
    FileParserService,
    ProfilingService,
    RiskDetectorService,
    ScoringService,
    ReportService,
    LlmService,
    MistralLlmProvider,
  ],
})
export class AppModule {}
