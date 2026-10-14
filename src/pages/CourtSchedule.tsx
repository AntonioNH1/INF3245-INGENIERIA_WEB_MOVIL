import React, { useState } from 'react';
import { IonPage, IonContent, useIonRouter, IonIcon } from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import './CourtSchedule.css';

const SPORT_MASCOTS: Record<string, string> = {
  'futbol-7': '/Imagen Messi FaltaUno.png',
  'futbol-11': '/Imagen Cristiano FaltaUno.png',
  'padel': '/Jugador Padel FaltaUno.png',
  'tenis': '/Jugador Tenis FaltaUno.png',
  'bask': '/LebronJames FaltaUno.png',
  'voley': '/Jugador Voleybol FaltaUno.png',
  'pingpong': '/Jugador PingPong FaltaUno.png',
};

// Interfaz para definir cómo es una cancha en la tabla
interface CourtData {
  id: number;
  name: string;
  time: string;
  status: string;
}

const CourtSchedule: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>(); 
  
  // Estados para los selectores
  const [selectedDate, setSelectedDate] = useState('2026-09-20');
  const [selectedTime, setSelectedTime] = useState('12:00 - 13:00'); // Formato exacto a mostrar

  // Estado para la tabla de canchas
  const [tableData, setTableData] = useState<CourtData[]>([
    { id: 1, name: 'Cancha 1', time: '12:00 - 13:00', status: 'Ocupada' },
    { id: 2, name: 'Cancha 2', time: '12:00 - 13:00', status: 'Reservar' },
    { id: 3, name: 'Cancha 3', time: '12:00 - 13:00', status: 'Reservar' },
    { id: 4, name: 'Cancha 4', time: '12:00 - 13:00', status: 'Reservar' },
    { id: 5, name: 'Cancha 5', time: '12:00 - 13:00', status: 'Ocupada' },
  ]);

  const mascotImage = SPORT_MASCOTS[id || 'futbol-7'] || SPORT_MASCOTS['futbol-7'];

  // Función que simula la búsqueda en base de datos
  const handleBuscar = () => {
    // Generamos una nueva lista de canchas con la HORA ACTUALIZADA
    // y mezclamos aleatoriamente si están ocupadas o libres para darle realismo
    const newResults: CourtData[] = [1, 2, 3, 4, 5].map((courtNum) => ({
      id: courtNum,
      name: `Cancha ${courtNum}`,
      time: selectedTime, // Aquí inyectamos la hora que el usuario eligió en el selector
      status: Math.random() > 0.4 ? 'Reservar' : 'Ocupada' // 60% probabilidad de estar libre
    }));

    setTableData(newResults);
  };

  // Forzar la apertura del calendario al hacer click en cualquier parte del input
  const openDatePicker = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    try {
      if ('showPicker' in HTMLInputElement.prototype) {
        input.showPicker();
      }
    } catch (error) {
      // Navegadores antiguos lo ignorarán
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="schedule-content">
        
        <button className="btn-back" onClick={() => router.push('/cliente/inicio')}>
          <IonIcon icon={arrowBackOutline} /> Volver al Inicio
        </button>

        <div className="schedule-main-container">
          
          {/* Panel de Búsqueda (Fecha y Hora) */}
          <div className="search-panel">
            <div className="search-field">
              <label>Fecha</label>
              <div className="input-with-icon">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  onClick={openDatePicker} // Abre el calendario al clickear
                  style={{ cursor: 'pointer', width: '130px' }}
                />
              </div>
            </div>
            
            <div className="search-divider"></div>
            
            <div className="search-field">
              <label>Hora</label>
              <select 
                value={selectedTime} 
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{ cursor: 'pointer', width: '130px' }}
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

            <button className="btn-buscar" onClick={handleBuscar}>
              Buscar
            </button>
          </div>

          {/* Tabla Dinámica de Canchas */}
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
                        className={`status-badge ${court.status === 'Ocupada' ? 'badge-ocupada' : 'badge-reservar'}`}
                        onClick={() => {
                          if (court.status === 'Reservar') {
                            alert(`Has seleccionado la ${court.name} para las ${court.time} del día ${selectedDate}`);
                          }
                        }}
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

        <img 
          src={mascotImage} 
          alt="Mascota del Deporte" 
          className="sport-mascot" 
        />

      </IonContent>
    </IonPage>
  );
};

export default CourtSchedule;