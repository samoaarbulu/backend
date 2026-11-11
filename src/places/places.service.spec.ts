import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { NearbyPlacesQueryDto } from './dto/nearby-places-query.dto.js';
import { SearchPlacesQueryDto } from './dto/search-places-query.dto.js';
import { PlaceEntity } from './entities/place.entity.js';
import { PlacesService } from './places.service.js';

function createMockRepo(rows: Record<string, unknown>[]) {
  const qb = {
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    setParameters: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue(rows),
  };

  const repo = {
    createQueryBuilder: vi.fn().mockReturnValue(qb),
  } as unknown as Repository<PlaceEntity>;

  return { repo, qb };
}

describe('PlacesService & Places Query DTOs', () => {
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

  it('construye la consulta PostGIS geography en findNearby y mapea respuesta', async () => {
    const { repo, qb } = createMockRepo([
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
    ]);

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
    expect(result.items[0]).toMatchObject({
      name: 'Equinox Brickell',
      latitude: 25.7591,
      longitude: -80.1912,
      distanceMeters: 295,
    });
  });

  it('permite buscar por texto y ciudad sin GPS en searchPlaces', async () => {
    const { repo, qb } = createMockRepo([
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Equinox Coral Gables',
        brandName: 'Equinox',
        category: 'gym',
        address: '370 San Lorenzo Ave',
        locality: 'Coral Gables',
        region: 'FL',
        postalCode: '33146',
        country: 'US',
        phones: null,
        websites: null,
        socials: null,
        operatingStatus: 'open',
        latitude: 25.7318,
        longitude: -80.2584,
        distanceMeters: null,
      },
    ]);

    const dto = (await validationPipe.transform(
      { q: ' equinox ', locality: 'Coral', region: 'fl' },
      { type: 'query', metatype: SearchPlacesQueryDto },
    )) as SearchPlacesQueryDto;

    const service = new PlacesService(repo);
    const result = await service.searchPlaces(dto);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('p.locality ILIKE :locality'),
      { locality: '%Coral%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'UPPER(p.region) = UPPER(:region)',
      { region: 'fl' },
    );
    expect(result.items[0].distanceMeters).toBeNull();
    expect(result.meta).toMatchObject({
      q: 'equinox',
      locality: 'Coral',
      region: 'fl',
      count: 1,
    });
  });

  it('exige enviar lat y lng juntos en searchPlaces', async () => {
    const { repo } = createMockRepo([]);
    const service = new PlacesService(repo);

    await expect(
      service.searchPlaces({
        lat: 25.7617,
        limit: 20,
        offset: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
