import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SourcesModule } from '../sources/sources.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { SignalsModule } from '../signals/signals.module';
import { DiscoveryProcessor } from './discovery.processor';
import { IngestionProcessor } from './ingestion.processor';
import { SignalExtractionProcessor } from './signal-extraction.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'source-discovery' },
      { name: 'ingestion' },
      { name: 'signal-extraction' },
    ),
    SourcesModule,
    IngestionModule,
    SignalsModule,
  ],
  providers: [
    DiscoveryProcessor,
    IngestionProcessor,
    SignalExtractionProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
