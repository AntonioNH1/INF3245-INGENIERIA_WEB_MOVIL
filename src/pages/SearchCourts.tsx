import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/react';

const SearchCourts: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Buscar Canchas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>¿Qué quieres jugar hoy?</h2>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Fútbol 7 - 19:00</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Estado: Disponible</p>
            <IonButton color="success">RESERVAR AHORA</IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Pádel - 20:00</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Estado: Disponible</p>
            <IonButton color="success">RESERVAR AHORA</IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard color="medium">
          <IonCardHeader>
            <IonCardTitle>Tenis - 21:00</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Estado: Ocupada</p>
            <IonButton color="success" disabled>NO DISPONIBLE</IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default SearchCourts;