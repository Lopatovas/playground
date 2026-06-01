import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IngestionService } from '../ingestion/ingestion.service';

@Processor('ingestion')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private ingestionService: IngestionService) {
    super();
  }

  async process(job: Job<{ entityId?: string; sourceId?: string }>) {
    if (job.data.sourceId) {
      this.logger.log(`Ingesting source ${job.data.sourceId}`);
      const docId = await this.ingestionService.ingestSource(job.data.sourceId);
      return { documentId: docId };
    }

    if (job.data.entityId) {
      this.logger.log(`Ingesting all sources for entity ${job.data.entityId}`);
      const count = await this.ingestionService.ingestAllForEntity(
        job.data.entityId,
      );
      return { ingested: count };
    }

    return { error: 'No entityId or sourceId provided' };
  }
}
