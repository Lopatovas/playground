import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async submitFeedback(userId: string, dto: CreateFeedbackDto) {
    const signal = await this.prisma.signal.findUnique({
      where: { id: dto.signalId },
    });
    if (!signal) throw new NotFoundException('Signal not found');

    return this.prisma.feedback.upsert({
      where: {
        signalId_userId: { signalId: dto.signalId, userId },
      },
      update: {
        relevant: dto.relevant,
        comment: dto.comment,
      },
      create: {
        signalId: dto.signalId,
        userId,
        relevant: dto.relevant,
        comment: dto.comment,
      },
    });
  }
}
