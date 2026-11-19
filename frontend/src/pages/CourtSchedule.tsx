
// --- IMPORTACIONES ---
import React, { useEffect, useRef, useState } from 'react';

import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';

import {
  timeOutline,
  cashOutline,
  calendarOutline,
  arrowBackOutline,
  searchOutline,
  filterOutline,
  alertCircleOutline,
} from 'ionicons/icons';

import { useParams } from 'react-router-dom';
import './CourtSchedule.css';

// Direcciones del backend.
const API_CANCHAS = 'http://localhost:3000/api/v1/canchas';
const API_RESERVAS = 'http://localhost:3000/api/v1/reservas';

// --- CONFIGURACIÓN DE MASCOTAS ---
const SPORT_MASCOTS: Record<string, string> = {
  'futbol-7': '/Imagen Messi FaltaUno.png',
  'futbol-11': '/Imagen Cristiano FaltaUno.png',
  padel: '/Jugador Padel FaltaUno.png',
  tenis: '/Jugador Tenis FaltaUno.png',
  bask: '/LebronJames FaltaUno.png',
  voley: '/Jugador Voleybol FaltaUno.png',
  pingpong: '/Jugador PingPong FaltaUno.png',
};

// --- NOMBRES DE LOS DEPORTES ---
const SPORT_NAMES: Record<string, string> = {
  'futbol-7': 'Fútbol 7',
  'futbol-11': 'Fútbol 11',
  padel: 'Pádel',
  tenis: 'Tenis',
  bask: 'Básquetbol',
  voley: 'Voleibol',
  pingpong: 'Mesas de Ping Pong',
};

// --- HORARIOS DISPONIBLES ---
const ALL_TIME_SLOTS = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
  '21:00 - 22:00',
  '22:00 - 23:00',
];

// --- TIPOS ---
interface CourtResult {
  uniqueKey: string;
  canchaId: number;
  nombre: string;
  horario: string;
  precio: string;
  estado: 'disponible' | 'ocupada';
}

interface CanchaBackend {
  id: number;
  nombre: string;
  tipo_deporte: string;
  precio_hora: number;
  disponible: boolean;
}

interface CanchaApi {
  id: number | string;
  nombre?: string | null;
  tipo_deporte?: string | null;
  precio_hora: number | string;
  disponible: boolean | string;
}

interface ReservaOcupada {
  cancha_id: number | string;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
}

// =====================================================
// FECHA Y HORA OFICIAL DE CHILE
// =====================================================
const obtenerFechaHoraChile = () => {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value || '00';

  return {
    fecha: `${obtener('year')}-${obtener('month')}-${obtener('day')}`,
    minutos: Number(obtener('hour')) * 60 + Number(obtener('minute')),
  };
};

// Sumar días sin depender de la zona horaria del navegador.
const sumarDiasAFecha = (fecha: string, dias: number): string => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));
  fechaUTC.setUTCDate(fechaUTC.getUTCDate() + dias);

  const nuevoAnio = fechaUTC.getUTCFullYear();
  const nuevoMes = String(fechaUTC.getUTCMonth() + 1).padStart(2, '0');
  const nuevoDia = String(fechaUTC.getUTCDate()).padStart(2, '0');

  return `${nuevoAnio}-${nuevoMes}-${nuevoDia}`;
};

// --- NORMALIZAR NOMBRES DE DEPORTES ---
const obtenerClaveDeporte = (tipo: string): string => {
  const texto = String(tipo || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const equivalencias: Record<string, string> = {
    futbol7: 'futbol-7',
    futbol11: 'futbol-11',
    padel: 'padel',
    tenis: 'tenis',
    basquetbol: 'bask',
    basquet: 'bask',
    bask: 'bask',
    basketball: 'bask',
    voleibol: 'voley',
    voleybol: 'voley',
    voley: 'voley',
    mesasdepingpong: 'pingpong',
    pingpong: 'pingpong',
  };

  return equivalencias[texto] || texto;
};

// Convertir HH:MM a minutos para comparar intervalos.
const horaAMinutos = (hora: string): number => {
  const [horas, minutos] = hora.slice(0, 5).split(':').map(Number);
  return horas * 60 + minutos;
};



// =====================================================
// GENERAR OPCIONES CON DISPONIBILIDAD REAL
// =====================================================
const obtenerOpcionesDeReserva = (
  canchas: CanchaBackend[],
  deporte: string,
  fecha: string,
  horaFiltro: string,
  reservas: ReservaOcupada[]
): CourtResult[] => {
  const claveBuscada = obtenerClaveDeporte(deporte);

  const canchasDeporte = canchas.filter(
    (cancha) =>
      obtenerClaveDeporte(cancha.tipo_deporte) === claveBuscada
  );

  const horariosOriginales =
    horaFiltro === 'TODOS'
      ? ALL_TIME_SLOTS
      : [horaFiltro];

  const ahoraChile = obtenerFechaHoraChile();

  // Para el día actual no se muestran turnos que ya comenzaron.
  const horariosAEvaluar = horariosOriginales.filter((slot) => {
    const horaInicio = slot.split(' - ')[0];
    const minutosInicio = horaAMinutos(horaInicio);

    return (
      fecha !== ahoraChile.fecha ||
      minutosInicio > ahoraChile.minutos
    );
  });

  const listaGenerada: CourtResult[] = [];

  canchasDeporte.forEach((cancha) => {
    horariosAEvaluar.forEach((slot) => {
      const [inicioSlot, finSlot] = slot.split(' - ');

      const inicioMinutos = horaAMinutos(inicioSlot);
      const finMinutos = horaAMinutos(finSlot);

      // Detectar reservas que se cruzan con el bloque consultado.
      const estaOcupada = reservas.some((reserva) => {
        const mismaCancha =
          Number(reserva.cancha_id) === cancha.id;

        const mismaFecha =
          reserva.fecha_reserva.slice(0, 10) === fecha;

        if (!mismaCancha || !mismaFecha) {
          return false;
        }

        const inicioReserva = horaAMinutos(reserva.hora_inicio);
        const finReserva = horaAMinutos(reserva.hora_fin);

        return (
          inicioReserva < finMinutos &&
          finReserva > inicioMinutos
        );
      });

      // Mantener el recargo nocturno de $3.000 desde las 19:00.
      const horaInicio = parseInt(inicioSlot.split(':')[0], 10);
      const precioBase = Number(cancha.precio_hora);

      const precioFinal =
        horaInicio >= 19
          ? precioBase + 3000
          : precioBase;

      listaGenerada.push({
        uniqueKey: `${cancha.id}-${slot}`,
        canchaId: cancha.id,
        nombre: cancha.nombre,
        horario: slot,
        precio: `$${precioFinal.toLocaleString('es-CL')}`,
        estado: estaOcupada ? 'ocupada' : 'disponible',
      });
    });
  });

  return listaGenerada;
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
const CourtSchedule: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();

  const fechaHoraInicial = obtenerFechaHoraChile();
  const minDateStr = fechaHoraInicial.fecha;
  const maxDateStr = sumarDiasAFecha(minDateStr, 30);

  // --- ESTADOS DEL BUSCADOR ---
  const [inputSport, setInputSport] = useState(id || 'futbol-7');
  const [inputFecha, setInputFecha] = useState(minDateStr);
  const [inputHora, setInputHora] = useState('18:00 - 19:00');
  const [dateError, setDateError] = useState('');

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Filtros que se están mostrando.
  const [appliedSport, setAppliedSport] = useState(id || 'futbol-7');
  const [appliedFecha, setAppliedFecha] = useState(minDateStr);
  const [appliedHora, setAppliedHora] = useState('18:00 - 19:00');

  // Canchas obtenidas desde PostgreSQL.
  const [canchasBD, setCanchasBD] = useState<CanchaBackend[]>([]);
  const [cargandoCanchas, setCargandoCanchas] = useState(true);
  const [errorCanchas, setErrorCanchas] = useState('');

  // Disponibilidad obtenida desde PostgreSQL.
  const [resultados, setResultados] = useState<CourtResult[]>([]);

  // Estados para la API de Feriados
  const [feriados, setFeriados] = useState<{ date: string; title: string }[]>([]);
  const [feriadoActual, setFeriadoActual] = useState<string | null>(null);

  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(true);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');

  // Estado para la API de Clima
  const [pronostico, setPronostico] = useState<{ tempMax: number; tempMin: number; codigo: number } | null>(null);

  // Fuerza una nueva consulta al volver a esta pantalla.
  const [versionActualizacion, setVersionActualizacion] = useState(0);

  // =====================================================
  // INTEGRACIÓN API EXTERNA: FERIADOS DE CHILE (EF 5)
  // =====================================================
  useEffect(() => {
    const cargarFeriados = async () => {
      try {
        const respuesta = await fetch('https://api.victorsanmartin.com/feriados/en.json');
        const datos = await respuesta.json();
        if (datos.status === 'success') {
          setFeriados(datos.data);
        }
      } catch (error) {
        console.error('Error al cargar la API de Feriados:', error);
      }
    };
    cargarFeriados();
  }, []);

// Verificar si la fecha seleccionada por el usuario es feriado
  useEffect(() => {
    if (!inputFecha || feriados.length === 0) {
      setFeriadoActual(null);
      return;
    }
    
    // inputFecha viene como "2026-12-08". Extraemos solo el mes y el día ("-12-08")
    const mesDiaSeleccionado = inputFecha.substring(4);
    
    // Buscamos un feriado de la API que coincida con ese mes y día, ignorando el año
    const feriado = feriados.find((f) => f.date.endsWith(mesDiaSeleccionado));
    
    setFeriadoActual(feriado ? feriado.title : null);
  }, [inputFecha, feriados]);

  // Actualizar canchas y reservas cada vez que se ingresa a la pantalla.
  useIonViewWillEnter(() => {
    setVersionActualizacion((version) => version + 1);
  });

  // --- ABRIR CALENDARIO ---
  const openCalendar = () => {
    try {
      if (
        dateInputRef.current &&
        'showPicker' in HTMLInputElement.prototype
      ) {
        dateInputRef.current.showPicker();
      }
    } catch (error) {
      console.error('No se pudo abrir el calendario:', error);
    }
  };

  // Si cambia la categoría de la URL, actualizar el deporte seleccionado.
  useEffect(() => {
    const deporteInicial = id || 'futbol-7';

    setInputSport(deporteInicial);
    setAppliedSport(deporteInicial);
  }, [id]);

// =====================================================
  // INTEGRACIÓN API EXTERNA: CLIMA (EF 5)
  // =====================================================
  useEffect(() => {
    const cargarClima = async () => {
      try {
        // Coordenadas aproximadas de Valparaíso / Casablanca
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=-33.0456&longitude=-71.6207&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=America%2FSantiago';
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        
        if (datos.daily && datos.daily.time) {
          // Buscamos si la fecha seleccionada está dentro del pronóstico (solo da 7 días)
          const indiceFecha = datos.daily.time.indexOf(inputFecha);
          
          if (indiceFecha !== -1) {
            setPronostico({
              tempMax: datos.daily.temperature_2m_max[indiceFecha],
              tempMin: datos.daily.temperature_2m_min[indiceFecha],
              codigo: datos.daily.weathercode[indiceFecha] // (0-3: Despejado, 45-48: Niebla, 50+: Lluvia)
            });
          } else {
            setPronostico(null); // Fecha muy lejana para tener pronóstico
          }
        }
      } catch (error) {
        console.error('Error al cargar el clima:', error);
      }
    };
    
    if (inputFecha) {
      cargarClima();
    }
  }, [inputFecha]);


  // =====================================================
  // CARGAR CANCHAS HABILITADAS DESDE POSTGRESQL
  // =====================================================
  useEffect(() => {
    let activo = true;

    const cargarCanchas = async () => {
      try {
        setCargandoCanchas(true);
        setErrorCanchas('');

        const respuesta = await fetch(API_CANCHAS);
        const datos: unknown = await respuesta.json();

        if (!respuesta.ok) {
          const mensaje =
            typeof datos === 'object' &&
              datos !== null &&
              'mensaje' in datos
              ? String((datos as { mensaje: unknown }).mensaje)
              : 'No se pudieron cargar las canchas.';

          throw new Error(mensaje);
        }

        if (!Array.isArray(datos)) {
          throw new Error('La respuesta de canchas no es válida.');
        }

        const canchasNormalizadas: CanchaBackend[] =
          (datos as CanchaApi[]).map((cancha) => ({
            id: Number(cancha.id),
            nombre: String(cancha.nombre || ''),
            tipo_deporte: String(cancha.tipo_deporte || ''),
            precio_hora: Number(cancha.precio_hora),
            disponible:
              cancha.disponible === true ||
              String(cancha.disponible).toLowerCase() === 'true',
          }));

        if (activo) {
          setCanchasBD(
            canchasNormalizadas.filter(
              (cancha) =>
                cancha.disponible &&
                Number.isInteger(cancha.id) &&
                cancha.id > 0 &&
                cancha.nombre.trim().length > 0 &&
                Number.isFinite(cancha.precio_hora) &&
                cancha.precio_hora > 0
            )
          );
        }
      } catch (error) {
        console.error('Error al cargar las canchas:', error);

        if (activo) {
          setErrorCanchas(
            error instanceof Error
              ? error.message
              : 'Ocurrió un error al cargar las canchas.'
          );
        }
      } finally {
        if (activo) {
          setCargandoCanchas(false);
        }
      }
    };

    void cargarCanchas();

    return () => {
      activo = false;
    };
  }, [versionActualizacion]);

  // =====================================================
  // CONSULTAR RESERVAS Y GENERAR DISPONIBILIDAD REAL
  // =====================================================
  useEffect(() => {
    let activo = true;

    const cargarDisponibilidad = async () => {
      if (cargandoCanchas) {
        return;
      }

      if (errorCanchas) {
        setResultados([]);
        setCargandoDisponibilidad(false);
        return;
      }

      try {
        setCargandoDisponibilidad(true);
        setErrorDisponibilidad('');

        const respuesta = await fetch(
          `${API_RESERVAS}/disponibilidad?fecha=${encodeURIComponent(appliedFecha)}`
        );

        const jsonRespuesta: any = await respuesta.json();

        if (!respuesta.ok) {
          const mensaje = jsonRespuesta?.mensaje
            ? String(jsonRespuesta.mensaje)
            : 'No se pudo consultar la disponibilidad.';
          throw new Error(mensaje);
        }

        // CORRECCIÓN: Extraemos el arreglo 'ocupados' del nuevo objeto JSON del backend
        const datos = jsonRespuesta.ocupados || jsonRespuesta;

        if (!Array.isArray(datos)) {
          throw new Error(
            'La respuesta de disponibilidad no es válida.'
          );
        }

        const reservas = datos as ReservaOcupada[];

        const opciones = obtenerOpcionesDeReserva(
          canchasBD,
          appliedSport,
          appliedFecha,
          appliedHora,
          reservas
        );

        if (activo) {
          setResultados(opciones);
        }
      } catch (error) {
        console.error('Error al consultar disponibilidad:', error);

        if (activo) {
          setResultados([]);
          setErrorDisponibilidad(
            error instanceof Error
              ? error.message
              : 'Ocurrió un error al consultar los horarios.'
          );
        }
      } finally {
        if (activo) {
          setCargandoDisponibilidad(false);
        }
      }
    };

    void cargarDisponibilidad();

    return () => {
      activo = false;
    };
  }, [
    canchasBD,
    cargandoCanchas,
    errorCanchas,
    appliedSport,
    appliedFecha,
    appliedHora,
    versionActualizacion,
  ]);

  // =====================================================
  // BUSCAR CANCHAS
  // =====================================================
  const handleBuscar = () => {
    const ahoraChile = obtenerFechaHoraChile();
    const fechaMaxima = sumarDiasAFecha(ahoraChile.fecha, 30);

    if (!inputFecha) {
      setDateError('Por favor selecciona una fecha válida.');
      return;
    }

    if (inputFecha < ahoraChile.fecha) {
      setDateError('No puedes buscar horarios en fechas pasadas.');
      return;
    }

    if (inputFecha > fechaMaxima) {
      setDateError(
        'Solo se permiten reservas con un máximo de 30 días de anticipación.'
      );
      return;
    }

    if (
      inputHora !== 'TODOS' &&
      !ALL_TIME_SLOTS.includes(inputHora)
    ) {
      setDateError('El horario seleccionado no es válido.');
      return;
    }

    // Si es hoy, impedir buscar un turno que ya comenzó o pasó.
    if (
      inputFecha === ahoraChile.fecha &&
      inputHora !== 'TODOS'
    ) {
      const minutosInicio = horaAMinutos(
        inputHora.split(' - ')[0]
      );

      if (minutosInicio <= ahoraChile.minutos) {
        setDateError(
          'El horario seleccionado ya comenzó o ya pasó. Selecciona otro horario.'
        );
        return;
      }
    }

    setDateError('');

    setAppliedSport(inputSport);
    setAppliedFecha(inputFecha);
    setAppliedHora(inputHora);

    router.push(
      `/cliente/horarios/${inputSport}`,
      'none',
      'replace'
    );
  };

  // =====================================================
  // IR A RESERVAR
  // =====================================================
  const handleReservar = (
    canchaId: number,
    horario: string
  ) => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Error: Debes iniciar sesión para reservar.');
      router.push('/login');
      return;
    }

    router.push(
      `/cliente/pago/${canchaId}?fecha=${encodeURIComponent(appliedFecha)}&horario=${encodeURIComponent(horario)}`
    );
  };

  // Imagen de la mascota según el deporte.
  const mascotImage =
    SPORT_MASCOTS[appliedSport] ||
    SPORT_MASCOTS['futbol-7'];

  const cargando =
    cargandoCanchas || cargandoDisponibilidad;

  const errorCarga =
    errorCanchas || errorDisponibilidad;

  // =====================================================
  // RENDERIZADO
  // =====================================================
  return (
    <IonPage>
      {/* ENCABEZADO */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="schedule-toolbar">
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/cliente/inicio"
              text="Volver al Inicio"
              icon={arrowBackOutline}
              className="schedule-back-btn"
            />
          </IonButtons>

          <IonTitle className="schedule-title">
            Horarios Disponibles —{' '}
            {SPORT_NAMES[appliedSport] || 'Canchas'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* CONTENIDO */}
      <IonContent
        fullscreen
        className="schedule-content"
      >
        <div className="schedule-overlay"></div>

        <div className="schedule-layout">
          <div className="schedule-left-panel">

            {/* BUSCADOR */}
            <div className="schedule-search-box">
              <h2>Reserva tu Cancha</h2>

              <p>
                Selecciona deporte, fecha (máx. 30 días) y horario,
                luego presiona Buscar
              </p>

              {/* ERROR DE FECHA */}
              {dateError && (
                <div className="schedule-error-banner">
                  <IonIcon icon={alertCircleOutline} />
                  <span>{dateError}</span>
                </div>
              )}

              {/* FILTROS */}
              <div className="filters-grid">

                {/* DEPORTE */}
                <div className="filter-item">
                  <label>Deporte</label>

                  <div className="input-box">
                    <IonIcon
                      icon={filterOutline}
                      className="input-icon"
                    />

                    <select
                      value={inputSport}
                      onChange={(e) => setInputSport(e.target.value)}
                      className="schedule-select"
                    >
                      {Object.entries(SPORT_NAMES).map(
                        ([key, name]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* FECHA */}
                <div className="filter-item">
                  <label>Fecha (Máx. 1 mes)</label>

                  <div
                    className="input-box"
                    onClick={openCalendar}
                    style={{ cursor: 'pointer' }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      className="input-icon"
                    />

                    <input
                      ref={dateInputRef}
                      type="date"
                      value={inputFecha}
                      min={minDateStr}
                      max={maxDateStr}
                      onChange={(e) => setInputFecha(e.target.value)}
                      className="date-input"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                </div>

                {/* HORARIO */}
                <div className="filter-item">
                  <label>Horario</label>

                  <div className="input-box">
                    <IonIcon
                      icon={timeOutline}
                      className="input-icon"
                    />

                    <select
                      value={inputHora}
                      onChange={(e) => setInputHora(e.target.value)}
                      className="schedule-select"
                    >
                      <option value="TODOS">
                        Todos (08:00 - 23:00)
                      </option>

                      {ALL_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* BANNER DE API EXTERNA: FERIADO */}
              {feriadoActual && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  color: '#fbbf24',
                  padding: '12px 15px',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  <IonIcon icon={alertCircleOutline} style={{ fontSize: '20px' }} />
                  <span><strong>¡Atención!</strong> Ese día es feriado: <em>{feriadoActual}</em>. Verifica los precios y disponibilidad.</span>
                </div>
              )}
              {/* BANNER DE API EXTERNA: CLIMA */}
              {pronostico && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  padding: '12px 15px',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '22px' }}>
                    {pronostico.codigo <= 3 ? '☀️' : pronostico.codigo < 50 ? '☁️' : '🌧️'}
                  </span>
                  <span>
                    <strong>Pronóstico Local:</strong> Máx: {pronostico.tempMax}°C | Mín: {pronostico.tempMin}°C.
                    {pronostico.codigo >= 50 && ' ¡Atención, probabilidad de lluvia!'}
                  </span>
                </div>
              )}
              {/* BOTÓN BUSCAR */}
              <button
                type="button"
                className="btn-buscar-horarios"
                onClick={handleBuscar}
                disabled={cargando}
              >
                <IonIcon
                  icon={searchOutline}
                  style={{
                    marginRight: '8px',
                    fontSize: '20px',
                  }}
                />

                Buscar Canchas
              </button>
            </div>

            {/* RESUMEN DE RESULTADOS */}
            <div className="results-summary">
              <span>
                Mostrando:{' '}
                <strong>
                  {SPORT_NAMES[appliedSport]}
                </strong>
                {' '}| Fecha:{' '}
                <strong>{appliedFecha}</strong>
              </span>

              <span>
                {resultados.length} opciones encontradas
              </span>
            </div>

            {/* LISTADO DE CANCHAS */}
            <div className="courts-list">

              {/* CARGANDO */}
              {cargando && (
                <p>Consultando canchas y reservas...</p>
              )}

              {/* ERROR */}
              {errorCarga && (
                <div className="schedule-error-banner">
                  <IonIcon icon={alertCircleOutline} />
                  <span>{errorCarga}</span>
                </div>
              )}

              {/* SIN RESULTADOS */}
              {!cargando &&
                !errorCarga &&
                resultados.length === 0 && (
                  <p className="no-results-message">
                    No hay horarios disponibles para los filtros seleccionados.
                  </p>
                )}

              {/* TARJETAS DE CANCHAS */}
              {resultados.map((item) => (
                <div
                  key={item.uniqueKey}
                  className={`court-card-box ${item.estado}`}
                >
                  <div className="court-card-top">
                    <h3 className="court-name">
                      {item.nombre}
                    </h3>

                    <span
                      className={`court-status-pill ${item.estado}`}
                    >
                      {item.estado === 'disponible'
                        ? 'DISPONIBLE'
                        : 'OCUPADA'}
                    </span>
                  </div>

                  <div className="court-card-bottom">
                    <div className="court-info">

                      {/* HORARIO */}
                      <p className="court-time">
                        <IonIcon icon={timeOutline} />
                        {item.horario} hrs
                      </p>

                      {/* PRECIO */}
                      <p className="court-price">
                        <IonIcon icon={cashOutline} />
                        {item.precio}{' '}
                        <span>/ hora</span>
                      </p>
                    </div>

                    {/* BOTÓN RESERVAR */}
                    <button
                      type="button"
                      className={`btn-reservar-custom ${item.estado}`}
                      disabled={item.estado === 'ocupada' || cargando}
                      onClick={() =>
                        handleReservar(item.canchaId, item.horario)
                      }
                    >
                      {item.estado === 'disponible'
                        ? 'Reservar'
                        : 'Ocupada'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MASCOTA DEL DEPORTE */}
          <div className="schedule-right-panel">
            <div
              className={`mascot-wrapper mascot-${appliedSport}`}
            >
              <img
                src={mascotImage}
                alt="Mascota del deporte"
                className={`mascot-img img-${appliedSport}`}
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CourtSchedule;
