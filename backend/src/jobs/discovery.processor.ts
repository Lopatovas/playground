import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SourcesService } from '../sources/sources.service';

@Processor('source-discovery')
export class DiscoveryProcessor extends WorkerHost {
  private readonly logger = new Logger(DiscoveryProcessor.name);

  constructor(private sourcesService: SourcesService) {
    super();
  }

  async process(job: Job<{ entityId: string }>) {
    this.logger.log(`Discovering sources for entity ${job.data.entityId}`);
    const count = await this.sourcesService.discoverSources(job.data.entityId);
    this.logger.log(`Discovered ${count} sources for entity ${job.data.entityId}`);
    return { discovered: count };
  }
}
