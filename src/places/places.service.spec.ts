import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { NearbyPlacesQueryDto } from './dto/nearby-places-query.dto.js';
import { PlaceEntity } from './entities/place.entity.js';
import { PlacesService } from './places.service.js';

describe('PlacesService & NearbyPlacesQueryDto', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('valida parámetros GPS y asigna valores por defecto (3000 m, limit 20, offset 0)', async () => {
    const dto = (await validationPipe.transform(
      { lat: '25.7617', lng: '-80.1918' },
      { type: 'query', metatype: NearbyPlacesQueryDto },
    )) as NearbyPlacesQueryDto;

    expect(dto.lat).toBe(25.7617);
    expect(dto.lng).toBe(-80.1918);
    expect(dto.radius).toBe(3000);
    expect(dto.limit).toBe(20);
    expect(dto.offset).toBe(0);
  });

  it('rechaza lat vacía o fuera de rango', async () => {
    await expect(
      validationPipe.transform(
        { lat: '', lng: '-80.1918' },
        { type: 'query', metatype: NearbyPlacesQueryDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        { lat: '95', lng: '-80.1918' },
        { type: 'query', metatype: NearbyPlacesQueryDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('construye la consulta PostGIS geography con filtros y mapea respuesta', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Equinox Brickell',
          brandName: 'Equinox',
          category: 'gym',
          address: '1441 Brickell Ave',
          locality: 'Miami',
          region: 'FL',
          postalCode: '33131',
          country: 'US',
          phones: ['+13055550100'],
          websites: ['https://equinox.com'],
          socials: null,
          operatingStatus: 'open',
          latitude: '25.7591',
          longitude: '-80.1912',
          distanceMeters: '295',
        },
      ]),
    };

    const repo = {
      createQueryBuilder: vi.fn().mockReturnValue(qb),
    } as unknown as Repository<PlaceEntity>;

    const service = new PlacesService(repo);
    const result = await service.findNearby({
      lat: 25.7617,
      lng: -80.1918,
      radius: 3000,
      category: 'gym',
      q: '100%_fit',
      limit: 10,
      offset: 0,
    });

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('ST_DWithin(p.coordinates::geography'),
      { lng: -80.1918, lat: 25.7617, radius: 3000 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('p.category = :category', {
      category: 'gym',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE :term'),
      { term: '%100\\%\\_fit%' },
    );
    expect(qb.limit).toHaveBeenCalledWith(10);
    expect(qb.offset).toHaveBeenCalledWith(0);

    expect(result.meta).toEqual({
      lat: 25.7617,
      lng: -80.1918,
      radiusMeters: 3000,
      count: 1,
      limit: 10,
      offset: 0,
    });
    expect(result.items[0]).toMatchObject({
      name: 'Equinox Brickell',
      latitude: 25.7591,
      longitude: -80.1912,
      distanceMeters: 295,
    });
  });
});
