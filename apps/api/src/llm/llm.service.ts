import { Injectable } from "@nestjs/common";
import { MistralLlmProvider } from "./mistral.provider.js";
import type { ReportEnhancementInput, ReportEnhancementOutput } from "./llm-provider.interface.js";

@Injectable()
export class LlmService {
  constructor(private readonly mistralProvider: MistralLlmProvider) {}

  async generateReportEnhancement(input: ReportEnhancementInput): Promise<ReportEnhancementOutput | null> {
    return this.mistralProvider.generateReportEnhancement(input);
  }
}
