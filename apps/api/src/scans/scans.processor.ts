import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { SCAN_QUEUE_NAME, type ScanJobData, ScansService } from "./scans.service.js";

@Processor(SCAN_QUEUE_NAME)
export class ScansProcessor extends WorkerHost {
  constructor(private readonly scansService: ScansService) {
    super();
  }

  async process(job: Job<ScanJobData>): Promise<unknown> {
    return this.scansService.processScanJob(job);
  }
}
