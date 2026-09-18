import React from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonCard } from '@ionic/react';
import { useParams } from 'react-router-dom';
import './CourtSchedule.css';

const CourtSchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Lista simulada de horarios con estados mixtos para mayor realismo
  const schedules = [
    { time: '14:00 - 15:30', status: 'available' },
    { time: '15:30 - 17:00', status: 'booked' },
    { time: '17:00 - 18:30', status: 'booked' },
    { time: '18:30 - 20:00', status: 'available' },
    { time: '20:00 - 21:30', status: 'available' },
    { time: '21:30 - 23:00', status: 'booked' },
  ];

const formatTitle = (catId: string) => {
    switch (catId) {
      case 'futbol-7': return 'Fútbol 7';
      case 'futbol-11': return 'Fútbol 11';
      case 'padel': return 'Pádel';
      case 'tenis': return 'Tenis';
      case 'bask': return 'Básquetbol';
      case 'voley': return 'Voleibol';
      case 'pingpong': return 'Mesas de Ping Pong';
      default: return 'Deporte';
    }
  };

  const handleReserve = (time: string) => {
    alert(`¡Has seleccionado el horario de ${time}! Procediendo a la reserva.`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cliente/inicio" />
          </IonButtons>
          <IonTitle>Horarios: {formatTitle(id)}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" color="light">
        <div className="schedule-container">
          <h3>Selecciona un bloque horario</h3>
          <p className="subtitle-sched">Revisa la disponibilidad para hoy</p>

          <div className="schedule-list">
            {schedules.map((item, index) => (
              <IonCard key={index} className={`schedule-card ${item.status}`}>
                <div className="schedule-info">
                  <span className="time-text">🕒 {item.time}</span>
                  <span className={`status-badge ${item.status}`}>
                    {item.status === 'available' ? 'Disponible' : 'Reservado'}
                  </span>
                </div>
                {item.status === 'available' ? (
                  <IonButton color="success" size="small" onClick={() => handleReserve(item.time)}>
                    Reservar
                  </IonButton>
                ) : (
                  <IonButton color="medium" size="small" disabled>
                    No disponible
                  </IonButton>
                )}
              </IonCard>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CourtSchedule;