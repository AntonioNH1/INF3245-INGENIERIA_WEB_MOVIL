import React, { useState } from 'react';
import { IonPage, IonContent, IonInput, IonButton, useIonRouter } from '@ionic/react';
import './Register.css';

const Register: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useIonRouter();

  const handleRegister = () => {
    if (!nombre || !rut || !email || !telefono || !password || !repeatPassword) {
      setErrorMsg('Debes completar todos los campos obligatorios para continuar.');
      return;
    }
    
    if (password !== repeatPassword) {
      setErrorMsg('Las contraseñas no coinciden. Inténtalo de nuevo.');
      return;
    }

    setErrorMsg('');
    alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
    router.push('/login');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" color="light">
        <div className="register-container">
          
          <div className="register-header ion-text-center ion-margin-bottom">
            <img src="/Logo FaltaUno.png" alt="Logo FaltaUno" className="custom-logo" />
            <h2 className="register-title">Crear Cuenta</h2>
            <p className="subtitle">Únete a FaltaUno y empieza a jugar</p>
          </div>

          <div className="register-form">
            
            {errorMsg && <div className="error-box">{errorMsg}</div>}

            <IonInput className="custom-input" type="text" fill="solid" label="Nombre completo" labelPlacement="floating" value={nombre} onIonChange={e => setNombre(e.detail.value!)}></IonInput>
            <IonInput className="custom-input" type="text" fill="solid" label="RUT (ej: 12345678-9)" labelPlacement="floating" value={rut} onIonChange={e => setRut(e.detail.value!)}></IonInput>
            <IonInput className="custom-input" type="email" fill="solid" label="Correo electrónico" labelPlacement="floating" value={email} onIonChange={e => setEmail(e.detail.value!)}></IonInput>
            <IonInput className="custom-input" type="tel" fill="solid" label="Teléfono" labelPlacement="floating" value={telefono} onIonChange={e => setTelefono(e.detail.value!)}></IonInput>
            
            {/* Contraseña principal */}
            <div className="password-container">
              <IonInput 
                className="custom-input password-input" 
                type={showPassword ? "text" : "password"} 
                fill="solid" 
                label="Contraseña" 
                labelPlacement="floating" 
                value={password} 
                onIonChange={e => setPassword(e.detail.value!)}>
              </IonInput>
              <img 
                src={showPassword ? "/password visible.png" : "/Password Invisible.png"} 
                alt="Mostrar contraseña" 
                className="toggle-eye" 
                onClick={() => setShowPassword(!showPassword)} 
              />
            </div>

            {/* Repetir contraseña vinculada al mismo estado */}
            <div className="password-container">
              <IonInput 
                className="custom-input password-input" 
                type={showPassword ? "text" : "password"} 
                fill="solid" 
                label="Repetir Contraseña" 
                labelPlacement="floating" 
                value={repeatPassword} 
                onIonChange={e => setRepeatPassword(e.detail.value!)}>
              </IonInput>
              <img 
                src={showPassword ? "/password visible.png" : "/Password Invisible.png"} 
                alt="Mostrar contraseña" 
                className="toggle-eye" 
                onClick={() => setShowPassword(!showPassword)} 
              />
            </div>

            <IonButton expand="block" shape="round" className="ion-margin-top login-btn" onClick={handleRegister}>
              REGISTRARME
            </IonButton>
          </div>

          <div className="register-prompt ion-text-center">
            <p>¿Ya tienes una cuenta? <span className="link-text" onClick={() => router.push('/login')}>Inicia sesión</span></p>
          </div>
          
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;