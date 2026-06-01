import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit relevance feedback on a signal (upserts per user)' })
  @ApiResponse({ status: 201, description: 'Feedback created or updated' })
  @ApiResponse({ status: 404, description: 'Signal not found' })
  submitFeedback(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.submitFeedback(user.id, dto);
  }
}
