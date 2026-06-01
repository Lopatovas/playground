import { Module } from '@nestjs/common';
import { BullBoardModule as NestBullBoard } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    NestBullBoard.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    NestBullBoard.forFeature({
      name: 'source-discovery',
      adapter: BullMQAdapter,
    }),
    NestBullBoard.forFeature({
      name: 'ingestion',
      adapter: BullMQAdapter,
    }),
    NestBullBoard.forFeature({
      name: 'signal-extraction',
      adapter: BullMQAdapter,
    }),
  ],
})
export class BullBoardModule {}
