import { Injectable, Logger } from "@nestjs/common";
import type {
  LlmProvider,
  ReportChatInput,
  ReportChatOutput,
  ReportEnhancementInput,
  ReportEnhancementOutput,
} from "./llm-provider.interface.js";
import { audienceInstruction } from "./audience-prompts.js";

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

    const audienceGuide = audienceInstruction(input.audience);

    return this.requestJson<ReportEnhancementOutput>({
      system: [
        "You improve AI data readiness reports for a specific audience.",
        audienceGuide,
        "Only use provided aggregate metadata and findings. Never invent raw data, personal data, row values, counts, or scores.",
        "Preserve P1/P2/P3 priorities and expectedScoreImpact numbers from the action plan input.",
        "Return strict JSON matching expectedJsonShape.",
        input.comparison
          ? "Include comparisonNarrative explaining score and finding deltas versus the previous scan."
          : "Omit comparisonNarrative when no comparison object is provided.",
      ].join(" "),
      user: {
        task: "Rewrite summary and action plan for the audience. Add columnDictionary (business definitions from column metadata only) and remediationPlaybook (phased tasks tied to findings).",
        expectedJsonShape: {
          summary: input.summary,
          actionPlan: input.actionPlan,
          comparisonNarrative: input.comparison ? "string" : undefined,
          columnDictionary: [
            {
              tableName: "string",
              columnName: "string",
              suggestedDefinition: "string",
              dataNotes: "string",
            },
          ],
          remediationPlaybook: [{ phase: "string", owner: "string", tasks: ["string"] }],
        },
        input,
      },
    });
  }

  async chatAboutReport(input: ReportChatInput): Promise<ReportChatOutput | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const audienceGuide = audienceInstruction(input.audience);
    const historyMessages = input.history.slice(-8).map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    const payload = await this.requestChat({
      messages: [
        {
          role: "system",
          content: [
            "You are a grounded assistant for ONE completed AI data readiness scan report.",
            audienceGuide,
            "Answer ONLY using the reportContext JSON. Topics allowed: scores, findings, categories, comparisons, action plan, column dictionary, remediation playbook, and what fixes would help.",
            "If the user asks about anything else (recipes, jokes, general knowledge, coding unrelated to this dataset, other companies, etc.), reply with refusal JSON.",
            'Return strict JSON: {"reply":"string","refused":boolean}. Set refused=true when declining off-topic requests.',
            `reportContext:${JSON.stringify(input.reportContext)}`,
          ].join("\n"),
        },
        ...historyMessages,
        { role: "user", content: input.message },
      ],
    });

    if (!payload) {
      return null;
    }

    try {
      const parsed = JSON.parse(payload) as ReportChatOutput;
      if (typeof parsed.reply !== "string") {
        return null;
      }

      return {
        reply: parsed.reply.trim(),
        refused: Boolean(parsed.refused),
      };
    } catch {
      return null;
    }
  }

  private async requestJson<T>(input: { system: string; user: unknown }): Promise<T | null> {
    const content = await this.requestChat({
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: JSON.stringify(input.user) },
      ],
    });

    if (!content) {
      return null;
    }

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.warn(`Mistral JSON parse failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async requestChat(input: {
    messages: Array<{ role: string; content: string }>;
  }): Promise<string | null> {
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
          messages: input.messages,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Mistral request failed with ${response.status}`);
        return null;
      }

      const payload = (await response.json()) as MistralChatResponse;
      return payload.choices?.[0]?.message?.content ?? null;
    } catch (error) {
      this.logger.warn(`Mistral request failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
