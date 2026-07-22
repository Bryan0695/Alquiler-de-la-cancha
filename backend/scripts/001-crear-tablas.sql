-- ============================================
-- SCRIPT DE CREACION 
-- Sistema de Reservas de Canchas
-- Ejecutar en pgAdmin (Query Tool)
-- Basado en el diagrama de clases del proyecto
-- ============================================


-- ============================================
-- LIMPIEZA (opcional)
-- ============================================
-- DROP TABLE IF EXISTS calificacion CASCADE;
-- DROP TABLE IF EXISTS pago CASCADE;
-- DROP TABLE IF EXISTS reserva CASCADE;
-- DROP TABLE IF EXISTS horario CASCADE;
-- DROP TABLE IF EXISTS cancha CASCADE;
-- DROP TABLE IF EXISTS usuario CASCADE;
-- DROP TABLE IF EXISTS rol CASCADE;


-- ============================================
-- TABLA: ROL
-- ============================================
CREATE TABLE IF NOT EXISTS rol (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(200)
);


-- ============================================
-- TABLA: USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS usuario (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    correo         VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    telefono       VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    activo         BOOLEAN DEFAULT TRUE,
    rol_id         INTEGER REFERENCES rol(id)
);


-- ============================================
-- TABLA: CANCHA
-- ============================================
CREATE TABLE IF NOT EXISTS cancha (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    tipo                  VARCHAR(20),
    precio_hora           NUMERIC(10,2),
    hora_apertura         TIME,
    hora_cierre           TIME,
    promedio_calificacion NUMERIC(3,2) DEFAULT 0,
    activa                BOOLEAN DEFAULT TRUE,
    administrador_id      INTEGER REFERENCES usuario(id)
);


-- ============================================
-- TABLA: HORARIO
-- Cada cancha tiene varias franjas horarias.
-- ============================================
CREATE TABLE IF NOT EXISTS horario (
    id          SERIAL PRIMARY KEY,
    cancha_id   INTEGER NOT NULL REFERENCES cancha(id),
    fecha       DATE,
    hora_inicio TIME,
    hora_fin    TIME,
    estado      VARCHAR(10) DEFAULT 'LIBRE'  -- LIBRE, OCUPADO
);


-- ============================================
-- TABLA: RESERVA
-- ============================================
CREATE TABLE IF NOT EXISTS reserva (
    id             SERIAL PRIMARY KEY,
    usuario_id     INTEGER NOT NULL REFERENCES usuario(id),
    cancha_id      INTEGER NOT NULL REFERENCES cancha(id),
    horario_id     INTEGER REFERENCES horario(id),
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    monto_total    NUMERIC(10,2),
    estado         VARCHAR(15) DEFAULT 'PENDIENTE'  -- PENDIENTE, CONFIRMADA, COMPLETADA
);


-- ============================================
-- TABLA: PAGO
-- Pago simulado (sin pasarela externa).
-- ============================================
CREATE TABLE IF NOT EXISTS pago (
    id         SERIAL PRIMARY KEY,
    reserva_id INTEGER NOT NULL REFERENCES reserva(id),
    monto      NUMERIC(10,2),
    fecha_pago TIMESTAMP DEFAULT NOW(),
    estado     VARCHAR(10) DEFAULT 'PENDIENTE',  -- PENDIENTE, PAGADO, RECHAZADO
    metodo     VARCHAR(30)
);


-- ============================================
-- TABLA: CALIFICACION
-- Calificación de la cancha
-- ============================================
CREATE TABLE IF NOT EXISTS calificacion (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id),
    cancha_id  INTEGER NOT NULL REFERENCES cancha(id),
    reserva_id INTEGER REFERENCES reserva(id),
    puntaje    INTEGER CHECK (puntaje BETWEEN 1 AND 5),
    comentario VARCHAR(500),
    fecha      TIMESTAMP DEFAULT NOW()
);