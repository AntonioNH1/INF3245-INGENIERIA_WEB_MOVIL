const ZONA_HORARIA = 'America/Santiago';
const DIAS_MAXIMOS_ANTICIPACION = 30;
const HORA_APERTURA = 8 * 60;  // 08:00
const HORA_CIERRE = 23 * 60;   // 23:00
const DURACION_RESERVA = 60;   // Una hora

const ESTADOS_QUE_OCUPAN_HORARIO = ['confirmada', 'cancelacion_solicitada', 'cancelacion_rechazada'];

const obtenerFechaHoraChile = () => {
    const partes = new Intl.DateTimeFormat('en-GB', {
        timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const obtener = (tipo) => partes.find(parte => parte.type === tipo)?.value || '00';
    return {
        fecha: `${obtener('year')}-${obtener('month')}-${obtener('day')}`,
        minutos: Number(obtener('hour')) * 60 + Number(obtener('minute'))
    };
};

const esFechaValida = (fecha) => {
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));
    return (fechaUTC.getUTCFullYear() === anio && fechaUTC.getUTCMonth() === mes - 1 && fechaUTC.getUTCDate() === dia);
};

const calcularDiasEntreFechas = (fechaInicial, fechaFinal) => {
    const [anio1, mes1, dia1] = fechaInicial.split('-').map(Number);
    const [anio2, mes2, dia2] = fechaFinal.split('-').map(Number);
    return (Date.UTC(anio2, mes2 - 1, dia2) - Date.UTC(anio1, mes1 - 1, dia1)) / 86400000;
};

const esHoraValida = (hora) => typeof hora === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora);
const horaAMinutos = (hora) => { const [horas, minutos] = hora.split(':').map(Number); return horas * 60 + minutos; };

const validarHorarioReserva = (horaInicio, horaFin) => {
    if (!esHoraValida(horaInicio) || !esHoraValida(horaFin)) return 'El horario debe tener el formato HH:MM.';
    const minutosInicio = horaAMinutos(horaInicio);
    const minutosFin = horaAMinutos(horaFin);
    if (minutosFin <= minutosInicio) return 'La hora de término debe ser posterior a la hora de inicio.';
    if (minutosInicio < HORA_APERTURA || minutosFin > HORA_CIERRE) return 'El horario de funcionamiento es de 08:00 a 23:00.';
    if (minutosFin - minutosInicio !== DURACION_RESERVA) return 'Las reservas deben realizarse en bloques de una hora.';
    if (minutosInicio % 60 !== 0) return 'Los turnos deben comenzar en una hora exacta.';
    return null;
};

const validarFechaYHoraReserva = (fechaReserva, horaInicio) => {
    if (!esFechaValida(fechaReserva)) return 'La fecha de la reserva no es válida.';
    const ahoraChile = obtenerFechaHoraChile();
    const diasAnticipacion = calcularDiasEntreFechas(ahoraChile.fecha, fechaReserva);
    if (diasAnticipacion < 0) return 'No puedes reservar en fechas pasadas.';
    if (diasAnticipacion > DIAS_MAXIMOS_ANTICIPACION) return 'Solo puedes reservar con un máximo de 30 días de anticipación.';
    if (diasAnticipacion === 0 && horaAMinutos(horaInicio) <= ahoraChile.minutos) return 'El horario seleccionado ya comenzó o ya pasó.';
    return null;
};

module.exports = { ESTADOS_QUE_OCUPAN_HORARIO, esFechaValida, esHoraValida, validarHorarioReserva, validarFechaYHoraReserva };