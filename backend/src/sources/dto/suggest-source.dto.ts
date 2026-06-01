import { IsString, IsUrl, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '@prisma/client';

export class SuggestSourceDto {
  @ApiProperty({ example: 'uuid-of-entity', description: 'Entity UUID to attach this source to' })
  @IsString()
  entityId: string;

  @ApiProperty({ example: 'https://rival.com/pricing', description: 'Source URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ enum: SourceType, example: 'WEBSITE', description: 'Source type (auto-inferred if omitted)' })
  @IsOptional()
  @IsEnum(SourceType)
  type?: SourceType;
}
