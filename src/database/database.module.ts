import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './data-source.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // La API en runtime usa DATABASE_URL (usuario restringido DML: creds_app_user_*)
        const runtimeUrl =
          config.get<string>('DATABASE_URL') || config.get<string>('DIRECT_URL');
        return {
          ...buildDataSourceOptions(runtimeUrl),
          autoLoadEntities: true,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
