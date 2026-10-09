import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/react';

const AdminCalendar: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonTitle>Calendario Admin</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Reservas del día</h2>
        <IonList>
          <IonItem>
            <IonLabel>
              <h2>19:00 - Fútbol 7</h2>
              <p>Reservado por: Antonio Navarro</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <h2>20:00 - Pádel</h2>
              <p>Reservado por: Annais Legua</p>
            </IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default AdminCalendar;