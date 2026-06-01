import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'uuid-of-signal', description: 'Signal UUID' })
  @IsString()
  signalId: string;

  @ApiProperty({ example: true, description: 'Whether the signal is relevant' })
  @IsBoolean()
  relevant: boolean;

  @ApiPropertyOptional({ example: 'Very useful insight', description: 'Optional comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}
