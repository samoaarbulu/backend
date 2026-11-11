import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceEntity } from './entities/place.entity.js';
import { PlacesController } from './places.controller.js';
import { PlacesService } from './places.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PlaceEntity])],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
