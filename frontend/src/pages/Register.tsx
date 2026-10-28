/* =========================================================
   IMPORTACIONES
   ========================================================= */
import React, { useState } from 'react';
import { IonPage, IonContent, IonRouterLink, useIonRouter, IonIcon } from '@ionic/react';
import {
  personOutline,
  cardOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import './Register.css';

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
const Register: React.FC = () => {
  const router = useIonRouter();
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /* =========================================================
     FORMATEO Y VALIDACIÓN DE RUT CHILENO (MÓDULO 11)
     ========================================================= */
  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
    if (clean.length <= 1) return clean;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${dv}`;
  };

const validateRut = (rutStr: string) => {
    const clean = rutStr.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 8 || clean.length > 9) {
      return 'El RUT debe tener entre 8 y 9 caracteres (ej: 12.345.678-9).';
    }

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    if (!/^\d+$/.test(body)) {
      return 'El cuerpo del RUT solo debe contener números.';
    }

    if (!/^[0-9K]$/.test(dv)) {
      return 'El dígito verificador debe ser un número del 0 al 9 o la letra K.';
    }

    return '';
  };

  /* =========================================================
     FORMATEO Y VALIDACIÓN DE TELÉFONO Y CORREO
     ========================================================= */
  const handlePhoneChange = (value: string) => {
    const onlyNums = value.replace(/\D/g, '').slice(0, 9);
    setTelefono(onlyNums);
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return 'El correo electrónico es obligatorio.';
    if (email.includes(',')) {
      return 'El correo contiene una coma (,). Reemplázala por un punto (.).';
    }
    if (email.includes(' ')) return 'El correo no puede contener espacios.';
    if (!email.includes('@')) return 'Al correo le falta el símbolo "@".';

    const parts = email.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return 'Ingresa un correo con formato usuario@dominio.com.';
    }
    if (!parts[1].includes('.') || parts[1].startsWith('.') || parts[1].endsWith('.')) {
      return 'El dominio del correo es inválido (ejemplo correcto: @gmail.com o @pucv.cl).';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'El formato del correo electrónico no es válido.';
    }
    return '';
  };

  /* =========================================================
     ENVÍO DEL FORMULARIO
     ========================================================= */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nombre.trim() || !rut.trim() || !correo.trim() || !telefono.trim() || !password || !confirmPassword) {
      setErrorMsg('Todos los campos son obligatorios para crear tu cuenta.');
      return;
    }

    if (nombre.trim().length < 3) {
      setErrorMsg('Ingresa un nombre válido.');
      return;
    }

    const rutError = validateRut(rut);
    if (rutError) {
      setErrorMsg(rutError);
      return;
    }

    const emailError = validateEmail(correo);
    if (emailError) {
      setErrorMsg(emailError);
      return;
    }

    if (telefono.length !== 9 || !telefono.startsWith('9')) {
      setErrorMsg('El teléfono móvil debe tener exactamente 9 dígitos y comenzar con 9 (ej: 912345678).');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:3000/api/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          rut: rut.trim(),
          correo: correo.trim(),
          email: correo.trim(),
          telefono: `+56 ${telefono}`,
          password,
          contraseña: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userName', nombre.trim());
        localStorage.setItem('userEmail', correo.trim());
        localStorage.setItem('userPhone', `+56 ${telefono}`);

        setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          router.push('/login', 'forward', 'replace');
        }, 1800);
      } else {
        setErrorMsg(data.mensaje || data.error || 'No se pudo registrar la cuenta.');
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor. Verifica que el backend esté encendido.');
    } finally {
      setIsProcessing(false);
    }
  };

  /* =========================================================
     RENDERIZADO
     ========================================================= */
  return (
    <IonPage>
      <IonContent fullscreen className="register-content">
        <div className="register-overlay"></div>

        <div className="register-container">
          <div className="register-glass-box">
            <div className="register-header">
              <img src="/Logo FaltaUno.png" alt="Logo FaltaUno" className="register-logo" />
              <h2>Crear Cuenta</h2>
              <p>Únete a FaltaUno y empieza a jugar</p>
            </div>

            {errorMsg && (
              <div className="register-alert error">
                <IonIcon icon={alertCircleOutline} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="register-alert success">
                <IonIcon icon={checkmarkCircleOutline} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="register-form">
              <div className="reg-field">
                <label className="reg-label">Nombre Completo</label>
                <div className="reg-input-wrapper">
                  <IonIcon icon={personOutline} className="reg-icon" />
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={nombre}
                    onChange={(e) =>
                      setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 40))
                    }
                    className="reg-input"
                  />
                </div>
              </div>

              <div className="reg-field">
                <label className="reg-label">RUT (Formato Chileno)</label>
                <div className="reg-input-wrapper">
                  <IonIcon icon={cardOutline} className="reg-icon" />
                  <input
                    type="text"
                    placeholder="Ej: 12.345.678-9"
                    value={rut}
                    maxLength={12}
                    onChange={(e) => setRut(formatRut(e.target.value))}
                    className="reg-input"
                  />
                </div>
              </div>

              <div className="reg-field">
                <label className="reg-label">Correo Electrónico</label>
                <div className="reg-input-wrapper">
                  <IonIcon icon={mailOutline} className="reg-icon" />
                  <input
                    type="text"
                    placeholder="usuario@ejemplo.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="reg-input"
                  />
                </div>
              </div>

              <div className="reg-field">
                <label className="reg-label">Teléfono Móvil (9 dígitos)</label>
                <div className="reg-input-wrapper">
                  <IonIcon icon={callOutline} className="reg-icon" />
                  <span className="reg-phone-prefix">+56</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="912345678"
                    value={telefono}
                    maxLength={9}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="reg-input"
                  />
                </div>
              </div>

              <div className="reg-row-split">
                <div className="reg-field">
                  <label className="reg-label">Contraseña</label>
                  <div className="reg-input-wrapper reg-password-wrapper">
                    <IonIcon icon={lockClosedOutline} className="reg-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mín. 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="reg-input"
                    />
                    <button
                      type="button"
                      className="reg-btn-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <img
                        src={showPassword ? '/password visible.png' : '/Password Invisible.png'}
                        alt="Ver"
                        className="reg-eye-img"
                      />
                    </button>
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Repetir Contraseña</label>
                  <div className="reg-input-wrapper reg-password-wrapper">
                    <IonIcon icon={lockClosedOutline} className="reg-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite la clave"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="reg-input"
                    />
                    <button
                      type="button"
                      className="reg-btn-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <img
                        src={showConfirmPassword ? '/password visible.png' : '/Password Invisible.png'}
                        alt="Ver"
                        className="reg-eye-img"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-register-submit" disabled={isProcessing}>
                {isProcessing ? 'CREANDO CUENTA...' : 'REGISTRARME'}
              </button>
            </form>

            <div className="register-footer-links">
              <div className="divider-line"></div>
              <div className="login-prompt">
                <span>¿Ya tienes una cuenta?</span>
                <IonRouterLink routerLink="/login" className="link-login-btn">
                  INICIA SESIÓN
                </IonRouterLink>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;