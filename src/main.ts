import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todos los endpoints REST
  app.setGlobalPrefix('api');
  app.enableCors();

  // Documentación OpenAPI / Swagger UI (habilitada fuera de producción o si se solicita explícitamente)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('CREDS Core API')
      .setDescription(
        'API Oficial de CREDS (getcreds.co) — Log → Bucket → Duel → Share → Discover',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT de Firebase Auth',
        },
        'firebase-auth',
      )
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 CREDS API corriendo en: http://localhost:${port}/api`);
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    console.log(`📚 Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
  }
}
await bootstrap();
