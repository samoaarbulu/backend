# CREDS — Backend API (NestJS)

Servidor backend oficial para la plataforma **CREDS (`getcreds.co`)**. Construido sobre **NestJS v12 (ESM)**, **TypeScript** y **PostgreSQL 16 + PostGIS**.

---

## 🛠️ Stack Técnico

* **Framework:** NestJS v12 (ESM Nativo)
* **Documentación API:** OpenAPI 3.0 / Swagger (`@nestjs/swagger`)
* **Base de Datos:** PostgreSQL 16 + PostGIS 3.7 + `pg_trgm` + `uuid-ossp`
* **ORM & Migraciones:** TypeORM (`synchronize: false`, gestión estricta por migraciones)
* **Testing:** Vitest
* **Gestor de Paquetes:** `pnpm`

---

## 🗄️ Arquitectura de Base de Datos

### Esquemas Lógicos (`SCHEMAS`)
El motor PostgreSQL se organiza por dominios para aislar lógica crítica y seguridad (Row-Level Security):
* **`geo`**: Catálogo maestro de lugares/gimnasios (`geo.places`), geometrías PostGIS `Point (4326)`, índices espaciales `GiST` y búsqueda difusa `GIN (pg_trgm)`.
* **`ranking`** *(próximo)*: Motor canónico A/B de duelos, buckets y cálculo de score (0 a 10).
* **`auth_core`** *(próximo)*: Cuentas, perfiles y sesiones.
* **`views`** *(próximo)*: Vistas agregadas seguras para consumo público y negocios (regla estricta $\ge 5$ rankeadores).

### Regla de Oro (NestJS como dueño del DDL)
* Todas las tablas, vistas, funciones e índices **se crean y versionan únicamente mediante migraciones en `src/database/migrations/`**.
* **Prohibido** activar `synchronize: true`.
* La carga inicial masiva de datos geoespaciales se realiza desde el proyecto satélite independiente [`creds-etl`](../creds-etl), el cual inserta en la tabla `geo.places` ya estructurada por NestJS.

---

## 📋 Requisitos Previos y Conexión

1. Instalar dependencias:
   ```bash
   pnpm install
   ```
2. Configurar `.env` (ver `.env.example`):
   * `DATABASE_URL`: Conexión de runtime (`creds_app_user_dev` en desarrollo).
   * `DIRECT_URL`: Conexión DDL para ejecutar migraciones (`creds_user`).
3. Para conectar desde desarrollo local hacia el servidor OVHcloud US (`creds_dev_db`), mantener abierto el túnel SSH:
   ```cmd
   ..\documentacion previa\Cred-Presupuesto\conexiones\DB\tunel_db.bat
   ```

---

## 🚀 Comandos Principales

### Migraciones de Base de Datos
```bash
# Compila y aplica todas las migraciones pendientes en PostgreSQL
pnpm run migration:run
```

#### Migraciones Implementadas:
1. `CreateGeoPlacesTable1715000000000`: Habilita extensiones (`postgis`, `pg_trgm`, `uuid-ossp`), crea el esquema `geo`, tabla `geo.places` e índices `GiST` / `GIN`.
2. `AddRichDetailsToGeoPlacesTable1715000000001`: Añade campos enriquecidos de catálogo (`brand_name`, `postal_code`, `phones`, `websites`, `emails`, `socials`, `confidence`, `operating_status`, `raw_metadata`) e índices de búsqueda.

### Desarrollo y Compilación
```bash
# Desarrollo (watch mode)
pnpm run start:dev

# Compilar TypeScript a dist/
pnpm run build

# Producción
pnpm run start:prod
```

### Documentación Interactiva (Swagger UI)
Al levantar la aplicación en modo desarrollo (`NODE_ENV !== 'production'` o `ENABLE_SWAGGER=true`):
* **Endpoints REST:** `http://localhost:3000/api`
* **Swagger UI:** `http://localhost:3000/api/docs`
* **Esquema OpenAPI JSON:** `http://localhost:3000/api/docs-json`
* **Autenticación soportada en Swagger:** Esquema `firebase-auth` (Bearer JWT).

### Calidad y Testing
```bash
# Tests unitarios (Vitest)
pnpm run test

# Tests End-to-End (E2E)
pnpm run test:e2e

# Linter y formateo
pnpm run lint
pnpm run format
```

---

## 📁 Estructura del Código Fuente (`src/`)

```text
src/
├── database/
│   ├── migrations/              # Archivos de migración DDL versionados
│   ├── data-source.ts           # Configuración TypeORM + search_path + SSL
│   ├── database.module.ts       # Módulo NestJS de conexión a PostgreSQL
│   └── run-migrations.ts        # Runner ESM para ejecución segura de migraciones
├── places/
│   └── entities/
│       └── place.entity.ts      # Entidad de dominio mapeada a geo.places
├── app.module.ts
└── main.ts
```
