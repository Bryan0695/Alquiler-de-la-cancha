# Canchas Frontend

Aplicación web para la reserva de canchas deportivas del Parque Samanes. Los
jugadores buscan canchas, consultan disponibilidad, reservan (con pago
simulado) y califican; los administradores gestionan sus canchas y revisan
las reservas recibidas.

Construida con **Angular 20** (componentes standalone y signals) y
**PrimeNG** para la interfaz. Es el proyecto hermano de
[`backend/`](../backend) (FastAPI) dentro de este mismo repositorio — cada
uno se desarrolla en su propia rama (`feature/frontend` / `feature/backend`)
y se comunican por HTTP siguiendo el contrato definido en
[`docs/openapi-canchas.yaml`](../docs/openapi-canchas.yaml).

## Tabla de contenidos

- [Estado del proyecto](#estado-del-proyecto)
- [Primeros pasos si acabas de clonar el repo](#primeros-pasos-si-acabas-de-clonar-el-repo)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Configuración del entorno](#configuración-del-entorno)
- [Coordinación con el backend](#coordinación-con-el-backend)
- [Roles y permisos](#roles-y-permisos)
- [Funcionalidades](#funcionalidades)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Comunicación con la API](#comunicación-con-la-api)
- [Scripts disponibles](#scripts-disponibles)

## Estado del proyecto

Los 8 casos de uso del documento de requerimientos (`docs/`) están
implementados del lado del frontend y probados en conjunto con el backend:

| UC | Caso de uso | Estado |
|----|-------------|--------|
| UC1 | Registrarse | Implementado y probado |
| UC2 | Iniciar sesión | Implementado y probado |
| UC3 | Buscar cancha disponible | Implementado y probado |
| UC4 | Reservar cancha | Implementado y probado |
| UC5 | Pagar reserva (simulado) | Implementado y probado |
| UC6 | Calificar cancha | Implementado (embebido en "Mis reservas") |
| UC7 | Gestionar canchas (admin) |  Implementado y probado (CRUD completo) |
| UC8 | Consultar reservas (jugador y admin) | Implementado y probado |

El pago es **simulado**: no hay integración con ninguna pasarela real, tal
como especifica RF-005.

## Primeros pasos si acabas de clonar el repo

```bash
# 1. Clona el repositorio completo (backend + frontend viven juntos aquí)
git clone https://github.com/Bryan0695/Alquiler-de-la-cancha.git
cd Alquiler-de-la-cancha/frontend

# 2. Instala las dependencias
npm install

# 3. Levanta el backend en paralelo (en otra terminal, ver backend/README.md)
#    y confirma que responde en http://localhost:8000

# 4. Levanta el frontend
npm start
```

La app queda en `http://localhost:4200/`. Necesitas el backend corriendo
**con CORS habilitado para `http://localhost:4200`** — si no, vas a ver
errores de CORS en la consola del navegador al intentar loguearte.

Para probar los dos roles, regístrate normalmente desde `/registro` (te crea
un usuario JUGADOR) y pide que te den o crea tú mismo un usuario
ADMINISTRADOR directamente en la base de datos del backend.

## Tecnologías

| Categoría | Herramienta |
|---|---|
| Framework | Angular 20 (standalone + signals) |
| UI | PrimeNG 20, PrimeIcons, `@primeuix/themes` |
| Programación reactiva | RxJS 7 |
| Lenguaje | TypeScript 5.9 |
| Testing | Jasmine + Karma |
| Build | Angular CLI (`@angular/build`) |

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- El backend (`../backend`) corriendo localmente o desplegado (ver
  [Configuración del entorno](#configuración-del-entorno))

## Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm start
```

La aplicación queda disponible en `http://localhost:4200/` y recarga
automáticamente al modificar los archivos fuente.

## Configuración del entorno

La URL de la API se define en los archivos de entorno:

- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000', // ← URL del backend
};
```

Ajusta `apiUrl` según dónde esté corriendo tu backend.

## Coordinación con el backend

Backend y frontend se desarrollaron en paralelo, en ramas separadas, usando
[`docs/openapi-canchas.yaml`](../docs/openapi-canchas.yaml) como contrato
compartido — el frontend se construyó contra ese contrato incluso antes de
que cada endpoint existiera realmente en el backend, y los servicios de
`core/services/` documentan en comentarios qué está confirmado y qué era
todavía una propuesta pendiente de validar con el equipo de backend.

A medida que se fue necesitando un endpoint nuevo o se encontraba un
problema de integración (CORS, un endpoint faltante, una regla de negocio
no cubierta por el contrato original, etc.), se documentó como un pedido
puntual y se coordinó directamente con quien mantiene `feature/backend`.
Ejemplos de ajustes que salieron de esa coordinación:

- `POST /registro` (UC1) no estaba en el contrato original — se agregó a
  pedido, junto con su documentación en el OpenAPI.
- `GET /canchas` es admin-only por diseño (devuelve las canchas del
  administrador autenticado); para la búsqueda pública del Jugador (UC3) se
  agregó `GET /canchas/publicas` aparte.
- Los horarios (`GET /canchas/{id}/horarios`) se generan de forma
  perezosa (al vuelo, por fecha) en vez de precalcularse al crear la
  cancha, porque la tabla `horario` es por fecha concreta.
- `POST /canchas/{id}/calificaciones` (UC6) recalcula
  `promedio_calificacion` de la cancha en cada calificación nueva.

Si necesitas pedir o ajustar un endpoint, sigue el mismo patrón: revisa qué
dice `docs/openapi-canchas.yaml`, y si falta algo o no matchea lo que el
frontend necesita, corrígelo ahí también al coordinar el cambio.

## Roles y permisos

Existen dos roles (`src/app/core/models/usuario.model.ts`):

| Rol | Descripción |
|---|---|
| `JUGADOR` | Busca canchas, reserva, ve su historial y califica. |
| `ADMINISTRADOR` | Gestiona sus canchas (CRUD) y consulta las reservas recibidas. |

El control de acceso se implementa con guards de ruta:

- **`authGuard`** — exige sesión iniciada; si no, redirige a `/login`.
- **`jugadorGuard`** — restringe rutas al rol Jugador (a un admin lo envía a
  `/admin/canchas`).
- **`adminGuard`** — restringe rutas al rol Administrador (a un jugador lo
  envía a `/canchas`).

La sesión (token JWT y datos del usuario) se persiste en `localStorage`. El
`authInterceptor` añade automáticamente la cabecera
`Authorization: Bearer <token>` a cada petición, y el `errorInterceptor`
cierra sesión automáticamente si el backend responde 401.

## Funcionalidades

**Autenticación**
- Registro de usuario e inicio de sesión.
- Cierre de sesión y persistencia de sesión entre recargas.

**Jugador**
- Búsqueda de canchas públicas con filtros (tipo, precio máximo).
- Consulta de disponibilidad por fecha.
- Reserva de una cancha con pago simulado.
- Historial de reservas propias ("Mis reservas").
- Calificación de canchas ya reservadas (puntaje y comentario).

**Administrador**
- Gestión de canchas propias: crear, editar y eliminar (baja lógica).
- Consulta de reservas recibidas, filtrables por rango de fechas.

## Rutas de la aplicación

Definidas en `src/app/app.routes.ts` (todas con carga diferida / lazy
loading):

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | Público | Inicio de sesión |
| `/registro` | Público | Registro de usuario |
| `/canchas` | Jugador | Buscar canchas |
| `/canchas/:id/reservar` | Jugador | Flujo de reserva |
| `/reservas` | Jugador | Mis reservas (+ calificar) |
| `/admin/canchas` | Administrador | Gestión de canchas |
| `/admin/reservas` | Administrador | Reservas recibidas |

Las rutas protegidas cuelgan de un layout principal (`MainLayout`) que
exige autenticación y muestra un menú lateral distinto según el rol.

## Estructura del proyecto

```
src/
├── app/
│   ├── core/                  # Lógica transversal
│   │   ├── guards/            # authGuard, adminGuard, jugadorGuard
│   │   ├── interceptors/      # authInterceptor, errorInterceptor
│   │   ├── models/            # Interfaces y tipos (Usuario, Cancha, Reserva…)
│   │   └── services/          # AuthService, CanchaService, ReservaService, CalificacionService
│   ├── features/              # Módulos funcionales
│   │   ├── auth/              # login, registro
│   │   ├── canchas/           # buscar, listar (admin), formulario
│   │   └── reservas/          # flujo de reserva, listado, panel admin
│   ├── layout/                # MainLayout (contenedor con navegación)
│   ├── shared/                # Componentes reutilizables (cards, diálogos, spinner)
│   ├── app.config.ts          # Providers globales (router, HttpClient, interceptores)
│   └── app.routes.ts          # Definición de rutas
└── environments/              # Configuración por entorno
```

## Comunicación con la API

Los servicios de `core/services/` encapsulan las llamadas HTTP. Endpoints
principales (relativos a `apiUrl`):

| Servicio | Método/Ruta | Uso |
|---|---|---|
| `AuthService` | `POST /login`, `POST /registro` | Autenticación |
| `CanchaService` | `GET/POST/PUT/DELETE /canchas` | CRUD de canchas (admin) |
| `CanchaService` | `GET /canchas/publicas` | Catálogo público con filtros |
| `ReservaService` | `GET /canchas/{id}/horarios` | Disponibilidad por fecha |
| `ReservaService` | `POST /reservas`, `GET /reservas` | Reservar / historial |
| `ReservaService` | `GET /admin/reservas` | Reservas recibidas (admin) |
| `CalificacionService` | `POST /canchas/{id}/calificaciones` | Calificar una cancha |

El contrato completo (payloads, códigos de estado, validaciones) vive en
[`docs/openapi-canchas.yaml`](../docs/openapi-canchas.yaml).

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo en `http://localhost:4200/` |
| `npm run build` | Compila a producción en `dist/` |
| `npm run watch` | Compila en modo desarrollo y observa cambios |
| `npm test` | Ejecuta las pruebas unitarias con Karma |

## Notas

- El proyecto usa componentes standalone: no hay `NgModule`.
- El estado de sesión se maneja con signals de Angular (`AuthService`).
- El pago de las reservas es simulado (no hay integración con pasarela real).
