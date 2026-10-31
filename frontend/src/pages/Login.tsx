/* =========================================================
   IMPORTACIONES
   ========================================================= */
import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  useIonRouter,
} from '@ionic/react';
import './Login.css';

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
const Login: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoverError, setRecoverError] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState('');

  const router = useIonRouter();

/* =========================================================
     LÓGICA DE INICIO DE SESIÓN
     ========================================================= */
  const handleLogin = async () => {
    if (!userEmail.trim() || !userPassword) {
      setErrorMsg('Debes completar todos los campos para iniciar sesión.');
      return;
    }

    setErrorMsg('');

    try {
      const respuesta = await fetch('http://localhost:3000/api/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.usuario.nombre);
        
        // Guardamos el correo y teléfono reales enviados por el servidor
        localStorage.setItem('userEmail', data.usuario.correo || userEmail);
        localStorage.setItem('userPhone', data.usuario.telefono || localStorage.getItem('userPhone') || '');  
        
        localStorage.setItem('userRol', data.usuario.rol);
localStorage.setItem('userId', data.usuario.id.toString());
localStorage.setItem('user_logged_in', 'true');

// Redirigir según el rol del usuario
const rol = String(data.usuario.rol || '')
  .trim()
  .toLowerCase();

if (rol === 'admin' || rol === 'administrador') {
  router.push('/admin/calendario', 'root');
} else {
  router.push('/cliente/inicio', 'root');
}
      } else {
        setErrorMsg(data.mensaje || 'Correo o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      setErrorMsg('Error de conexión con el servidor. Verifica que el backend esté corriendo.');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

  /* =========================================================
     LÓGICA DE RECUPERACIÓN DE CONTRASEÑA
     ========================================================= */
  const handleRecoverSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRecoverError('');
    setRecoverSuccess('');

    if (!recoverEmail.trim() || !newPassword || !confirmNewPassword) {
      setRecoverError('Por favor completa todos los campos.');
      return;
    }

    if (newPassword.length < 4) {
      setRecoverError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setRecoverError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setRecoverSuccess('¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.');
    setTimeout(() => {
      setShowRecoverModal(false);
      setRecoverEmail('');
      setNewPassword('');
      setConfirmNewPassword('');
      setRecoverSuccess('');
    }, 1800);
  };

  /* =========================================================
     RENDERIZADO
     ========================================================= */
  return (
    <IonPage>
      <IonContent className="ion-padding app-bg" fullscreen>
        <div className="login-container">
          <div className="login-panel">
            <div className="login-header ion-text-center">
              <img
                src="/Logo FaltaUno.png"
                alt="Logo FaltaUno"
                className="custom-logo"
              />

              <p className="subtitle">
                <span className="pregunta-destacada">
                  ¿Falta uno para completar el equipo?
                </span>
                <br />
                Reserva tu cancha en segundos y sal a jugar.
              </p>
            </div>

            <div className="panel-divider"></div>

            <form className="login-form" onSubmit={handleSubmit}>
              {errorMsg && (
                <div className="error-box" role="alert">
                  {errorMsg}
                </div>
              )}

              <IonInput
                className="custom-input"
                type="email"
                fill="solid"
                label="Correo electrónico"
                labelPlacement="floating"
                value={userEmail}
                onIonInput={(e) => setUserEmail(e.detail.value ?? '')}
                autocomplete="email"
              />

              <div className="password-container">
                <IonInput
                  className="custom-input password-input"
                  type={showPassword ? 'text' : 'password'}
                  fill="solid"
                  label="Contraseña"
                  labelPlacement="floating"
                  value={userPassword}
                  onIonInput={(e) => setUserPassword(e.detail.value ?? '')}
                  autocomplete="current-password"
                />

                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img
                    src={
                      showPassword
                        ? '/password visible.png'
                        : '/Password Invisible.png'
                    }
                    alt={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    className="toggle-eye-img"
                  />
                </button>
              </div>

              <div className="forgot-password-row">
                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={() => {
                    setRecoverError('');
                    setRecoverSuccess('');
                    setShowRecoverModal(true);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <IonButton
                expand="block"
                shape="round"
                className="login-btn"
                type="submit"
              >
                INGRESAR
              </IonButton>

              <div className="register-prompt ion-text-center">
                <p>¿No tienes una cuenta?</p>
                <button
                  type="button"
                  className="register-pill-btn"
                  onClick={() => router.push('/registro')}
                >
                  Regístrate aquí
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* =========================================================
            VENTANA MODAL PARA CAMBIAR CONTRASEÑA
            ========================================================= */}
        {showRecoverModal && (
          <div className="recover-modal-backdrop">
            <div className="recover-modal-box">
              <h3>Recuperar Contraseña</h3>
              <p className="recover-subtitle">
                Ingresa tu correo registrado y define tu nueva contraseña de acceso.
              </p>

              {recoverError && (
                <div className="error-box" role="alert">
                  {recoverError}
                </div>
              )}

              {recoverSuccess && (
                <div className="success-box" role="status">
                  {recoverSuccess}
                </div>
              )}

              <form onSubmit={handleRecoverSubmit} className="recover-form">
                <IonInput
                  className="custom-input"
                  type="email"
                  fill="solid"
                  label="Correo electrónico registrado"
                  labelPlacement="floating"
                  value={recoverEmail}
                  onIonInput={(e) => setRecoverEmail(e.detail.value ?? '')}
                />

                <IonInput
                  className="custom-input"
                  type="password"
                  fill="solid"
                  label="Nueva contraseña"
                  labelPlacement="floating"
                  value={newPassword}
                  onIonInput={(e) => setNewPassword(e.detail.value ?? '')}
                />

                <IonInput
                  className="custom-input"
                  type="password"
                  fill="solid"
                  label="Confirmar nueva contraseña"
                  labelPlacement="floating"
                  value={confirmNewPassword}
                  onIonInput={(e) => setConfirmNewPassword(e.detail.value ?? '')}
                />

                <div className="recover-actions">
                  <button
                    type="button"
                    className="btn-recover-cancel"
                    onClick={() => setShowRecoverModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-recover-submit">
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Login;