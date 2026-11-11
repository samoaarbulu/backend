import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ schema: 'geo', name: 'places' })
export class PlaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'external_id', type: 'text', unique: true, nullable: true })
  externalId?: string;

  @Index()
  @Column({ type: 'text' })
  name: string;

  @Index()
  @Column({ name: 'brand_name', type: 'text', nullable: true })
  brandName?: string;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  locality?: string;

  @Column({ type: 'text', nullable: true })
  region?: string;

  @Index()
  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 5, default: 'US' })
  country: string;

  @Column({ type: 'text', array: true, nullable: true })
  phones?: string[];

  @Column({ type: 'text', array: true, nullable: true })
  websites?: string[];

  @Column({ type: 'text', array: true, nullable: true })
  emails?: string[];

  @Column({ type: 'text', array: true, nullable: true })
  socials?: string[];

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  confidence?: number;

  @Column({ name: 'operating_status', type: 'text', default: 'open' })
  operatingStatus: string;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  coordinates?: string;

  @Column({ type: 'text', default: 'overture_maps' })
  source: string;

  @Column({ name: 'raw_metadata', type: 'jsonb', nullable: true })
  rawMetadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
