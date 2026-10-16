import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon, useIonRouter } from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import './CourtSchedule.css';

const SPORT_MASCOTS: Record<string, string> = {
  'futbol-7': '/Imagen Messi FaltaUno.png',
  'futbol-11': '/Imagen Cristiano FaltaUno.png',
  padel: '/Jugador Padel FaltaUno.png',
  tenis: '/Jugador Tenis FaltaUno.png',
  bask: '/LebronJames FaltaUno.png',
  voley: '/Jugador Voleybol FaltaUno.png',
  pingpong: '/Jugador PingPong FaltaUno.png',
};

interface CourtData {
  id: number;
  name: string;
  time: string;
  status: string;
}

const CourtSchedule: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();

  const [selectedDate, setSelectedDate] = useState('2026-09-20');
  const [selectedTime, setSelectedTime] = useState('12:00 - 13:00');

  const [tableData, setTableData] = useState<CourtData[]>([
    { id: 1, name: 'Cancha 1', time: '12:00 - 13:00', status: 'Ocupada' },
    { id: 2, name: 'Cancha 2', time: '12:00 - 13:00', status: 'Reservar' },
    { id: 3, name: 'Cancha 3', time: '12:00 - 13:00', status: 'Reservar' },
    { id: 4, name: 'Cancha 4', time: '12:00 - 13:00', status: 'Reservar' },
    { id: 5, name: 'Cancha 5', time: '12:00 - 13:00', status: 'Ocupada' },
  ]);

  const sportId = id || 'futbol-7';
  const mascotImage = SPORT_MASCOTS[sportId] || SPORT_MASCOTS['futbol-7'];

  const handleBuscar = () => {
    const newResults: CourtData[] = [1, 2, 3, 4, 5].map((courtNum) => ({
      id: courtNum,
      name: `Cancha ${courtNum}`,
      time: selectedTime,
      status: Math.random() > 0.4 ? 'Reservar' : 'Ocupada',
    }));
    setTableData(newResults);
  };

  // Función extraída para mantener el JSX limpio
  const handleReservar = (court: CourtData) => {
    if (court.status === 'Reservar') {
      alert(`Has seleccionado la ${court.name} para las ${court.time} del día ${selectedDate}`);
    }
  };

  const openDatePicker = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    try {
      if ('showPicker' in HTMLInputElement.prototype) {
        input.showPicker();
      }
    } catch {
      // Fallback silencioso
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="schedule-content">
        {/* Botón para volver al inicio */}
        <button
          type="button"
          className="btn-back"
          onClick={() => router.push('/cliente/inicio')}
        >
          <IonIcon icon={arrowBackOutline} />
          Volver al Inicio
        </button>

        <div className="schedule-main-container">
          {/* Panel de búsqueda */}
          <div className="search-panel">
            <div className="search-field">
              <label htmlFor="schedule-date">Fecha</label>
              <input
                id="schedule-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={openDatePicker}
                aria-label="Seleccionar fecha"
                className="schedule-date-input"
              />
            </div>

            <div className="search-divider" />

            <div className="search-field">
              <label htmlFor="schedule-time">Hora</label>
              <select
                id="schedule-time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="schedule-time-select"
              >
                <option value="10:00 - 11:00">10:00 - 11:00</option>
                <option value="11:00 - 12:00">11:00 - 12:00</option>
                <option value="12:00 - 13:00">12:00 - 13:00</option>
                <option value="13:00 - 14:00">13:00 - 14:00</option>
                <option value="14:00 - 15:00">14:00 - 15:00</option>
                <option value="15:00 - 16:00">15:00 - 16:00</option>
                <option value="16:00 - 17:00">16:00 - 17:00</option>
              </select>
            </div>

            <button type="button" className="btn-buscar" onClick={handleBuscar}>
              Buscar
            </button>
          </div>

          {/* Tabla de disponibilidad */}
          <div className="table-container">
            <table className="courts-table">
              <thead>
                <tr>
                  <th>Cancha</th>
                  <th>Horario</th>
                  <th>Reserva</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((court) => (
                  <tr key={court.id}>
                    <td>{court.name}</td>
                    <td>{court.time}</td>
                    <td>
                      <button
                        type="button"
                        className={`status-badge ${
                          court.status === 'Ocupada' ? 'badge-ocupada' : 'badge-reservar'
                        }`}
                        disabled={court.status === 'Ocupada'}
                        onClick={() => handleReservar(court)}
                      >
                        {court.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mascota deportiva: ¡Código mucho más limpio sin estilos en línea! */}
        <div className={`sport-mascot-container mascot-${sportId}`}>
          <img
            src={mascotImage}
            alt="Mascota del deporte"
            className="sport-mascot"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CourtSchedule;