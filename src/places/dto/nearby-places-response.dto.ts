import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NearbyPlaceItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Equinox Brickell' })
  name: string;

  @ApiPropertyOptional({ example: 'Equinox', nullable: true })
  brandName: string | null;

  @ApiPropertyOptional({ example: 'gym', nullable: true })
  category: string | null;

  @ApiPropertyOptional({ example: '1441 Brickell Ave', nullable: true })
  address: string | null;

  @ApiPropertyOptional({ example: 'Miami', nullable: true })
  locality: string | null;

  @ApiPropertyOptional({ example: 'FL', nullable: true })
  region: string | null;

  @ApiPropertyOptional({ example: '33131', nullable: true })
  postalCode: string | null;

  @ApiProperty({ example: 'US' })
  country: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  phones: string[] | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  websites: string[] | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  socials: string[] | null;

  @ApiProperty({ example: 'open' })
  operatingStatus: string;

  @ApiProperty({ example: 25.7591 })
  latitude: number;

  @ApiProperty({ example: -80.1912 })
  longitude: number;

  @ApiProperty({
    example: 295,
    description: 'Distancia geodésica exacta al punto GPS en metros',
  })
  distanceMeters: number;
}

export class NearbyPlacesMetaDto {
  @ApiProperty({ example: 25.7617 })
  lat: number;

  @ApiProperty({ example: -80.1918 })
  lng: number;

  @ApiProperty({ example: 3000 })
  radiusMeters: number;

  @ApiProperty({ example: 20 })
  count: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}

export class NearbyPlacesResponseDto {
  @ApiProperty({ type: [NearbyPlaceItemDto] })
  items: NearbyPlaceItemDto[];

  @ApiProperty({ type: NearbyPlacesMetaDto })
  meta: NearbyPlacesMetaDto;
}
