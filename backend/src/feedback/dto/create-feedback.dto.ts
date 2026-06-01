import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  signalId: string;

  @IsBoolean()
  relevant: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}
