import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NearbyPlacesQueryDto } from './dto/nearby-places-query.dto.js';
import {
  NearbyPlaceItemDto,
  NearbyPlacesResponseDto,
} from './dto/nearby-places-response.dto.js';
import { PlaceEntity } from './entities/place.entity.js';

function escapeLikePattern(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

interface NearbyPlaceRawRow {
  id: string;
  name: string;
  brandName: string | null;
  category: string | null;
  address: string | null;
  locality: string | null;
  region: string | null;
  postalCode: string | null;
  country: string;
  phones: string[] | null;
  websites: string[] | null;
  socials: string[] | null;
  operatingStatus: string;
  latitude: number | string;
  longitude: number | string;
  distanceMeters: number | string;
}

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlaceEntity)
    private readonly placesRepository: Repository<PlaceEntity>,
  ) {}

  /**
   * Busca locales abiertos dentro de un radio geodésico exacto en metros (PostGIS geography)
   * ordenados del más cercano al más lejano.
   */
  async findNearby(query: NearbyPlacesQueryDto): Promise<NearbyPlacesResponseDto> {
    const { lat, lng, radius, category, q, limit, offset } = query;
    const originGeography = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';

    const qb = this.placesRepository
      .createQueryBuilder('p')
      .select([
        'p.id AS "id"',
        'p.name AS "name"',
        'p.brand_name AS "brandName"',
        'p.category AS "category"',
        'p.address AS "address"',
        'p.locality AS "locality"',
        'p.region AS "region"',
        'p.postal_code AS "postalCode"',
        'p.country AS "country"',
        'p.phones AS "phones"',
        'p.websites AS "websites"',
        'p.socials AS "socials"',
        `COALESCE(p.operating_status, 'open') AS "operatingStatus"`,
        'ST_Y(p.coordinates)::double precision AS "latitude"',
        'ST_X(p.coordinates)::double precision AS "longitude"',
        `ROUND(ST_Distance(p.coordinates::geography, ${originGeography}))::int AS "distanceMeters"`,
      ])
      .where('p.coordinates IS NOT NULL')
      .andWhere(`COALESCE(p.operating_status, 'open') = 'open'`)
      .andWhere(`ST_DWithin(p.coordinates::geography, ${originGeography}, :radius)`, {
        lng,
        lat,
        radius,
      });

    if (category) {
      qb.andWhere('p.category = :category', { category });
    }

    if (q) {
      const term = `%${escapeLikePattern(q)}%`;
      qb.andWhere(`(p.name ILIKE :term ESCAPE '\\' OR p.brand_name ILIKE :term ESCAPE '\\')`, {
        term,
      });
    }

    const rawRows = await qb
      .orderBy(`ST_Distance(p.coordinates::geography, ${originGeography})`, 'ASC')
      .addOrderBy('p.id', 'ASC')
      .limit(limit)
      .offset(offset)
      .getRawMany<NearbyPlaceRawRow>();

    const items: NearbyPlaceItemDto[] = rawRows.map((row) => ({
      id: row.id,
      name: row.name,
      brandName: row.brandName,
      category: row.category,
      address: row.address,
      locality: row.locality,
      region: row.region,
      postalCode: row.postalCode,
      country: row.country,
      phones: row.phones,
      websites: row.websites,
      socials: row.socials,
      operatingStatus: row.operatingStatus,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      distanceMeters: Number(row.distanceMeters),
    }));

    return {
      items,
      meta: {
        lat,
        lng,
        radiusMeters: radius,
        count: items.length,
        limit,
        offset,
      },
    };
  }
}
