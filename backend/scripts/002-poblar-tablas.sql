-- ============================================
-- POBLADO DE DATOS DE PRUEBA
-- ============================================

-- Roles
INSERT INTO rol (nombre, descripcion) VALUES
    ('ADMINISTRADOR', 'Gestiona canchas y reservas'),
    ('JUGADOR', 'Reserva canchas y deja calificaciones')
ON CONFLICT (nombre) DO NOTHING;

-- Usuarios
-- NOTA: el password_hash de ejemplo NO es real.
INSERT INTO usuario (nombre, correo, password_hash, telefono, rol_id) VALUES
    ('Ana Perez',   'admin@gmail.com',  'hash_admin',   '0999111222', 1),
    ('Luis Gomez',  'jugador@gmail.com',    'hash_jugador', '0999333444', 2),
    ('Juan Perez',   'admin2@gmail.com',  'hash_admin',   '0998840301', 1)
ON CONFLICT (correo) DO NOTHING;

-- Canchas (administradas por Ana, usuario id 1 - Admin)
-- Canchas (administradas por Juan, usuario id 3 - Admin)
INSERT INTO cancha (nombre, tipo, precio_hora, hora_apertura, hora_cierre, administrador_id) VALUES
    ('Cancha El Estadio',    'futbol5', 25.00, '08:00', '22:00', 1),
    ('Cancha La Bombonera',  'futbol7', 30.00, '09:00', '23:00', 1),
    ('Cancha Maracana',      'futbol11',45.00, '07:00', '21:00', 1),
    ('Cancha Isla Marchena',  'futbol7', 30.00, '09:00', '23:00', 3),
    ('Cancha Isla Galápagos',      'futbol11',45.00, '07:00', '21:00', 3);

-- Horarios de ejemplo para la primera cancha
INSERT INTO horario (cancha_id, fecha, hora_inicio, hora_fin, estado) VALUES
    (1, '2026-01-25', '08:00', '09:00', 'LIBRE'),
    (1, '2026-01-25', '09:00', '10:00', 'LIBRE'),
    (1, '2026-01-25', '10:00', '11:00', 'OCUPADO');

INSERT INTO reserva (usuario_id, cancha_id, monto_total, estado)
VALUES (1, 1, 25.00, 'CONFIRMADA');


-- ============================================
-- VERIFICACION
-- Ejecuta estas consultas para confirmar
-- que todo se creo y poblo correctamente.
-- ============================================
SELECT 'roles' AS tabla, COUNT(*) AS total FROM rol
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuario
UNION ALL SELECT 'canchas', COUNT(*) FROM cancha
UNION ALL SELECT 'horarios', COUNT(*) FROM horario;

-- Ver las canchas creadas
SELECT id, nombre, tipo, precio_hora, activa FROM cancha;

-- Ver las canchas creadas por admin
SELECT id, nombre, tipo, precio_hora, activa
FROM cancha
WHERE administrador_id = 3
  AND activa = true;