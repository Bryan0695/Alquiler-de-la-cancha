# Canchas Frontend

Aplicación web para la **reserva de canchas deportivas**. Los jugadores buscan canchas, consultan disponibilidad, reservan (con pago simulado) y califican; los administradores gestionan sus canchas y revisan las reservas recibidas.

Construida con **Angular 20** (componentes standalone y signals) y **PrimeNG** para la interfaz.

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Configuración del entorno](#configuración-del-entorno)
- [Roles y permisos](#roles-y-permisos)
- [Funcionalidades](#funcionalidades)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Comunicación con la API](#comunicación-con-la-api)
- [Scripts disponibles](#scripts-disponibles)

---

## Tecnologías

| Categoría        | Herramienta                          |
| ---------------- | ------------------------------------ |
| Framework        | Angular 20 (standalone + signals)    |
| UI               | PrimeNG 20, PrimeIcons, @primeuix/themes |
| Programación reactiva | RxJS 7                          |
| Lenguaje         | TypeScript 5.9                       |
| Testing          | Jasmine + Karma                      |
| Build            | Angular CLI (`@angular/build`)       |

---

## Requisitos previos

- **Node.js** 20 o superior
- **npm** 10 o superior
- Un backend/API disponible (ver [Configuración del entorno](#configuración-del-entorno))

---

## Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm start
```

La aplicación queda disponible en **http://localhost:4200/** y recarga automáticamente al modificar los archivos fuente.

---

## Configuración del entorno

La URL de la API se define en los archivos de entorno:

- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000', // ← URL del backend
};
```

Ajusta `apiUrl` según dónde esté corriendo tu backend.

---

## Roles y permisos

Existen dos roles (`src/app/core/models/usuario.model.ts`):

| Rol             | Descripción                                                        |
| --------------- | ------------------------------------------------------------------ |
| `JUGADOR`       | Busca canchas, reserva, ve su historial y califica.                |
| `ADMINISTRADOR` | Gestiona sus canchas (CRUD) y consulta las reservas recibidas.     |

El control de acceso se implementa con **guards de ruta**:

- `authGuard` — exige sesión iniciada; si no, redirige a `/login`.
- `jugadorGuard` — restringe rutas al rol jugador (a un admin lo envía a `/admin/canchas`).
- `adminGuard` — restringe rutas al rol administrador (a un jugador lo envía a `/canchas`).

La sesión (token JWT y datos del usuario) se persiste en `localStorage`. El `authInterceptor` añade automáticamente la cabecera `Authorization: Bearer <token>` a cada petición.

---

## Funcionalidades

**Autenticación**
- Registro de usuario e inicio de sesión.
- Cierre de sesión y persistencia de sesión entre recargas.

**Jugador**
- Búsqueda de canchas públicas con filtros (tipo, precio máximo).
- Consulta de disponibilidad por fecha.
- Reserva de una cancha con pago simulado.
- Historial de reservas propias.
- Calificación de canchas (puntaje y comentario).

**Administrador**
- Gestión de canchas propias: crear, editar y eliminar (baja lógica).
- Consulta de reservas recibidas, filtrables por rango de fechas.

---

## Rutas de la aplicación

Definidas en `src/app/app.routes.ts` (todas con carga diferida / *lazy loading*):

| Ruta                       | Acceso          | Descripción                          |
| -------------------------- | --------------- | ------------------------------------ |
| `/login`                   | Público         | Inicio de sesión                     |
| `/registro`                | Público         | Registro de usuario                  |
| `/canchas`                 | Jugador         | Buscar canchas                       |
| `/canchas/:id/reservar`    | Jugador         | Flujo de reserva                     |
| `/reservas`                | Jugador         | Mis reservas                         |
| `/admin/canchas`           | Administrador   | Gestión de canchas                   |
| `/admin/reservas`          | Administrador   | Reservas recibidas                   |

Las rutas protegidas cuelgan de un layout principal (`MainLayout`) que exige autenticación.

---

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

---

## Comunicación con la API

Los servicios de `core/services` encapsulan las llamadas HTTP. Endpoints principales (relativos a `apiUrl`):

| Servicio             | Método/Ruta                                   | Uso                            |
| -------------------- | --------------------------------------------- | ------------------------------ |
| `AuthService`        | `POST /login`, `POST /registro`               | Autenticación                  |
| `CanchaService`      | `GET/POST/PUT/DELETE /canchas`                | CRUD de canchas (admin)        |
| `CanchaService`      | `GET /canchas/publicas`                       | Catálogo público con filtros   |
| `ReservaService`     | `GET /canchas/{id}/horarios`                  | Disponibilidad por fecha       |
| `ReservaService`     | `POST /reservas`, `GET /reservas`             | Reservar / historial           |
| `ReservaService`     | `GET /admin/reservas`                         | Reservas recibidas (admin)     |
| `CalificacionService`| `POST /canchas/{id}/calificaciones`           | Calificar una cancha           |


---

## Scripts disponibles

| Comando          | Descripción                                              |
| ---------------- | -------------------------------------------------------- |
| `npm start`      | Servidor de desarrollo en `http://localhost:4200/`       |
| `npm run build`  | Compila a producción en `dist/`                          |
| `npm run watch`  | Compila en modo desarrollo y observa cambios             |
| `npm test`       | Ejecuta las pruebas unitarias con Karma                  |

---

## Notas

- El proyecto usa **componentes standalone**: no hay `NgModule`.
- El estado de sesión se maneja con **signals** de Angular (`AuthService`).
- El pago de las reservas es **simulado** (no hay integración con pasarela real).
