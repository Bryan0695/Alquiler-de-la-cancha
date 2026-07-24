# Informe de malos olores (code smells)

**Proyecto:** Alquiler de canchas — backend (FastAPI) + frontend (Angular 20)
**Fecha:** 24 de julio de 2026
**Alcance analizado:** `backend/app/`, `backend/tests/`, `backend/test_conexion.py`, `canchas-frontend/src/`, `angular.json`

---

## Resumen

Se identificaron **21 malos olores**: 8 en el backend y 13 en el frontend.

| Severidad | Cantidad | Significado |
|---|---|---|
| 🔴 Alta | 6 | Rompe el funcionamiento o impide desplegar/probar |
| 🟠 Media | 9 | Duplicación o acoplamiento que encarece cada cambio |
| 🟡 Baja | 6 | Higiene de código; deuda que crece si no se atiende |

Los dos hallazgos más graves son **B-01** (el backend no expone ninguno de los endpoints que el frontend consume, ni habilita CORS) y **F-01** (la compilación de producción apunta a `localhost`).

---

# Backend

## B-01 · 🔴 API vacía: sin routers, sin CORS, sin capa de dominio

**Ubicación:** `backend/app/main.py:1-7`

```python
from fastapi import FastAPI

app = FastAPI(title="API Canchas")

@app.get("/")
def root():
    return {"mensaje": "hola mundo"}
```

**Por qué es un problema.** Toda la aplicación son 7 líneas de andamiaje. El frontend consume `/login`, `/registro`, `/canchas`, `/canchas/publicas`, `/canchas/{id}/horarios`, `/reservas`, `/admin/reservas` y `/canchas/{id}/calificaciones`: **ninguno existe**. Además falta `CORSMiddleware`, así que aunque existieran, el navegador bloquearía toda petición desde `localhost:4200` hacia `localhost:8000` por política de mismo origen (y no hay `proxy.conf.json` en el frontend que lo evite).

Es el olor **"Objeto de mentira"**: el módulo se llama `app` y anuncia `title="API Canchas"`, pero no cumple el contrato que el resto del sistema asume. El equipo de frontend ya escribió mensajes de error resignados como *"el backend todavía no expone este endpoint"* (ver F-06), señal de que la deuda ya se está pagando en otra capa.

---

## B-02 · 🔴 La suite de pruebas no llega ni a recolectarse

**Ubicación:** `backend/tests/test_cancha_service.py:8-10`, `backend/tests/test_horario.py:3`, `backend/tests/test_security.py:6`

```python
from app.services.cancha_service import CanchaService     # no existe app/services/
from app.models.cancha import Cancha
from app.exceptions import ValidacionException, ...       # no existe app/exceptions.py
```

Salida real de `pytest`:

```
ERROR tests/test_cancha_service.py   ModuleNotFoundError: No module named 'app.services'
ERROR tests/test_horario.py          ModuleNotFoundError: No module named 'app.models.horario'
ERROR tests/test_security.py         ModuleNotFoundError: No module named 'app.security'
!!!!! Interrupted: 3 errors during collection !!!!!
```

**Por qué es un problema.** Tres de los cuatro archivos de prueba se escribieron contra módulos que nunca se implementaron. El error es de **recolección**, no de aserción: pytest aborta antes de ejecutar nada, así que **también deja de correr `test_cancha_model.py`**, que sí es válido. Resultado: el proyecto tiene 0 % de cobertura efectiva mientras aparenta tener una suite de pruebas. Es el olor de la **prueba fantasma**: da una falsa señal de seguridad y hace que nadie confíe en el comando `pytest`, que siempre está en rojo.

---

## B-03 · 🔴 Fallback silencioso a una base de datos distinta

**Ubicación:** `backend/app/database.py:8`

```python
url = os.getenv("DATABASE_URL", "sqlite:///./canchas.db")
```

**Por qué es un problema.** Si `DATABASE_URL` falta o está mal escrita, la aplicación **no falla**: arranca contra un archivo SQLite vacío. Las consultas devuelven listas vacías y los `INSERT` se pierden en un archivo local, mientras los logs no dicen nada. El fallo se manifiesta lejos de su causa —un usuario reportando "guardé una cancha y desapareció"— en vez de en el arranque.

Peor aún, ese *default* cambia el motor de base de datos: SQLite no soporta el mismo SQL, tipos ni concurrencia que PostgreSQL, así que el código puede pasar en desarrollo y romper en producción. La configuración obligatoria debe **fallar rápido y ruidosamente**, no adivinar.

---

## B-04 · 🟠 Efectos secundarios en tiempo de importación

**Ubicación:** `backend/app/database.py:6-16`

```python
load_dotenv()                                    # lee el disco al importar

url = os.getenv("DATABASE_URL", "sqlite:///./canchas.db")
...
engine = create_engine(url, connect_args=connect_args)   # crea el engine al importar
SessionLocal = sessionmaker(bind=engine)
```

**Por qué es un problema.** Basta con `import app.database` —o importar cualquier modelo, que hereda de `Base`— para leer el `.env` y construir un engine. Eso hace el módulo **imposible de configurar desde las pruebas** salvo con trucos frágiles: el propio `tests/conftest.py:8` tiene que sobreescribir la variable de entorno *antes* de cualquier import y documentarlo con un comentario de 6 líneas explicando el peligro:

```python
# Forzamos el valor (no setdefault) para ignorar cualquier DATABASE_URL
# de Postgres del .env y no arriesgar la base de produccion.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
```

Cuando un archivo de configuración de pruebas necesita advertir sobre "no arriesgar la base de producción", el diseño ya está avisando del problema. La solución convencional es una *factory* (`def crear_engine(url)`) invocada explícitamente en el arranque.

---

## B-05 · 🟠 Script de conexión disfrazado de prueba automatizada

**Ubicación:** `backend/test_conexion.py:8-24` (raíz del backend, no en `tests/`)

```python
def test_conexion_db():
    url = os.getenv("DATABASE_URL")
    assert url is not None, "Error: DATABASE_URL no está definida..."
    ...
    engine = create_engine(url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.scalar()
        print("\n Conexión exitosa a:", version)
```

**Por qué es un problema.** Acumula tres olores:

1. **Nombre engañoso.** Se llama `test_*` pero abre una conexión real a PostgreSQL: es una prueba de integración manual, no unitaria. Además `pytest.ini:2` fija `testpaths = tests`, así que **nunca se ejecuta** — es código muerto que aparenta estar cubierto.
2. **Comunicación por `print`.** Una prueba real comunica con aserciones, no imprimiendo en consola para que un humano lo lea.
3. **Lógica duplicada.** La normalización `postgres://` → `postgresql://` está copiada literalmente de `database.py:9`:

   ```python
   # database.py:9
   url = url.replace("postgres://", "postgresql://", 1)
   # test_conexion.py:15-16
   if url.startswith("postgres://"):
       url = url.replace("postgres://", "postgresql://", 1)
   ```

   Dos copias de la misma regla que hay que recordar cambiar juntas.

---

## B-06 · 🟠 Modelo anémico: sin restricciones y con dato derivado almacenado

**Ubicación:** `backend/app/models/cancha.py:4-13`

```python
class Cancha(Base):
    __tablename__ = "Cancha"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(20))                        # sin CHECK ni Enum
    precio_hora = Column(Numeric(10, 2))             # admite negativos y NULL
    hora_apertura = Column(Time)
    hora_cierre = Column(Time)                       # nada impide cierre < apertura
    promedio_calificacion = Column(Numeric(3, 2), default=0)
    activa = Column(Boolean, default=True)
```

**Por qué es un problema.**

- **Invariantes sin proteger.** Solo `nombre` es `nullable=False`. La base acepta una cancha con `precio_hora = -50` o con `hora_cierre` anterior a `hora_apertura`. Las reglas de negocio quedan delegadas a que *toda* ruta futura se acuerde de validarlas — y basta con que una lo olvide. El propio `tests/test_cancha_service.py` prueba esas validaciones a nivel de servicio, lo que confirma que la regla existe pero vive fuera del modelo.
- **`tipo` como texto libre.** `String(20)` permite `"FUTBOL_5"`, `"futbol5"` y `"Futbol 5"` como valores distintos. De hecho el desacuerdo ya existe: la prueba usa `"FUTBOL_5"` (`test_cancha_service.py:16`) y el frontend usa `'futbol5'` (`cancha.model.ts:23`). Debería ser un `Enum`.
- **Dato derivado almacenado.** `promedio_calificacion` es el promedio de la tabla de calificaciones. Guardarlo crea una segunda fuente de verdad que **se desincroniza** en cuanto una calificación se inserta, edita o borra sin actualizar esta columna.
- **`__tablename__ = "Cancha"`** en mayúscula y singular obliga a comillas dobles en cada consulta SQL manual en PostgreSQL (que normaliza a minúsculas), y rompe la convención `canchas`.

---

## B-07 · 🟡 `requirements.txt` es un volcado de `pip freeze`

**Ubicación:** `backend/requirements.txt:1-47`

```
annotated-doc==0.0.4
...
detect-installer==0.1.0
fastapi-cloud-cli==0.22.2
fastar==0.11.0
...
rignore==0.8.0
sentry-sdk==2.66.0
```

**Por qué es un problema.** 47 dependencias fijadas donde el proyecto usa directamente unas 6 (`fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `python-dotenv`, `pytest`). El resto son transitivas o basura arrastrada del CLI: `sentry-sdk`, `fastapi-cloud-cli`, `rignore`, `fastar` y `detect-installer` **no se importan en ninguna parte del código**.

Consecuencias: superficie de ataque y tiempo de instalación innecesarios, imposibilidad de distinguir qué se eligió a propósito de qué vino de arrastre, y actualizaciones bloqueadas (fijar transitivas provoca conflictos de resolución). Además no hay separación entre dependencias de producción y de desarrollo: `pytest` se instalaría en el servidor.

---

## B-08 · 🟡 Paquetes implícitos y ausencia de migraciones

**Ubicación:** `backend/app/`, `backend/tests/` (no existe ningún `__init__.py`)

**Por qué es un problema.** `app/` y `app/models/` funcionan como *namespace packages* implícitos: los imports resuelven solo si el intérprete se lanza desde `backend/`. Cualquier otro directorio de trabajo, o empaquetar el proyecto, rompe `from app.database import Base` de forma difícil de diagnosticar.

En la misma línea, no hay Alembic ni ningún mecanismo de migración: el esquema solo puede crearse con `Base.metadata.create_all()`, que **no aplica cambios sobre tablas existentes**. En cuanto el modelo evolucione, la única salida será modificar la base a mano y esperar que todos los entornos queden iguales.

---

# Frontend

## F-01 · 🔴 La compilación de producción apunta a `localhost`

**Ubicación:** `canchas-frontend/angular.json:40-55` y `src/environments/environment.prod.ts:1-4`

```jsonc
// angular.json — configuración "production": NO hay fileReplacements
"production": {
  "budgets": [ ... ],
  "outputHashing": "all"
}
```

```typescript
// environment.prod.ts — declarado, nunca usado
export const environment = {
  production: true,
  apiUrl: 'https://canchas-api.onrender.com',
};
```

**Por qué es un problema.** Angular sustituye `environment.ts` por `environment.prod.ts` **únicamente** si la configuración de build declara `fileReplacements`. Aquí no existe (verificado: 0 coincidencias en todo `angular.json`). Por lo tanto:

1. `environment.prod.ts` es **código muerto**: la URL de producción nunca se usa.
2. `ng build` genera un bundle que llama a `http://localhost:8000`. La aplicación desplegada **no funciona para ningún usuario**, y falla además por *mixed content* (una página HTTPS no puede llamar a HTTP).

Es el olor más caro del frontend porque el archivo existe, se ve correcto y da una falsa sensación de que el despliegue está resuelto. El fallo solo aparece en producción.

---

## F-02 · 🟠 Doble manejo del 401: el interceptor pelea con el login

**Ubicación:** `src/app/core/interceptors/error.interceptor.ts:12-18` frente a `src/app/features/auth/login/login.ts:44-47`

```typescript
// error.interceptor.ts — global, sin excepciones
catchError((error: HttpErrorResponse) => {
  if (error.status === 401) {
    auth.logout();
    router.navigate(['/login']);
  }
  return throwError(() => error);
}),
```

```typescript
// login.ts — el componente asume que él controla el error
error: () => {
  this.cargando.set(false);
  this.error.set('Correo o contraseña incorrectos.');
},
```

**Por qué es un problema.** Un login con credenciales incorrectas devuelve 401. El interceptor lo intercepta **primero** y dispara `logout()` + `navigate(['/login'])` sobre un usuario que ni siquiera tenía sesión y que ya está en `/login`. El componente después escribe su mensaje de error en una vista que el router puede estar reconstruyendo, así que el mensaje *"Correo o contraseña incorrectos"* puede desaparecer sin que el usuario entienda qué pasó.

Dos piezas manejando la misma condición sin conocerse es **responsabilidad difusa**: el interceptor debería excluir las rutas de autenticación (`/login`, `/registro`), que es donde un 401 significa "credenciales malas" y no "sesión expirada".

---

## F-03 · 🟠 Tres funciones duplicadas literalmente entre componentes

**Ubicación:**

| Función | Copia A | Copia B |
|---|---|---|
| Etiqueta de tipo de cancha | `cancha-form.ts:112-119` | `canchas-buscar.ts:82-89` |
| Fecha → ISO local | `reserva-flow.ts:15-20` (`aFechaISO`) | `reservas-admin.ts:19-24` (`aISO`) |
| Severidad de estado de pago | `reservas-list.ts:136-140` | `reservas-admin.ts:73-77` |

```typescript
// cancha-form.ts:112-119 y canchas-buscar.ts:82-89 — idénticas
private etiquetaTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    futbol5: 'Fútbol 5',
    futbol7: 'Fútbol 7',
    futbol11: 'Fútbol 11',
  };
  return mapa[tipo] ?? tipo;
}
```

```typescript
// reserva-flow.ts:15-20 y reservas-admin.ts:19-24 — mismo cuerpo, distinto nombre
function aFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}
```

```typescript
// reservas-list.ts:136-140 y reservas-admin.ts:73-77 — idénticas
severidadPago(estado: string | undefined): 'success' | 'warn' | 'danger' {
  if (estado === 'PAGADO') return 'success';
  if (estado === 'RECHAZADO') return 'danger';
  return 'warn';
}
```

**Por qué es un problema.** **Código duplicado**, el olor clásico. Agregar un cuarto tipo de cancha, un nuevo estado de pago o corregir el formato de fecha obliga a editar dos archivos y a acordarse del segundo. El caso de la fecha es especialmente peligroso: el mismo algoritmo con **dos nombres distintos** (`aFechaISO` y `aISO`) es más difícil de encontrar con una búsqueda, así que la copia olvidada puede sobrevivir años. Estas tres funciones son puras y sin dependencias: pertenecen a `shared/` o a los propios modelos.

---

## F-04 · 🟠 Problema N+1: una petición HTTP por cada cancha para obtener su nombre

**Ubicación:** `src/app/features/reservas/reservas-list/reservas-list.ts:78-83`

```typescript
const idsUnicos = [...new Set(reservas.map((r) => r.cancha_id))];
const peticiones = idsUnicos.map((id) =>
  this.canchaService.obtener(id).pipe(map((cancha) => [id, cancha.nombre] as const)),
);

forkJoin(peticiones).subscribe({ ... });
```

**Por qué es un problema.** Para mostrar una tabla de reservas se hace 1 petición de reservas **+ N peticiones de canchas**. Un usuario con reservas en 15 canchas distintas dispara 16 llamadas HTTP secuenciadas por el `forkJoin`, cada una con su latencia y su cabecera de autenticación. La pantalla no muestra nada hasta que la última responda.

Es además **acoplamiento innecesario**: la vista de reservas depende del servicio de canchas solo para resolver un `string`. La solución correcta está del lado del servidor —que `GET /reservas` incluya `cancha_nombre`, igual que ya hace `ReservaAdminView` (`reserva.model.ts:35-45`)—. Nótese la incoherencia: el endpoint de administración ya devuelve el nombre resuelto; el de jugador no.

---

## F-05 · 🟠 Bandera booleana manual para emular "el diálogo se abrió"

**Ubicación:** `src/app/features/canchas/cancha-form/cancha-form.ts:41, 51-79` y `src/app/shared/components/calificar-dialog/calificar-dialog.ts:26-36`

```typescript
// cancha-form.ts
private dialogYaAbierto = false;

constructor() {
  effect(() => {
    const visible = this.visible();
    const actual = this.cancha();

    if (visible && !this.dialogYaAbierto) {
      // ... resetear el formulario
    }

    this.dialogYaAbierto = visible;   // estado mutable dentro del efecto
  });
}
```

```typescript
// calificar-dialog.ts — el mismo truco, ahora con una variable de cierre
constructor() {
  let abiertoAntes = false;
  effect(() => {
    const abierto = this.visible();
    if (abierto && !abiertoAntes) { ... }
    abiertoAntes = abierto;
  });
}
```

**Por qué es un problema.** Ambos componentes reimplementan "detectar el flanco de subida de `visible`" con estado mutable escondido dentro de un `effect`. Es un olor doble:

1. **Duplicación del mismo patrón** en dos archivos, con dos técnicas distintas (campo privado vs. variable de cierre), lo que hace más difícil reconocer que son el mismo problema.
2. **Efecto con estado.** Un `effect` está pensado para reaccionar, no para llevar memoria. La lógica es frágil: depende del orden en que Angular evalúe las señales y de que nadie más escriba en la bandera. La comprobación es implícita, así que al leer el código no es obvio *por qué* existe la condición — de hecho hizo falta escribir cuatro pruebas específicas (abrir, escribir sin que se borre, cerrar y reabrir) para fijar el comportamiento.

Un `dialogVisible` gestionado con dos salidas explícitas (`abrir()` / `cerrar()`), o un simple `ngOnChanges`, elimina la bandera.

---

## F-06 · 🟠 Mensajes de usuario que filtran nombres de clases internas

**Ubicación:** `canchas-buscar.ts:61-63`, `reservas-admin.ts:66-68`, `reserva-flow.ts:92-94`

```typescript
// canchas-buscar.ts:61-63
this.error.set(
  'Esta función depende de un endpoint público que el backend todavía no expone (GET /canchas/publicas). GET /canchas es solo para administradores.',
);
```

```typescript
// reservas-admin.ts:66-68
this.error.set(
  'Esta función depende de un endpoint que el backend todavía no expone (ver ReservaService.listarReservasAdmin).',
);
```

**Por qué es un problema.** Se le muestra al usuario final el nombre de un método TypeScript (`ReservaService.listarReservasAdmin`) y detalles de autorización del API. Tres problemas:

1. **Mezcla de audiencias.** Es una nota del desarrollador para sí mismo, colocada en la interfaz de usuario. Un jugador que ve *"ver ReservaService.listarReservasAdmin"* no puede hacer nada con esa información.
2. **Fuga de información.** Revelar qué endpoints existen y cuáles son "solo para administradores" es información útil para un atacante.
3. **Se desactualiza en silencio.** El mensaje quedará ahí, mintiendo, el día que el endpoint sí exista pero falle por otro motivo (red caída, 500), porque **cualquier** error entra por esa rama. El texto afirma una causa que el código no verificó.

---

## F-07 · 🟠 Suscripciones sin cancelar en todos los componentes

**Ubicación:** patrón repetido — `canchas-list.ts:50, 91`, `canchas-buscar.ts:54`, `reserva-flow.ts:64, 85, 112`, `reservas-list.ts:60, 83, 115`, `reservas-admin.ts:59`, `login.ts:38`, `registro.ts:60`, `cancha-form.ts:99`

```typescript
this.canchaService.listar().subscribe({
  next: (canchas) => {
    this.canchas.set(canchas);      // escribe en el componente
    this.cargando.set(false);
  },
  ...
});
```

**Por qué es un problema.** Ninguna de las 13 suscripciones se cancela: no hay `takeUntilDestroyed`, ni `unsubscribe`, ni pipe `async` en ningún archivo del proyecto (verificado por búsqueda). Si el usuario navega fuera antes de que responda el servidor, el `next` se ejecuta sobre un componente ya destruido y escribe en señales que nadie lee.

Con `HttpClient` esto no suele filtrar memoria porque el observable se completa solo, pero el olor sí tiene consecuencias reales: en `reserva-flow.ts:112` una respuesta tardía puede cambiar `paso()` de un componente abandonado, y sobre todo **establece un patrón** que sí filtrará en cuanto aparezca el primer observable de larga vida (un WebSocket, un `interval`, un `valueChanges` de formulario).

---

## F-08 · 🟠 Manejo de errores copiado y pegado en cada componente

**Ubicación:** `canchas-buscar.ts:59-64`, `reservas-admin.ts:64-69`, `reserva-flow.ts:90-95`, `reservas-list.ts:62-67`

```typescript
error: () => {
  this.cargando.set(false);
  this.error.set('...mensaje distinto en cada archivo...');
},
```

**Por qué es un problema.** Cuatro componentes repiten la misma estructura de estado (`cargando` + `error` + `datos`) y la misma coreografía en cada petición. La lógica es idéntica; solo cambia el texto. Cada pantalla nueva copiará el bloque otra vez, y una mejora transversal —reintentos, registro de errores, un formato de mensaje uniforme— exige tocar todos los archivos.

Se agrava con **F-06**: como cada componente redacta su propio texto, los mensajes ya son inconsistentes entre sí (unos culpan al backend, otros dicen "intenta nuevamente"). Es candidato natural a un `resource()` de Angular o a una utilidad compartida.

---

## F-09 · 🟡 Filtrado del lado del cliente sobre datos que debía filtrar el servidor

**Ubicación:** `src/app/features/canchas/canchas-buscar/canchas-buscar.ts:40, 49-53`

```typescript
readonly canchasFiltradas = computed(() => this.canchas().filter((cancha) => cancha.activa));

// ...pero tipo y precio sí se delegan al servidor:
this.canchaService.buscarPublicas({
  tipo: this.tipoSeleccionado() ?? undefined,
  precioMax: this.precioMaximo() ?? undefined,
})
```

**Por qué es un problema.** Los filtros de tipo y precio viajan al servidor, pero el de "activa" se aplica en el navegador. Criterio incoherente para el mismo caso de uso. Consecuencias concretas:

- El servidor transfiere canchas inactivas que el usuario nunca verá (ancho de banda y exposición de datos que no le corresponden).
- Cuando se agregue paginación, el conteo se romperá: el servidor dirá "20 resultados" y la pantalla mostrará 14, porque 6 se descartaron después.

Un endpoint llamado `/canchas/publicas` debería, por definición, devolver únicamente las canchas públicas y activas.

---

## F-10 · 🟡 Parámetro de ruta sin validar convertido a `NaN`

**Ubicación:** `src/app/features/reservas/reserva-flow/reserva-flow.ts:44`

```typescript
private readonly canchaId = Number(this.route.snapshot.paramMap.get('id'));
```

**Por qué es un problema.** `Number(null)` da `0` y `Number('abc')` da `NaN`; no hay comprobación alguna. Con una URL manipulada como `/canchas/abc/reservar`, el componente emite `GET /canchas/NaN` y `GET /canchas/NaN/horarios`, y el usuario ve la pantalla de carga colgada o un error genérico en lugar de un "cancha no encontrada" claro. Convertir una entrada externa sin validarla traslada un problema de datos a un fallo de red confuso.

---

## F-11 · 🟡 `ReservaService.baseUrl` no es la URL base del servicio

**Ubicación:** `src/app/core/services/reserva.service.ts:9, 14, 20, 27, 32`

```typescript
private readonly baseUrl = `${environment.apiUrl}/canchas`;   // ← dice "canchas"

obtenerDisponibilidad(...)  { ...`${this.baseUrl}/${canchaId}/horarios`... }   // usa baseUrl
reservar(...)               { ...`${environment.apiUrl}/reservas`... }         // la ignora
listarMisReservas()         { ...`${environment.apiUrl}/reservas`... }         // la ignora
listarReservasAdmin(...)    { ...`${environment.apiUrl}/admin/reservas`... }   // la ignora
```

**Por qué es un problema.** **Nombre engañoso**: en un servicio de reservas, un campo llamado `baseUrl` apunta a `/canchas` y solo lo usa 1 de sus 4 métodos. Quien lea el código asumirá que cambiar `baseUrl` reconfigura el servicio completo, cuando en realidad afectaría solo a `obtenerDisponibilidad`. Además, el literal `/reservas` está repetido en dos métodos sin constante. El nombre honesto sería `canchasUrl`.

---

## F-12 · 🟡 Tipo `ApiError` declarado y nunca usado, con `any` en su lugar

**Ubicación:** `src/app/core/models/common.model.ts:5-7` frente a `src/app/features/canchas/cancha-form/cancha-form.ts:104-108`

```typescript
// common.model.ts — declarado, cero referencias en todo el proyecto
export interface ApiError {
  detail: string;
}
```

```typescript
// cancha-form.ts:104-108 — el lugar exacto donde haría falta, sin tipar
error: (err) => {                                    // err: any implícito
  this.errorGuardado =
    err?.error?.detail ?? 'No se pudo guardar la cancha. Verifica los datos ingresados.';
},
```

**Por qué es un problema.** El tipo existe precisamente para esto y no se usa en ninguna parte (verificado: la única aparición de `ApiError` es su propia declaración). Todos los manejadores de error del proyecto reciben `err` sin tipo y navegan la estructura con encadenamiento opcional a ciegas (`err?.error?.detail`, `err?.status`). Se pierde la verificación del compilador justo donde más falta hace: un cambio en el formato de error del backend no producirá ningún error de compilación, solo mensajes silenciosamente vacíos en producción.

---

## F-13 · 🟡 Nombres y estilos residuales del andamiaje

**Ubicación:** `src/app/features/reservas/reservas-list/reservas-list.html:3-5, 43` y `reservas-list.scss:1`; bloque `&__etiqueta` repetido en 9 archivos `.scss`

```html
<!-- reservas-list.html: la pantalla ya no es un stub, pero sus clases sí -->
<div class="stub__header">
  <span class="stub__etiqueta">UC8 · Mis reservas</span>
  <h1 class="stub__titulo">Mis reservas</h1>
```

```scss
// El mismo bloque, byte a byte, en 9 archivos distintos:
// canchas-buscar.scss:2, reservas-admin.scss:2, reservas-list.scss:2,
// canchas-list.scss:9, login.scss:20, registro.scss:20,
// cancha-form.scss:7, reserva-flow.scss:2, calificar-dialog.scss:2
&__etiqueta {
  display: inline-block;
  background: #eaf3ee;
  color: #1f4f3f;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  margin-bottom: 0.4rem;
}
```

**Por qué es un problema.** Dos olores de higiene:

- **Nombre fósil.** `stub__*` describe lo que el componente fue durante el desarrollo, no lo que es. Quien busque "reservas" en los estilos no encontrará nada; quien vea `stub` asumirá que la pantalla está sin terminar y no la tocará.
- **Duplicación de estilos.** El mismo bloque de 9 propiedades está copiado en 9 archivos, con los colores `#eaf3ee` y `#1f4f3f` escritos a mano cada vez (hay 90 literales hexadecimales repartidos por los `.scss`). Un cambio de identidad visual implica 9 ediciones idénticas y la casi certeza de que alguna quedará desalineada. Corresponde a un mixin o a variables en `styles.scss` — que además sigue usando `@import` (`styles.scss:2`), **obsoleto en Sass** y con eliminación anunciada, en lugar de `@use`.

---

# Prioridad sugerida

| # | Acción | Impacto |
|---|---|---|
| 1 | **B-01** — implementar routers y habilitar CORS | Sin esto la aplicación no funciona en absoluto |
| 2 | **F-01** — agregar `fileReplacements` a la config de producción | Corrección de 4 líneas; hoy el despliegue está roto |
| 3 | **B-02** — alinear las pruebas con el código existente | Devuelve utilidad a `pytest`; hoy nunca pasa |
| 4 | **B-03** — quitar el fallback silencioso y fallar al arrancar | Evita corrupción de datos difícil de rastrear |
| 5 | **F-02** — excluir rutas de auth del interceptor | Error visible para el usuario en cada login fallido |
| 6 | **F-03 / F-05 / F-13** — extraer duplicados a `shared/` | Barato de corregir; abarata todo cambio posterior |
| 7 | **B-06** — restricciones en el modelo y `tipo` como Enum | Protege la integridad antes de que haya datos reales |

---

## Nota sobre el método

Cada hallazgo fue verificado sobre el código, no inferido:

- La ausencia de `fileReplacements` (F-01) se comprobó buscando el término en `angular.json`: 0 coincidencias.
- Los errores de recolección de pytest (B-02) son la salida literal de ejecutar la suite.
- La ausencia de `takeUntilDestroyed`/`unsubscribe` (F-07) y de referencias a `ApiError` (F-12) se comprobó por búsqueda en todo `src/`.
- La identidad byte a byte de los bloques SCSS (F-13) se verificó comparando los archivos.

**No** se consideró mal olor el archivo `backend/.env`: contiene únicamente valores de plantilla (`usuario`, `nombre_base_datos`), está listado en `.gitignore` y no está bajo control de versiones. La gestión de credenciales es correcta.
