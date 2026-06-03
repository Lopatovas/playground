import { Injectable, Logger } from "@nestjs/common";
import type { LlmProvider, ReportEnhancementInput, ReportEnhancementOutput } from "./llm-provider.interface.js";

interface MistralChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class MistralLlmProvider implements LlmProvider {
  readonly name = "mistral";
  private readonly logger = new Logger(MistralLlmProvider.name);
  private readonly apiKey = process.env.MISTRAL_API_KEY;
  private readonly model = process.env.MISTRAL_MODEL ?? "mistral-small-latest";

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generateReportEnhancement(input: ReportEnhancementInput): Promise<ReportEnhancementOutput | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You improve AI data readiness reports. Only use provided aggregate metadata and findings. Never invent raw data, personal data, counts or scores. Return strict JSON.",
            },
            {
              role: "user",
              content: JSON.stringify({
                task: "Rewrite the summary and action plan for the configured audience while preserving technical meaning.",
                expectedJsonShape: {
                  summary: input.summary,
                  actionPlan: input.actionPlan,
                },
                input,
              }),
            },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Mistral request failed with ${response.status}`);
        return null;
      }

      const payload = (await response.json()) as MistralChatResponse;
      const content = payload.choices?.[0]?.message?.content;

      if (!content) {
        return null;
      }

      return JSON.parse(content) as ReportEnhancementOutput;
    } catch (error) {
      this.logger.warn(`Mistral report enhancement failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
