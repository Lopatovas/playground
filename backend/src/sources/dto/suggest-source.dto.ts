import { IsString, IsUrl, IsEnum, IsOptional } from 'class-validator';
import { SourceType } from '@prisma/client';

export class SuggestSourceDto {
  @IsString()
  entityId: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsEnum(SourceType)
  type?: SourceType;
}
