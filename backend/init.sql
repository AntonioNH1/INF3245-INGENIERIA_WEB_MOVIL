

CREATE TABLE IF NOT EXISTS Usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Canchas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_deporte VARCHAR(50) NOT NULL,
    precio_hora INTEGER NOT NULL,
    disponible BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    cancha_id INTEGER NOT NULL,
    fecha_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(40) DEFAULT 'confirmada',
    motivo_cancelacion TEXT,
    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES Usuarios (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cancha
        FOREIGN KEY (cancha_id)
        REFERENCES Canchas (id)
        ON DELETE CASCADE
);

-- Actualizar instalaciones que ya tienen las tablas creadas
ALTER TABLE Reservas
ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT;

ALTER TABLE Reservas
ALTER COLUMN estado TYPE VARCHAR(40);

-- Insertar Canchas de prueba
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible) VALUES
('Cancha 1 Sintética', 'Fútbol 7', 15000, true),
('Cancha Central', 'Tenis', 10000, true),
('Cancha Cristal', 'Pádel', 12000, true);

-- Insertar Usuario Admin de prueba y Usuario de prueba
-- Contraseña en texto plano para ambas cuentas: 123456
INSERT INTO Usuarios (nombre, rut, email, telefono, password, rol) VALUES
('Admin General', '33333333-3', 'admin@faltauno.cl', '+56912345688', '$2b$10$Lm0tgs1Wl9cR6F0zM6klUuw8vl.Iy1Mb9ysSb0LY7lYeFOAXatXKu', 'admin'),
('Jugador Estrella', '22222222-2', 'jugador@faltauno.cl', '+56987654321', '$2b$10$VDvgIIzll7mJKmukSTgrzOPifUWP8prjR.nEBnyZgumWyd80Yafem', 'cliente');


-- Insertar 

-- Fútbol 7 (4 canchas)
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Cancha ' || i || ' - Fútbol 7', 'Fútbol 7', 25000, TRUE FROM generate_series(1, 4) AS i;

-- Fútbol 11 (1 cancha)
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
VALUES ('Estadio Principal', 'Fútbol 11', 40000, TRUE);

-- Ping Pong (10 mesas)
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Mesa ' || i || ' - Ping Pong', 'Ping Pong', 5000, TRUE FROM generate_series(1, 10) AS i;

-- Básquetbol (4 canchas)
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Cancha ' || i || ' - Básquetbol', 'Básquetbol', 18000, TRUE FROM generate_series(1, 4) AS i;

-- Voleibol (4 canchas)
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Cancha ' || i || ' - Voleibol', 'Voleibol', 12000, TRUE FROM generate_series(1, 4) AS i;

-- Pádel (6 pistas)
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Pista ' || i || ' - Pádel', 'Pádel', 15000, TRUE FROM generate_series(1, 6) AS i;

-- Tenis (3 courts)
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Court ' || i || ' - Tenis', 'Tenis', 12000, TRUE FROM generate_series(1, 3) AS i;

-- Simular unas cuantas reservas aleatorias en los próximos 15 días (solo 15% de ocupación)
WITH dias AS (
    SELECT CURRENT_DATE + d AS fecha_res FROM generate_series(0, 15) AS d
),
turnos AS (
    SELECT 
        LPAD(h::text, 2, '0') || ':00' AS h_inicio,
        LPAD((h+1)::text, 2, '0') || ':00' AS h_fin
    FROM generate_series(16, 22) AS h
),
simulacion AS (
    SELECT 
        c.id AS cancha_id,
        d.fecha_res,
        t.h_inicio::time AS hora_in,
        t.h_fin::time AS hora_out,
        CASE 
            WHEN random() > 0.5 THEN 'Confirmada'
            WHEN random() > 0.2 THEN 'Cancelada'
            ELSE 'cancelacion_solicitada'
        END AS estado_reserva
    FROM Canchas c
    CROSS JOIN dias d
    CROSS JOIN turnos t
    WHERE random() > 0.85
)
INSERT INTO Reservas (usuario_id, cancha_id, fecha_reserva, hora_inicio, hora_fin, estado, motivo_cancelacion)
SELECT 
    (SELECT MIN(id) FROM Usuarios),
    cancha_id,
    fecha_res,
    hora_in,
    hora_out,
    estado_reserva,
    CASE WHEN estado_reserva = 'cancelacion_solicitada' THEN 'Cambio de planes' ELSE NULL END
FROM simulacion;

