import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NearbyPlaceItemDto } from './nearby-places-response.dto.js';

export class SearchPlacesMetaDto {
  @ApiPropertyOptional({ example: 'equinox', nullable: true })
  q: string | null;

  @ApiPropertyOptional({ example: 'Miami', nullable: true })
  locality: string | null;

  @ApiPropertyOptional({ example: 'FL', nullable: true })
  region: string | null;

  @ApiPropertyOptional({ example: 'gym', nullable: true })
  category: string | null;

  @ApiProperty({ example: 20 })
  count: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}

export class SearchPlacesResponseDto {
  @ApiProperty({ type: [NearbyPlaceItemDto] })
  items: NearbyPlaceItemDto[];

  @ApiProperty({ type: SearchPlacesMetaDto })
  meta: SearchPlacesMetaDto;
}
