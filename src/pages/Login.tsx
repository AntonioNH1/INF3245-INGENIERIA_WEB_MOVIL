import React, { useState } from 'react';
import { IonPage, IonContent, IonInput, IonButton, useIonRouter } from '@ionic/react';
import './Login.css';

const Login: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useIonRouter();

const handleLogin = () => {
    if (!userEmail || !userPassword) {
      setErrorMsg('Debes completar todos los campos para iniciar sesión.');
      return;
    }

    setErrorMsg('');
    localStorage.setItem('userName', 'Antonio'); 
    router.push('/cliente/inicio');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" color="light">
        <div className="login-container">
          
          <div className="login-header ion-text-center ion-margin-bottom">
            <img src="/Logo FaltaUno.png" alt="Logo FaltaUno" className="custom-logo" />
            <p className="subtitle">
              <span className="pregunta-destacada">¿Falta uno para completar el equipo?</span>
              <br />
              Reserva tu cancha en segundos y sal a jugar.
            </p>
          </div>

          <div className="login-form">
            
            {errorMsg && <div className="error-box">{errorMsg}</div>}

            <IonInput
              className="ion-margin-bottom custom-input"
              type="email"
              fill="solid"
              label="Correo electrónico"
              labelPlacement="floating"
              value={userEmail}
              onIonChange={e => setUserEmail(e.detail.value!)}
            ></IonInput>

            <div className="password-container">
              <IonInput
                className="custom-input password-input"
                type={showPassword ? "text" : "password"}
                fill="solid"
                label="Contraseña"
                labelPlacement="floating"
                value={userPassword}
                onIonChange={e => setUserPassword(e.detail.value!)}
              ></IonInput>
              <img 
                src={showPassword ? "/password visible.png" : "/Password Invisible.png"} 
                alt="Mostrar contraseña" 
                className="toggle-eye" 
                onClick={() => setShowPassword(!showPassword)} 
              />
            </div>

            <IonButton expand="block" shape="round" className="ion-margin-top login-btn" onClick={handleLogin}>
              INGRESAR
            </IonButton>

            <div className="register-prompt ion-text-center ion-margin-top">
              <p>¿No tienes una cuenta? <span className="link-text" onClick={() => router.push('/registro')}>Regístrate aquí</span></p>
            </div>
          </div>
          
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;