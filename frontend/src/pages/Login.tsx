import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, useIonRouter } from '@ionic/react';

const Login: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const router = useIonRouter();

  const handleLogin = () => {
    router.push('/cliente/inicio');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>CanchasApp - Entrar</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>¡Hola! Ingresa a tu cuenta</h2>
        <IonItem>
          <IonLabel position="floating">Correo</IonLabel>
          <IonInput type="email" value={userEmail} onIonChange={e => setUserEmail(e.detail.value!)}></IonInput>
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Contraseña</IonLabel>
          <IonInput type="password" value={userPassword} onIonChange={e => setUserPassword(e.detail.value!)}></IonInput>
        </IonItem>
        <IonButton expand="block" className="ion-margin-top" onClick={handleLogin}>
          INGRESAR
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;