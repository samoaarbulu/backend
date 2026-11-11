import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NearbyPlacesQueryDto } from './dto/nearby-places-query.dto.js';
import {
  NearbyPlaceItemDto,
  NearbyPlacesResponseDto,
} from './dto/nearby-places-response.dto.js';
import { SearchPlacesQueryDto } from './dto/search-places-query.dto.js';
import { SearchPlacesResponseDto } from './dto/search-places-response.dto.js';
import { PlaceEntity } from './entities/place.entity.js';

const ORIGIN_GEOGRAPHY_EXPR =
  'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';

const BASE_PLACE_SELECT_COLUMNS = [
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
];

interface PlaceRawRow {
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
  distanceMeters: number | string | null;
}

function escapeLikePattern(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function mapPlaceRows(rows: PlaceRawRow[]): NearbyPlaceItemDto[] {
  return rows.map((row) => ({
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
    distanceMeters:
      row.distanceMeters === null || row.distanceMeters === undefined
        ? null
        : Number(row.distanceMeters),
  }));
}

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlaceEntity)
    private readonly placesRepository: Repository<PlaceEntity>,
  ) {}

  private createPlacesQuery(includeDistance: boolean): SelectQueryBuilder<PlaceEntity> {
    const distanceSelect = includeDistance
      ? `ROUND(ST_Distance(p.coordinates::geography, ${ORIGIN_GEOGRAPHY_EXPR}))::int AS "distanceMeters"`
      : 'NULL::int AS "distanceMeters"';

    return this.placesRepository
      .createQueryBuilder('p')
      .select([...BASE_PLACE_SELECT_COLUMNS, distanceSelect])
      .where('p.coordinates IS NOT NULL')
      .andWhere(`COALESCE(p.operating_status, 'open') = 'open'`);
  }

  private applyCommonFilters(
    qb: SelectQueryBuilder<PlaceEntity>,
    filters: { category?: string; q?: string },
  ): void {
    if (filters.category) {
      qb.andWhere('p.category = :category', { category: filters.category });
    }

    if (filters.q) {
      const term = `%${escapeLikePattern(filters.q)}%`;
      qb.andWhere(
        `(p.name ILIKE :term ESCAPE '\\' OR p.brand_name ILIKE :term ESCAPE '\\')`,
        { term },
      );
    }
  }

  /**
   * Busca locales abiertos dentro de un radio geodésico exacto en metros (PostGIS geography)
   * ordenados del más cercano al más lejano.
   */
  async findNearby(query: NearbyPlacesQueryDto): Promise<NearbyPlacesResponseDto> {
    const { lat, lng, radius, category, q, limit, offset } = query;

    const qb = this.createPlacesQuery(true).andWhere(
      `ST_DWithin(p.coordinates::geography, ${ORIGIN_GEOGRAPHY_EXPR}, :radius)`,
      { lng, lat, radius },
    );

    this.applyCommonFilters(qb, { category, q });

    const rawRows = await qb
      .orderBy(`ST_Distance(p.coordinates::geography, ${ORIGIN_GEOGRAPHY_EXPR})`, 'ASC')
      .addOrderBy('p.id', 'ASC')
      .limit(limit)
      .offset(offset)
      .getRawMany<PlaceRawRow>();

    const items = mapPlaceRows(rawRows);

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

  /**
   * Busca locales abiertos por texto (nombre/marca), ciudad/estado y opcionalmente cercanía GPS.
   */
  async searchPlaces(query: SearchPlacesQueryDto): Promise<SearchPlacesResponseDto> {
    const { q, locality, region, category, lat, lng, radius, limit, offset } = query;

    const hasLat = lat !== undefined;
    const hasLng = lng !== undefined;
    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'Debes enviar tanto lat como lng para filtrar u ordenar por ubicación GPS.',
      );
    }

    const hasCoordinates = hasLat && hasLng;
    const qb = this.createPlacesQuery(hasCoordinates);

    this.applyCommonFilters(qb, { category, q });

    if (locality) {
      qb.andWhere(`p.locality ILIKE :locality ESCAPE '\\'`, {
        locality: `%${escapeLikePattern(locality)}%`,
      });
    }

    if (region) {
      qb.andWhere('UPPER(p.region) = UPPER(:region)', { region });
    }

    if (hasCoordinates) {
      qb.setParameters({ lat, lng });
      if (radius !== undefined) {
        qb.andWhere(
          `ST_DWithin(p.coordinates::geography, ${ORIGIN_GEOGRAPHY_EXPR}, :radius)`,
          { radius },
        );
      }
      qb.orderBy(
        `ST_Distance(p.coordinates::geography, ${ORIGIN_GEOGRAPHY_EXPR})`,
        'ASC',
      ).addOrderBy('p.id', 'ASC');
    } else {
      qb.orderBy('p.name', 'ASC').addOrderBy('p.id', 'ASC');
    }

    const rawRows = await qb
      .limit(limit)
      .offset(offset)
      .getRawMany<PlaceRawRow>();

    const items = mapPlaceRows(rawRows);

    return {
      items,
      meta: {
        q: q ?? null,
        locality: locality ?? null,
        region: region ?? null,
        category: category ?? null,
        count: items.length,
        limit,
        offset,
      },
    };
  }
}
