import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NearbyPlacesQueryDto } from './dto/nearby-places-query.dto.js';
import { NearbyPlacesResponseDto } from './dto/nearby-places-response.dto.js';
import { PlacesService } from './places.service.js';

@ApiTags('Places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar locales cercanos por GPS',
    description:
      'Devuelve locales deportivos abiertos dentro del radio indicado (por defecto 3000 m = 3 km), ordenados por distancia exacta usando PostGIS geography.',
  })
  @ApiOkResponse({ type: NearbyPlacesResponseDto })
  findNearby(@Query() query: NearbyPlacesQueryDto): Promise<NearbyPlacesResponseDto> {
    return this.placesService.findNearby(query);
  }
}
