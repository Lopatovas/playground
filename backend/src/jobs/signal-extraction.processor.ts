import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SignalsService } from '../signals/signals.service';

@Processor('signal-extraction')
export class SignalExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(SignalExtractionProcessor.name);

  constructor(private signalsService: SignalsService) {
    super();
  }

  async process(job: Job<{ documentId?: string; entityId?: string }>) {
    if (job.data.documentId) {
      this.logger.log(`Extracting signals from document ${job.data.documentId}`);
      const count = await this.signalsService.extractFromDocument(
        job.data.documentId,
      );
      return { extracted: count };
    }

    if (job.data.entityId) {
      this.logger.log(
        `Extracting unprocessed signals for entity ${job.data.entityId}`,
      );
      const count = await this.signalsService.extractUnprocessed(
        job.data.entityId,
      );
      return { extracted: count };
    }

    const count = await this.signalsService.extractUnprocessed();
    return { extracted: count };
  }
}
