import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCompetitorDto {
  @ApiProperty({ example: 'Rival Inc', description: 'Competitor company name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'rival.com', description: 'Competitor domain' })
  @IsOptional()
  @IsString()
  domain?: string;
}
