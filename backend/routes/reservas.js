
const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

/* =========================================================
   CONFIGURACIÓN DE RESERVAS
   ========================================================= */

const ZONA_HORARIA = 'America/Santiago';
const DIAS_MAXIMOS_ANTICIPACION = 30;
const HORA_APERTURA = 8 * 60;  // 08:00
const HORA_CIERRE = 23 * 60;   // 23:00
const DURACION_RESERVA = 60;   // Una hora

// Estos estados mantienen ocupado el horario.
// Solo el estado "cancelada" libera la cancha.
const ESTADOS_QUE_OCUPAN_HORARIO = [
    'confirmada',
    'cancelacion_solicitada',
    'cancelacion_rechazada'
];

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

// Obtener fecha y hora actual de Chile.
const obtenerFechaHoraChile = () => {
    const partes = new Intl.DateTimeFormat('en-GB', {
        timeZone: ZONA_HORARIA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(new Date());

    const obtener = (tipo) =>
        partes.find(parte => parte.type === tipo)?.value || '00';

    return {
        fecha: `${obtener('year')}-${obtener('month')}-${obtener('day')}`,
        minutos:
            Number(obtener('hour')) * 60 +
            Number(obtener('minute'))
    };
};

// Validar que una fecha tenga formato YYYY-MM-DD
// y que realmente exista en el calendario.
const esFechaValida = (fecha) => {
    if (
        typeof fecha !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
        return false;
    }

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

    return (
        fechaUTC.getUTCFullYear() === anio &&
        fechaUTC.getUTCMonth() === mes - 1 &&
        fechaUTC.getUTCDate() === dia
    );
};

// Calcular días calendario entre dos fechas sin depender
// de la zona horaria del servidor.
const calcularDiasEntreFechas = (fechaInicial, fechaFinal) => {
    const [anio1, mes1, dia1] = fechaInicial.split('-').map(Number);
    const [anio2, mes2, dia2] = fechaFinal.split('-').map(Number);

    const inicio = Date.UTC(anio1, mes1 - 1, dia1);
    const final = Date.UTC(anio2, mes2 - 1, dia2);

    return (final - inicio) / 86400000;
};

// Validar formato HH:MM.
const esHoraValida = (hora) => {
    return (
        typeof hora === 'string' &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)
    );
};

// Convertir una hora HH:MM a minutos desde medianoche.
const horaAMinutos = (hora) => {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
};

// Validar horario de apertura, duración y hora exacta de inicio.
const validarHorarioReserva = (horaInicio, horaFin) => {
    if (
        !esHoraValida(horaInicio) ||
        !esHoraValida(horaFin)
    ) {
        return 'El horario debe tener el formato HH:MM.';
    }

    const minutosInicio = horaAMinutos(horaInicio);
    const minutosFin = horaAMinutos(horaFin);

    if (minutosFin <= minutosInicio) {
        return 'La hora de término debe ser posterior a la hora de inicio.';
    }

    if (
        minutosInicio < HORA_APERTURA ||
        minutosFin > HORA_CIERRE
    ) {
        return 'El horario de funcionamiento es de 08:00 a 23:00.';
    }

    if (minutosFin - minutosInicio !== DURACION_RESERVA) {
        return 'Las reservas deben realizarse en bloques de una hora.';
    }

    if (minutosInicio % 60 !== 0) {
        return 'Los turnos deben comenzar en una hora exacta.';
    }

    return null;
};

// Validar fecha y hora de inicio respecto de la hora oficial de Chile.
const validarFechaYHoraReserva = (fechaReserva, horaInicio) => {
    if (!esFechaValida(fechaReserva)) {
        return 'La fecha de la reserva no es válida.';
    }

    const ahoraChile = obtenerFechaHoraChile();

    const diasAnticipacion = calcularDiasEntreFechas(
        ahoraChile.fecha,
        fechaReserva
    );

    if (diasAnticipacion < 0) {
        return 'No puedes reservar en fechas pasadas.';
    }

    if (diasAnticipacion > DIAS_MAXIMOS_ANTICIPACION) {
        return 'Solo puedes reservar con un máximo de 30 días de anticipación.';
    }

    const minutosInicio = horaAMinutos(horaInicio);

    if (
        diasAnticipacion === 0 &&
        minutosInicio <= ahoraChile.minutos
    ) {
        return 'El horario seleccionado ya comenzó o ya pasó. Selecciona otro horario.';
    }

    return null;
};

/* =========================================================
   POST: CREAR UNA NUEVA RESERVA
   Protegida mediante JWT.
   - Usuario obtenido desde el token.
   - Cancha existente y habilitada.
   - Fecha y horario validados en el servidor.
   - Evita reservas superpuestas.
   - Bloquea la fila de la cancha durante la operación
     para evitar reservas simultáneas.
   ========================================================= */

router.post('/', verificarToken, async (req, res) => {
    const usuarioId = Number(req.usuario?.id);
    const canchaId = Number(req.body?.cancha_id);
    const fechaReserva = req.body?.fecha_reserva;
    const horaInicio = req.body?.hora_inicio;
    const horaFin = req.body?.hora_fin;

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(401).json({
            mensaje: 'No se pudo identificar al usuario de la sesión.'
        });
    }

    if (!Number.isInteger(canchaId) || canchaId <= 0) {
        return res.status(400).json({
            mensaje: 'El identificador de la cancha no es válido.'
        });
    }

    const errorHorario = validarHorarioReserva(
        horaInicio,
        horaFin
    );

    if (errorHorario) {
        return res.status(400).json({
            mensaje: errorHorario
        });
    }

    const errorFecha = validarFechaYHoraReserva(
        fechaReserva,
        horaInicio
    );

    if (errorFecha) {
        return res.status(400).json({
            mensaje: errorFecha
        });
    }

    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        /*
         * BLOQUEAR LA CANCHA
         *
         * Las solicitudes simultáneas para la misma cancha
         * se procesan una después de otra.
         */
        const canchaResultado = await client.query(
            `SELECT id, disponible
             FROM Canchas
             WHERE id = $1
             FOR UPDATE`,
            [canchaId]
        );

        if (canchaResultado.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                mensaje: 'La cancha seleccionada no existe.'
            });
        }

        if (canchaResultado.rows[0].disponible !== true) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(409).json({
                mensaje: 'Esta cancha está deshabilitada y no se puede reservar.'
            });
        }

        /*
         * COMPROBAR RESERVAS EXISTENTES
         *
         * Existe conflicto si una reserva ya registrada
         * comienza antes del término solicitado y termina
         * después del inicio solicitado.
         *
         * Los límites contiguos no se consideran conflicto:
         * 18:00-19:00 y 19:00-20:00 pueden coexistir.
         */
        const conflicto = await client.query(
            `SELECT id
             FROM Reservas
             WHERE cancha_id = $1
               AND fecha_reserva = $2::date
               AND LOWER(TRIM(COALESCE(estado, ''))) = ANY($5::text[])
               AND hora_inicio < $4::time
               AND hora_fin > $3::time
             LIMIT 1`,
            [
                canchaId,
                fechaReserva,
                horaInicio,
                horaFin,
                ESTADOS_QUE_OCUPAN_HORARIO
            ]
        );

        if (conflicto.rows.length > 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(409).json({
                mensaje: 'Este horario ya está reservado. Selecciona otro horario.'
            });
        }

        // Registrar la reserva.
        const nuevaReserva = await client.query(
            `INSERT INTO Reservas
                (
                    usuario_id,
                    cancha_id,
                    fecha_reserva,
                    hora_inicio,
                    hora_fin
                )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                usuarioId,
                canchaId,
                fechaReserva,
                horaInicio,
                horaFin
            ]
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return res.status(201).json({
            mensaje: 'Reserva confirmada exitosamente.',
            reserva: nuevaReserva.rows[0]
        });

    } catch (error) {
        if (client && transaccionIniciada) {
            try {
                await client.query('ROLLBACK');
            } catch (errorRollback) {
                console.error(
                    'Error al deshacer la transacción:',
                    errorRollback
                );
            }
        }

        console.error('Error al procesar la reserva:', error);

        return res.status(500).json({
            mensaje: 'Error al procesar la reserva.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});

/* =========================================================
   GET: CONSULTAR HORARIOS OCUPADOS DE UNA FECHA
   Ruta pública. No devuelve datos personales.

   Ejemplo:
   /api/reservas/disponibilidad?fecha=2026-11-01
   ========================================================= */

router.get('/disponibilidad', async (req, res) => {
    const fecha = req.query.fecha;

    if (!esFechaValida(fecha)) {
        return res.status(400).json({
            mensaje: 'Debes indicar una fecha válida en formato YYYY-MM-DD.'
        });
    }

    try {
        const resultado = await pool.query(
            `SELECT
                cancha_id,
                TO_CHAR(fecha_reserva, 'YYYY-MM-DD') AS fecha_reserva,
                TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
                TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin
             FROM Reservas
             WHERE fecha_reserva = $1::date
               AND LOWER(TRIM(COALESCE(estado, ''))) = ANY($2::text[])
             ORDER BY cancha_id, hora_inicio`,
            [
                fecha,
                ESTADOS_QUE_OCUPAN_HORARIO
            ]
        );

        return res.json(resultado.rows);

    } catch (error) {
        console.error(
            'Error al consultar disponibilidad:',
            error
        );

        return res.status(500).json({
            mensaje: 'Error al consultar los horarios ocupados.'
        });
    }
});

/* =========================================================
   GET: OBTENER RESERVAS DEL USUARIO LOGUEADO
   ========================================================= */

router.get('/mis-reservas', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const misReservas = await pool.query(
            `SELECT
                r.id,
                r.fecha_reserva,
                r.hora_inicio,
                r.hora_fin,
                r.estado,
                r.motivo_cancelacion,
                c.nombre AS cancha_nombre,
                c.tipo_deporte,
                c.precio_hora
             FROM Reservas r
             INNER JOIN Canchas c
                 ON r.cancha_id = c.id
             WHERE r.usuario_id = $1
             ORDER BY
                r.fecha_reserva DESC,
                r.hora_inicio DESC`,
            [usuarioId]
        );

        return res.json(misReservas.rows);

    } catch (error) {
        console.error(
            'Error al obtener mis reservas:',
            error
        );

        return res.status(500).json({
            mensaje: 'Error al obtener el historial de reservas.'
        });
    }
});

/* =========================================================
   GET: OBTENER TODAS LAS RESERVAS
   Solo administrador.
   ========================================================= */

router.get('/', verificarToken, async (req, res) => {
    const rol = String(req.usuario?.rol || '')
        .trim()
        .toLowerCase();

    if (!['admin', 'administrador'].includes(rol)) {
        return res.status(403).json({
            mensaje: 'No tienes permisos para consultar todas las reservas.'
        });
    }

    try {
        const resultado = await pool.query(`
            SELECT
                r.id,
                r.fecha_reserva,
                r.hora_inicio,
                r.hora_fin,
                r.estado,
                r.motivo_cancelacion,
                u.nombre AS usuario_nombre,
                u.email AS usuario_email,
                c.nombre AS cancha_nombre,
                c.tipo_deporte
            FROM Reservas r
            INNER JOIN Usuarios u
                ON r.usuario_id = u.id
            INNER JOIN Canchas c
                ON r.cancha_id = c.id
            ORDER BY
                r.fecha_reserva DESC,
                r.hora_inicio ASC
        `);

        return res.json(resultado.rows);

    } catch (error) {
        console.error(
            'Error al obtener todas las reservas:',
            error
        );

        return res.status(500).json({
            mensaje: 'Error al obtener las reservas.'
        });
    }
});

/* =========================================================
   PATCH: CANCELAR UNA RESERVA
   Solo administrador.
   ========================================================= */

router.patch('/:id/cancelar', verificarToken, async (req, res) => {
    const rol = String(req.usuario?.rol || '')
        .trim()
        .toLowerCase();

    if (!['admin', 'administrador'].includes(rol)) {
        return res.status(403).json({
            mensaje: 'No tienes permisos para cancelar reservas.'
        });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El identificador de la reserva no es válido.'
        });
    }

    try {
        const resultado = await pool.query(
            `UPDATE Reservas
             SET estado = 'cancelada'
             WHERE id = $1
             RETURNING id, estado`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'No se encontró la reserva.'
            });
        }

        return res.json({
            mensaje: 'Reserva cancelada correctamente.',
            reserva: resultado.rows[0]
        });

    } catch (error) {
        console.error(
            'Error al cancelar la reserva:',
            error
        );

        return res.status(500).json({
            mensaje: 'Error al cancelar la reserva.'
        });
    }
});

/* =========================================================
   PATCH: EL CLIENTE SOLICITA CANCELAR SU PROPIA RESERVA
   ========================================================= */

router.patch(
    '/mis-reservas/:id/solicitar-cancelacion',
    verificarToken,
    async (req, res) => {
        const id = Number(req.params.id);
        const usuarioId = req.usuario.id;
        const motivo = req.body?.motivo;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador de la reserva no es válido.'
            });
        }

        if (
            typeof motivo !== 'string' ||
            !motivo.trim()
        ) {
            return res.status(400).json({
                mensaje: 'Debes indicar el motivo de la cancelación.'
            });
        }

        try {
            const resultado = await pool.query(
                `UPDATE Reservas
                 SET
                    estado = 'cancelacion_solicitada',
                    motivo_cancelacion = $1
                 WHERE id = $2
                   AND usuario_id = $3
                   AND LOWER(TRIM(COALESCE(estado, ''))) = 'confirmada'
                 RETURNING
                    id,
                    estado,
                    motivo_cancelacion`,
                [
                    motivo.trim(),
                    id,
                    usuarioId
                ]
            );

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    mensaje: 'No se encontró una reserva confirmada que puedas cancelar.'
                });
            }

            return res.json({
                mensaje: 'Solicitud de cancelación enviada correctamente.',
                reserva: resultado.rows[0]
            });

        } catch (error) {
            console.error(
                'Error al solicitar cancelación:',
                error
            );

            return res.status(500).json({
                mensaje: 'Error al registrar la solicitud de cancelación.'
            });
        }
    }
);

/* =========================================================
   PATCH: APROBAR O RECHAZAR SOLICITUD DE CANCELACIÓN
   Solo administrador.
   ========================================================= */

router.patch(
    '/:id/resolver-cancelacion',
    verificarToken,
    async (req, res) => {
        const rol = String(req.usuario?.rol || '')
            .trim()
            .toLowerCase();

        if (!['admin', 'administrador'].includes(rol)) {
            return res.status(403).json({
                mensaje: 'No tienes permisos para resolver solicitudes.'
            });
        }

        const id = Number(req.params.id);
        const decision = String(req.body?.decision || '')
            .trim()
            .toLowerCase();

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador de la reserva no es válido.'
            });
        }

        if (!['aprobar', 'rechazar'].includes(decision)) {
            return res.status(400).json({
                mensaje: 'La decisión debe ser aprobar o rechazar.'
            });
        }

        const nuevoEstado = decision === 'aprobar'
            ? 'cancelada'
            : 'cancelacion_rechazada';

        try {
            const resultado = await pool.query(
                `UPDATE Reservas
                 SET estado = $1
                 WHERE id = $2
                   AND LOWER(TRIM(COALESCE(estado, ''))) = 'cancelacion_solicitada'
                 RETURNING
                    id,
                    estado,
                    motivo_cancelacion`,
                [
                    nuevoEstado,
                    id
                ]
            );

            if (resultado.rows.length === 0) {
                return res.status(409).json({
                    mensaje: 'La reserva no existe o ya no tiene una solicitud pendiente.'
                });
            }

            return res.json({
                mensaje: decision === 'aprobar'
                    ? 'Cancelación aprobada correctamente.'
                    : 'Solicitud de cancelación rechazada.',
                reserva: resultado.rows[0]
            });

        } catch (error) {
            console.error(
                'Error al resolver la solicitud:',
                error
            );

            return res.status(500).json({
                mensaje: 'Error al resolver la solicitud de cancelación.'
            });
        }
    }
);

module.exports = router;
