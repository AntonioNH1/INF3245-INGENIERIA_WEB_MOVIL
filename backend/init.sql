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