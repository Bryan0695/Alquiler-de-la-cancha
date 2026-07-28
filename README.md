# Sistema de Reservas de Canchas de Fútbol

Aplicación para reservar canchas de fútbol, gestionar su disponibilidad y administrar reservas. El proyecto está dividido en un **backend** (API REST) y un **frontend** (aplicación cliente), desarrollados por separado y conectados mediante peticiones HTTP.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Tecnologías](#tecnologías)
- [Requerimientos del sistema](#requerimientos-del-sistema)
- [Contrato de la API (OpenAPI)](#contrato-de-la-api-openapi)
- [Cómo levantar el backend](#cómo-levantar-el-backend)
- [Base de datos](#base-de-datos)
- [Flujo de trabajo con Git](#flujo-de-trabajo-con-git)
- [Equipo](#equipo)

---

## Descripción general

El sistema permite a dos tipos de usuarios interactuar con la plataforma:

- **Jugador:** busca canchas, consulta disponibilidad, realiza reservas y deja calificaciones.
- **Administrador:** gestiona las canchas (crear, editar, eliminar) y consulta las reservas asociadas.

El backend expone una API REST que devuelve datos en formato JSON. El frontend consume esa API y se encarga de toda la interfaz de usuario. Ambas partes se comunican por HTTP, lo que permite que se desarrollen y desplieguen de forma independiente.

---

## Arquitectura

### Estilo y patrón

- **Estilo arquitectónico:** Monolito
- **Patrón interno:** Arquitectura en capas (layered architecture)

El backend es un único proyecto desplegable, organizado internamente en capas con responsabilidades bien separadas. No es MVC, porque no renderiza vistas: la capa de presentación devuelve JSON y la interfaz vive en el frontend (otro proyecto).

### Las capas

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Presentación | `routers/` | Recibe las peticiones HTTP, aplica el `Depends` de seguridad (token + rol) y traduce las excepciones de negocio a códigos HTTP (`400`, `403`, `404`, `409`). No conoce SQL ni reglas de negocio. |
| Negocio | `services/` | Orquesta cada caso de uso: valida datos, decide si una operación es válida (ej. no eliminar una cancha con reservas activas) y arma las entidades antes de guardarlas. Lanza excepciones propias (`ValidacionException`, `IntegridadException`) en vez de HTTP. |
| Datos | `repositories/` | Único punto que habla con la base de datos vía SQLAlchemy. Aquí viven las queries (`filter`, `count`, `commit`). Nada fuera de esta capa arma un `Session.query`. |
| Modelos | `models/` | Entidades de SQLAlchemy (`Cancha`, `Usuario`, `Reserva`, etc.), sus columnas, `relationship()` entre tablas y métodos de dominio simples (`Cancha.crear()`, `Horario.generar_franjas()`). |
| DTOs / Esquemas | `schemas/` | Clases Pydantic que definen qué forma debe tener el JSON de entrada (`CanchaCreate`) y de salida (`CanchaListResponse`, `CanchaDetalleResponse`). Desacoplan el modelo de base de datos de lo que el cliente ve. |

### Transversal (cross-cutting)

Estos archivos no son una capa propia, los usan varias capas:

| Archivo | Responsabilidad |
|---------|-----------------|
| `security.py` | Lee el header `Authorization: Bearer <token>` (`HTTPBearer`), resuelve el usuario y valida que tenga rol `ADMINISTRADOR`. Hoy usa un diccionario de tokens simulados (`token-admin`, `token-jugador`) mientras no exista login real con JWT firmado. |
| `exceptions.py` | Excepciones propias del dominio (`ValidacionException`, `IntegridadException`) que la capa de negocio lanza y la capa de presentación traduce a códigos HTTP. |
| `database.py` | Configura el engine de SQLAlchemy y expone `get_db()`, la dependencia que entrega una sesión de base de datos por petición. |

### Regla de dependencias

Cada capa solo llama a la capa inmediatamente inferior, nunca al revés y nunca saltando niveles:

```
routers → services → repositories → base de datos
   ↓           ↓
schemas   exceptions
```

Un router jamás accede directamente a la base de datos: siempre pasa por el service y este por el repository. Esta regla mantiene el sistema ordenado, testeable y fácil de mantener.

### Comunicación frontend–backend

```
Frontend (Angular)                Backend (FastAPI)
──────────────────                ──────────────────
Interfaz de usuario     ─HTTP─►   API REST
                        ◄─JSON─   
Corre en :4200                    Corre en :8000
```

El frontend hace peticiones HTTP a los endpoints del backend y recibe JSON. El contrato entre ambos está definido en el archivo OpenAPI (ver más abajo), lo que permite que cada equipo trabaje sin depender del otro en tiempo real.

---

## Estructura del repositorio

```
Alquiler-de-la-cancha/
│
├── docs/                          Documentación de diseño
│   ├── casos de uso/              Diagramas de casos de uso (UML)
│   ├── diagrama de clases/        Diagrama de clases con atributos
│   ├── diagramas de secuencia/    Diagramas de secuencia por caso de uso
│   └── openapi-canchas.yaml       Contrato de la API (referencia del equipo)
│
├── backend/                       API REST en FastAPI
│   ├── app/
│   │   ├── main.py                Punto de entrada: crea la app FastAPI, registra CORS y routers
│   │   ├── database.py            Engine de SQLAlchemy + get_db()
│   │   ├── security.py            Autenticación/autorización (Bearer token + rol)
│   │   ├── exceptions.py          Excepciones de dominio (Validacion, Integridad)
│   │   ├── routers/                Capa de presentación (endpoints)
│   │   │   └── cancha.py          GET/POST/DELETE /canchas
│   │   ├── services/              Capa de negocio (reglas)
│   │   │   └── cancha_service.py
│   │   ├── repositories/          Capa de datos (acceso a BD)
│   │   │   └── cancha_repo.py
│   │   ├── models/                Entidades del dominio (SQLAlchemy)
│   │   │   └── rol, usuario, cancha, horario, reserva, pago, calificacion
│   │   └── schemas/               DTOs de entrada/salida (Pydantic)
│   │       └── cancha_schema.py
│   ├── scripts/                   SQL de creación y poblado de tablas (pgAdmin)
│   ├── mocks/                     Casos de prueba manuales por endpoint (peticiones y respuestas esperadas)
│   ├── requirements.txt           Dependencias de Python
│   └── .env                       Variables de entorno (NO se sube)
│
├── frontend/                      Aplicación cliente en Angular
│
├── .gitignore
└── README.md
```

---

## Tecnologías

### Backend

- **Python 3.9+**
- **FastAPI** — framework para construir la API REST; genera además la documentación interactiva (`/docs`).
- **Uvicorn** (`[standard]`) — servidor ASGI que ejecuta la aplicación, con `--reload` en desarrollo.
- **SQLAlchemy** — ORM: define los modelos (`models/`) y ejecuta las queries (`repositories/`).
- **Pydantic** — valida y serializa los datos de entrada/salida (`schemas/`); es la base de los modelos de FastAPI.
- **psycopg2-binary** — driver de conexión a PostgreSQL usado por SQLAlchemy en producción.
- **python-dotenv** — carga las variables del archivo `.env` (ej. `DATABASE_URL`) al iniciar la app.
- **SQLite** — base de datos por defecto en entorno local (no requiere instalación ni servidor).
- **PostgreSQL** (Render) — base de datos en el entorno desplegado, persistente.

### Frontend

- **Angular** — framework de la interfaz de usuario

### Comunicación

- **REST sobre HTTP** con datos en formato JSON
- **Bearer token** para autenticación (hoy simulado con tokens fijos; JWT real queda pendiente hasta que exista el login)

---

## Contrato de la API (OpenAPI)

El archivo `docs/openapi-canchas.yaml` define el contrato de la API: qué endpoints existen, qué recibe cada uno y qué devuelve. Es la referencia compartida entre backend y frontend.

Para visualizarlo de forma navegable, pega el contenido del archivo en [editor.swagger.io](https://editor.swagger.io).

### Endpoints implementados (UC7 — gestión de canchas)

| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| GET | `/canchas` | Lista las canchas activas del administrador autenticado. | `200`, `401`, `403` |
| POST | `/canchas` | Crea una cancha y genera sus franjas horarias. | `201`, `400`, `401`, `403` |
| DELETE | `/canchas/{id}` | Baja lógica (`activa = false`). Rechaza si la cancha tiene reservas `PENDIENTE`/`CONFIRMADA`, o si no pertenece al administrador. | `200`, `401`, `403`, `404`, `409` |

Pendientes según el contrato OpenAPI: `POST /login` (autenticación real con JWT), `GET /canchas/{id}` y `PUT /canchas/{id}`.

### Autenticación (simulada por ahora)

Como todavía no existe el login, `security.py` valida el header `Authorization: Bearer <token>` contra un diccionario fijo de tokens de prueba:

| Token | Rol | Uso |
|-------|-----|-----|
| `token-admin` | ADMINISTRADOR (id 1) | Administrador dueño de las canchas de prueba |
| `token-admin2` | ADMINISTRADOR (id 3) | Otro administrador, para probar que no puede tocar canchas ajenas |
| `token-jugador` | JUGADOR (id 2) | Para probar que un jugador recibe `403` en endpoints de canchas |

Se reemplazará por verificación de JWT real cuando exista el endpoint de login. Los casos de prueba manuales para cada token están en `backend/mocks/001-Peticiones`.

Cuando el backend está corriendo, FastAPI genera documentación interactiva automáticamente en `http://localhost:8000/docs`.

---

## Cómo levantar el backend

### 1. Requisitos previos

Tener instalado Python 3.9 o superior. Verificar con:

```bash
python --version
```

### 2. Clonar el repositorio

```bash
git clone https://github.com/Bryan0695/Alquiler-de-la-cancha.git
cd Alquiler-de-la-cancha/backend
```

### 3. Crear y activar el entorno virtual

```bash
python -m venv venv
```

```bash
# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

Cuando está activo, el prompt muestra `(venv)` al inicio.

### 4. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 5. Levantar el servidor

```bash
uvicorn app.main:app --reload
```

La API queda disponible en:

- `http://localhost:8000` — raíz de la API
- `http://localhost:8000/docs` — documentación interactiva

El flag `--reload` reinicia el servidor automáticamente al guardar cambios.

---

## Base de datos

El proyecto usa dos motores según el entorno, gestionados con SQLAlchemy para que el código no cambie entre uno y otro:

| Entorno | Motor | Motivo |
|---------|-------|--------|
| Local | SQLite | Es un archivo, no requiere instalación ni servidor. |
| Desplegado | PostgreSQL | Persistente; el disco de los servidores gratuitos es efímero y borraría un archivo SQLite. |

La conexión se define mediante la variable de entorno `DATABASE_URL`:

```python
# Local (valor por defecto)
DATABASE_URL = "sqlite:///./canchas.db"

# Desplegado
DATABASE_URL = "postgresql://usuario:password@host/basedatos"
```

Esta variable se guarda en un archivo `.env` que **nunca se sube al repositorio** (está incluido en `.gitignore`), porque contiene credenciales.

---

## Flujo de trabajo con Git

El proyecto usa ramas para que ambos integrantes trabajen sin pisarse:

```
main               Rama estable, con lo que funciona
feature/backend    Desarrollo del backend
feature/frontend   Desarrollo del frontend
```

### Reglas del equipo

- No se trabaja directamente sobre `main`.
- Cada integrante trabaja en su propia rama.
- Los cambios se integran a `main` mediante Pull Requests, para revisar antes de juntar.

### Comandos frecuentes

```bash
# Crear y cambiar a tu rama
git checkout -b feature/backend

# Guardar cambios
git add .
git commit -m "Descripción del cambio"
git push -u origin feature/backend

# Traer lo último de main a tu rama
git checkout main
git pull
git checkout feature/backend
git merge main
```

---

## Equipo

| Rol | Responsable |
|-----|-------------|
| Backend (API REST, base de datos) | Jessenia Toapanta |
| Frontend (interfaz Angular) | Bryan Gallegos |

---

*Proyecto académico UEES — Diseño de Software.*
