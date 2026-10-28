// --- IMPORTACIONES ---
import React, { useState, useEffect, useRef } from 'react';
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

// --- CONFIGURACIÓN Y DATOS BASE ---
const SPORT_MASCOTS: Record<string, string> = {
  'futbol-7': '/Imagen Messi FaltaUno.png',
  'futbol-11': '/Imagen Cristiano FaltaUno.png',
  padel: '/Jugador Padel FaltaUno.png',
  tenis: '/Jugador Tenis FaltaUno.png',
  bask: '/LebronJames FaltaUno.png',
  voley: '/Jugador Voleybol FaltaUno.png',
  pingpong: '/Jugador PingPong FaltaUno.png',
};

const SPORT_NAMES: Record<string, string> = {
  'futbol-7': 'Fútbol 7',
  'futbol-11': 'Fútbol 11',
  padel: 'Pádel',
  tenis: 'Tenis',
  bask: 'Básquetbol',
  voley: 'Voleibol',
  pingpong: 'Mesas de Ping Pong',
};

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

const BASE_COURTS: Record<string, { id: number; nombre: string; precioBase: number }[]> = {
  'futbol-7': [
    { id: 1, nombre: 'Cancha Sintética 1 (Techada)', precioBase: 25000 },
    { id: 2, nombre: 'Cancha Sintética 2 (Iluminada)', precioBase: 22000 },
    { id: 3, nombre: 'Cancha Sintética 3 (Sur)', precioBase: 20000 },
  ],
  'futbol-11': [
    { id: 4, nombre: 'Estadio Principal Grass', precioBase: 45000 },
    { id: 5, nombre: 'Cancha Oficial Norte', precioBase: 40000 },
  ],
  padel: [
    { id: 6, nombre: 'Cancha Pádel Panorámica 1', precioBase: 18000 },
    { id: 7, nombre: 'Cancha Pádel Blindex 2', precioBase: 16000 },
    { id: 8, nombre: 'Cancha Pádel Indoor 3', precioBase: 20000 },
  ],
  tenis: [
    { id: 9, nombre: 'Cancha Central Arcilla', precioBase: 14000 },
    { id: 10, nombre: 'Cancha Rápida 2', precioBase: 12000 },
    { id: 11, nombre: 'Cancha Arcilla 3', precioBase: 12000 },
  ],
  bask: [
    { id: 12, nombre: 'Gimnasio Parquet Principal', precioBase: 22000 },
    { id: 13, nombre: 'Cancha Multiuso Techada', precioBase: 16000 },
  ],
  voley: [
    { id: 14, nombre: 'Cancha Arena Profesional 1', precioBase: 15000 },
    { id: 15, nombre: 'Gimnasio Voleibol Indoor', precioBase: 18000 },
  ],
  pingpong: [
    { id: 16, nombre: 'Mesa Profesional 1 (Salón VIP)', precioBase: 6000 },
    { id: 17, nombre: 'Mesa Profesional 2 (Salón General)', precioBase: 5000 },
    { id: 18, nombre: 'Mesa Profesional 3 (Salón General)', precioBase: 5000 },
  ],
};

// --- TIPOS Y UTILIDADES ---
interface CourtResult {
  uniqueKey: string;
  canchaId: number;
  nombre: string;
  horario: string;
  precio: string;
  estado: 'disponible' | 'ocupada';
}

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- COMPONENTE PRINCIPAL ---
const CourtSchedule: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();

  const todayObj = new Date();
  const maxDateObj = new Date();
  maxDateObj.setDate(todayObj.getDate() + 30);

  const minDateStr = formatDateLocal(todayObj);
  const maxDateStr = formatDateLocal(maxDateObj);

  // --- ESTADOS ---
  const [inputSport, setInputSport] = useState(id || 'futbol-7');
  const [inputFecha, setInputFecha] = useState(minDateStr);
  const [inputHora, setInputHora] = useState('18:00 - 19:00');
  const [dateError, setDateError] = useState('');

  const dateInputRef = useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    try {
      if (dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
        dateInputRef.current.showPicker();
      }
    } catch (e) {

    }
  };

  const [appliedSport, setAppliedSport] = useState(id || 'futbol-7');
  const [appliedFecha, setAppliedFecha] = useState(minDateStr);
  const [resultados, setResultados] = useState<CourtResult[]>([]);

  // --- LÓGICA DE DISPONIBILIDAD Y BÚSQUEDA ---
  const generarDisponibilidad = (deporte: string, fechaStr: string, horaFiltro: string) => {
    const canchasDeporte = BASE_COURTS[deporte] || BASE_COURTS['futbol-7'];
    const horariosAEvaluar = horaFiltro === 'TODOS' ? ALL_TIME_SLOTS : [horaFiltro];
    const seedFecha = fechaStr.split('-').reduce((acc, val) => acc + parseInt(val, 10), 0);

    const listaGenerada: CourtResult[] = [];

    canchasDeporte.forEach((cancha) => {
      horariosAEvaluar.forEach((slot, indexSlot) => {
        const horaInicio = parseInt(slot.split(':')[0], 10);
        const precioFinal = horaInicio >= 19 ? cancha.precioBase + 3000 : cancha.precioBase;
        const hash = (cancha.id * 7 + horaInicio * 13 + seedFecha + indexSlot) % 10;
        const estaDisponible = hash >= 4;

        listaGenerada.push({
          uniqueKey: `${cancha.id}-${slot}`,
          canchaId: cancha.id,
          nombre: cancha.nombre,
          horario: slot,
          precio: `$${precioFinal.toLocaleString('es-CL')}`,
          estado: estaDisponible ? 'disponible' : 'ocupada',
        });
      });
    });

    setResultados(listaGenerada);
  };

  useEffect(() => {
    const initialSport = id || 'futbol-7';
    setInputSport(initialSport);
    setAppliedSport(initialSport);
    generarDisponibilidad(initialSport, minDateStr, '18:00 - 19:00');
  }, [id, minDateStr]);

  const handleBuscar = () => {
    if (!inputFecha) {
      setDateError('Por favor selecciona una fecha válida.');
      return;
    }
    if (inputFecha < minDateStr) {
      setDateError('No puedes buscar horarios en fechas pasadas.');
      return;
    }
    if (inputFecha > maxDateStr) {
      setDateError('Solo se permiten reservas con un máximo de 1 mes de anticipación.');
      return;
    }

    setDateError('');
    setAppliedSport(inputSport);
    setAppliedFecha(inputFecha);
    generarDisponibilidad(inputSport, inputFecha, inputHora);
    router.push(`/cliente/horarios/${inputSport}`, 'none', 'replace');
  };

  const handleReservar = (canchaId: number, horario: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Error: Debes iniciar sesión para reservar.');
      router.push('/login');
      return;
    }
    router.push(`/cliente/pago/${canchaId}?fecha=${appliedFecha}&horario=${encodeURIComponent(horario)}`);
  };

  const mascotImage = SPORT_MASCOTS[appliedSport] || SPORT_MASCOTS['futbol-7'];

  // --- RENDERIZADO ---
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="schedule-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cliente/inicio" text="Volver al Inicio" icon={arrowBackOutline} className="schedule-back-btn" />
          </IonButtons>
          <IonTitle className="schedule-title">
            Horarios Disponibles — {SPORT_NAMES[appliedSport] || 'Canchas'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="schedule-content">
        <div className="schedule-overlay"></div>

        <div className="schedule-layout">
          <div className="schedule-left-panel">
            <div className="schedule-search-box">
              <h2>Reserva tu Cancha</h2>
              <p>Selecciona deporte, fecha (máx. 30 días) y horario, luego presiona Buscar</p>

              {dateError && (
                <div className="schedule-error-banner">
                  <IonIcon icon={alertCircleOutline} />
                  <span>{dateError}</span>
                </div>
              )}

              <div className="filters-grid">
                <div className="filter-item">
                  <label>Deporte</label>
                  <div className="input-box">
                    <IonIcon icon={filterOutline} className="input-icon" />
                    <select
                      value={inputSport}
                      onChange={(e) => setInputSport(e.target.value)}
                      className="schedule-select"
                    >
                      {Object.entries(SPORT_NAMES).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-item">
                  <label>Fecha (Máx. 1 mes)</label>
                  <div className="input-box" onClick={openCalendar} style={{ cursor: 'pointer' }}>
                    <IonIcon icon={calendarOutline} className="input-icon" />
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

                <div className="filter-item">
                  <label>Horario</label>
                  <div className="input-box">
                    <IonIcon icon={timeOutline} className="input-icon" />
                    <select
                      value={inputHora}
                      onChange={(e) => setInputHora(e.target.value)}
                      className="schedule-select"
                    >
                      <option value="TODOS">Todos (08:00 - 23:00)</option>
                      {ALL_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button type="button" className="btn-buscar-horarios" onClick={handleBuscar}>
                <IonIcon icon={searchOutline} style={{ marginRight: '8px', fontSize: '20px' }} />
                Buscar Canchas
              </button>
            </div>

            <div className="results-summary">
              <span>
                Mostrando: <strong>{SPORT_NAMES[appliedSport]}</strong> | Fecha: <strong>{appliedFecha}</strong>
              </span>
              <span>{resultados.length} opciones encontradas</span>
            </div>

            <div className="courts-list">
              {resultados.map((item) => (
                <div key={item.uniqueKey} className={`court-card-box ${item.estado}`}>
                  <div className="court-card-top">
                    <h3 className="court-name">{item.nombre}</h3>
                    <span className={`court-status-pill ${item.estado}`}>
                      {item.estado === 'disponible' ? 'DISPONIBLE' : 'OCUPADA'}
                    </span>
                  </div>

                  <div className="court-card-bottom">
                    <div className="court-info">
                      <p className="court-time">
                        <IonIcon icon={timeOutline} />
                        {item.horario} hrs
                      </p>
                      <p className="court-price">
                        <IonIcon icon={cashOutline} />
                        {item.precio} <span>/ hora</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`btn-reservar-custom ${item.estado}`}
                      disabled={item.estado === 'ocupada'}
                      onClick={() => handleReservar(item.canchaId, item.horario)}
                    >
                      {item.estado === 'disponible' ? 'Reservar' : 'Ocupada'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="schedule-right-panel">
            <div className={`mascot-wrapper mascot-${appliedSport}`}>
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