import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ReportChatMessage, ReportChatResponse, ScanReport } from "@ai-readiness/shared";
import { LlmService } from "../llm/llm.service.js";
import { buildReportContextPayload } from "../llm/report-context.js";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_LENGTH = 8;

const OFF_TOPIC_PATTERNS = [
  /\b(recipe|ingredients|bake|baking|cake|pizza|cookie dough)\b/i,
  /\b(poem|joke|story|song lyrics|horoscope)\b/i,
  /\b(weather forecast|sports score|movie review)\b/i,
  /\b(write (me )?(a |an )?(python|javascript|java) (script|program) (for|to))\b/i,
];

const REPORT_TOPIC_PATTERNS = [
  /\b(scan|report|dataset|readiness|score|finding|findings|pii|privacy|compliance|schema|column|table|duplicate|action plan|remediation|comparison|delta|tenant)\b/i,
  /\b(what|why|how|explain|summarize|mean|improve|fix|risk)\b/i,
];

const OFF_TOPIC_REPLY =
  "I can only answer questions about this readiness scan report (scores, findings, comparison, action plan, and remediation). Please ask something about the loaded report.";

@Injectable()
export class ReportChatService {
  constructor(private readonly llmService: LlmService) {}

  async askAboutReport(
    report: ScanReport,
    message: string,
    history: ReportChatMessage[] = [],
  ): Promise<ReportChatResponse> {
    if (report.status !== "completed") {
      throw new BadRequestException("Report chat is only available for completed scans.");
    }

    if (!this.llmService.isConfigured()) {
      throw new ServiceUnavailableException("Report chat requires MISTRAL_API_KEY to be configured.");
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      throw new BadRequestException("Message is required.");
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(`Message must be at most ${MAX_MESSAGE_LENGTH} characters.`);
    }

    if (history.length > MAX_HISTORY_LENGTH) {
      throw new BadRequestException(`History must contain at most ${MAX_HISTORY_LENGTH} messages.`);
    }

    if (isObviouslyOffTopic(trimmedMessage)) {
      return { reply: OFF_TOPIC_REPLY, refused: true };
    }

    const llmReply = await this.llmService.chatAboutReport({
      audience: report.reportAudience ?? "mixed",
      reportContext: buildReportContextPayload(report),
      message: trimmedMessage,
      history,
    });

    if (!llmReply) {
      throw new ServiceUnavailableException("Report chat is temporarily unavailable.");
    }

    if (llmReply.refused) {
      return { reply: llmReply.reply || OFF_TOPIC_REPLY, refused: true };
    }

    return llmReply;
  }
}

function isObviouslyOffTopic(message: string): boolean {
  const offTopic = OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(message));
  if (!offTopic) {
    return false;
  }

  return !REPORT_TOPIC_PATTERNS.some((pattern) => pattern.test(message));
}
