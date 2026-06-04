import { Injectable } from "@nestjs/common";
import { MistralLlmProvider } from "./mistral.provider.js";
import type { ReportChatInput, ReportChatOutput, ReportEnhancementInput, ReportEnhancementOutput } from "./llm-provider.interface.js";

@Injectable()
export class LlmService {
  constructor(private readonly mistralProvider: MistralLlmProvider) {}

  isConfigured(): boolean {
    return this.mistralProvider.isConfigured();
  }

  get providerName(): string {
    return this.mistralProvider.name;
  }

  async generateReportEnhancement(input: ReportEnhancementInput): Promise<ReportEnhancementOutput | null> {
    return this.mistralProvider.generateReportEnhancement(input);
  }

  async chatAboutReport(input: ReportChatInput): Promise<ReportChatOutput | null> {
    return this.mistralProvider.chatAboutReport(input);
  }
}
