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
| Presentación | `routers/` | Recibe las peticiones HTTP, valida el formato de entrada y devuelve las respuestas JSON. Aquí se validan el token y el rol. |
| Negocio | `services/` | Contiene las reglas de negocio y orquesta las operaciones. Decide qué es válido y qué no. |
| Datos | `repositories/` | Único punto que habla con la base de datos. Abstrae las consultas SQL. |
| Modelos | `models/` | Define la forma de los datos (entidades) que viajan entre las capas. |

### Regla de dependencias

Cada capa solo llama a la capa inmediatamente inferior, nunca al revés y nunca saltando niveles:

```
routers → services → repositories → base de datos
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
│   │   ├── main.py                Punto de entrada de la aplicación
│   │   ├── database.py            Configuración de conexión a la BD
│   │   ├── routers/               Capa de presentación (endpoints)
│   │   ├── services/              Capa de negocio (reglas)
│   │   ├── repositories/          Capa de datos (acceso a BD)
│   │   └── models/                Entidades del dominio
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
- **FastAPI** — framework para construir la API REST
- **Uvicorn** — servidor que ejecuta la aplicación
- **SQLAlchemy** — ORM para el acceso a datos
- **SQLite** — base de datos en entorno local
- **PostgreSQL** — base de datos en entorno desplegado

### Frontend

- **Angular** — framework de la interfaz de usuario

### Comunicación

- **REST sobre HTTP** con datos en formato JSON
- **JWT (Bearer token)** para autenticación

---

## Requerimientos del sistema

### Requerimientos funcionales

| ID | Nombre | Descripción |
|----|--------|-------------|
| RF-001 | Buscar y filtrar canchas | El usuario busca canchas por tipo y precio. |
| RF-002 | Ver disponibilidad en calendario | Mostrar en un calendario los horarios disponibles en tiempo real. |
| RF-003 | Realizar reserva y pago | El usuario selecciona cancha y horario, y realiza el pago. |
| RF-004 | Sistema de reviews y calificaciones | Los usuarios califican canchas, dejan comentarios y consultan reviews. |
| RF-005 | Notificaciones y recordatorios | Notificar reserva confirmada y enviar recordatorios. |

### Requerimientos no funcionales

| ID | Nombre | Descripción |
|----|--------|-------------|
| RNF-001 | Performance móvil | Arranque < 3s, respuesta ágil en la interacción. |
| RNF-002 | Disponibilidad | Alta disponibilidad; las reservas nunca se pierden; transacciones ACID. |
| RNF-003 | Seguridad en pagos | No se almacenan datos de tarjeta; el pago se maneja con tokens. |
| RNF-004 | Compatibilidad | Funciona en las plataformas y navegadores objetivo. |
| RNF-005 | Escalabilidad | Soporta usuarios concurrentes, con mayor demanda los fines de semana. |

---

## Contrato de la API (OpenAPI)

El archivo `docs/openapi-canchas.yaml` define el contrato de la API: qué endpoints existen, qué recibe cada uno y qué devuelve. Es la referencia compartida entre backend y frontend.

Para visualizarlo de forma navegable, pega el contenido del archivo en [editor.swagger.io](https://editor.swagger.io).

### Endpoints de gestión de canchas (UC7)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Inicia sesión y devuelve un token JWT. |
| GET | `/canchas` | Lista las canchas del administrador. |
| POST | `/canchas` | Crea una nueva cancha. |
| GET | `/canchas/{id}` | Obtiene una cancha por su id. |
| PUT | `/canchas/{id}` | Edita una cancha existente. |
| DELETE | `/canchas/{id}` | Elimina lógicamente una cancha (baja lógica). |

Todos los endpoints de canchas requieren el token obtenido en `/login`, enviado en el header `Authorization: Bearer <token>`.

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
| Backend (API REST, base de datos) | *(por completar)* |
| Frontend (interfaz Angular) | *(por completar)* |

---

*Proyecto académico — Diseño de Software.*
