-- 1. Limpiar la base de datos antes de crear (Garantiza que siempre parta desde cero)
DROP TABLE IF EXISTS Reservas, MetodosPago, Canchas, Usuarios CASCADE;

-- 2. Creación de Tablas
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

CREATE TABLE IF NOT EXISTS MetodosPago (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    marca VARCHAR(30) NOT NULL,
    ultimos_cuatro VARCHAR(4) NOT NULL,
    titular VARCHAR(100) NOT NULL,
    vencimiento VARCHAR(5) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_metodos_pago_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES Usuarios (id)
        ON DELETE CASCADE
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

-- 3. Inserción de Usuarios de Prueba (Contraseña: 123456)
INSERT INTO Usuarios (nombre, rut, email, telefono, password, rol) VALUES
('Admin General', '33333333-3', 'admin@faltauno.cl', '+56912345688', '$2b$10$Lm0tgs1Wl9cR6F0zM6klUuw8vl.Iy1Mb9ysSb0LY7lYeFOAXatXKu', 'admin'),
('Jugador Estrella', '22222222-2', 'jugador@faltauno.cl', '+56987654321', '$2b$10$VDvgIIzll7mJKmukSTgrzOPifUWP8prjR.nEBnyZgumWyd80Yafem', 'cliente');

-- 4. Inserción de Canchas
INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible) VALUES
('Cancha 1 Sintética', 'Fútbol 7', 15000, true),
('Cancha Central', 'Tenis', 10000, true),
('Cancha Cristal', 'Pádel', 12000, true);

INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Cancha ' || i || ' - Fútbol 7', 'Fútbol 7', 25000, TRUE FROM generate_series(1, 4) AS i;

INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
VALUES ('Estadio Principal', 'Fútbol 11', 40000, TRUE);

INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Mesa ' || i || ' - Ping Pong', 'Ping Pong', 5000, TRUE FROM generate_series(1, 10) AS i;

INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Cancha ' || i || ' - Básquetbol', 'Básquetbol', 18000, TRUE FROM generate_series(1, 4) AS i;

INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Cancha ' || i || ' - Voleibol', 'Voleibol', 12000, TRUE FROM generate_series(1, 4) AS i;

INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Pista ' || i || ' - Pádel', 'Pádel', 15000, TRUE FROM generate_series(1, 6) AS i;

INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
SELECT 'Court ' || i || ' - Tenis', 'Tenis', 12000, TRUE FROM generate_series(1, 3) AS i;