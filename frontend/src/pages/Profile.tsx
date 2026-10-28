/* =========================================================
   IMPORTACIONES
   ========================================================= */
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  useIonRouter,
} from '@ionic/react';
import {
  arrowBackOutline,
  personOutline,
  calendarOutline,
  cardOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  saveOutline,
  trashOutline,
  addCircleOutline,
  timeOutline,
  cashOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import './Profile.css';

/* =========================================================
   INTERFACES Y TIPOS
   ========================================================= */
export interface SavedCard {
  id: string;
  brand: string;
  numberMasked: string;
  fullNumber: string;
  holder: string;
  expiry: string;
}

export interface UserReservation {
  id: string;
  codigo: string;
  canchaNombre: string;
  deporte: string;
  fecha: string;
  horario: string;
  monto: number;
  tarjetaUsada: string;
  estado: 'Confirmada' | 'Cancelación Solicitada' | 'Cancelada';
  motivoCancelacion?: string;
}

type TabType = 'datos' | 'reservas' | 'pagos';

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
const Profile: React.FC = () => {
  const router = useIonRouter();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<TabType>('datos');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* =========================================================
     ESTADOS: DATOS PERSONALES
     ========================================================= */
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* =========================================================
     ESTADOS: MIS RESERVAS
     ========================================================= */
  const [reservas, setReservas] = useState<UserReservation[]>([]);
  const [cancelModalReserva, setCancelModalReserva] = useState<UserReservation | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  /* =========================================================
     ESTADOS: MÉTODOS DE PAGO
     ========================================================= */
  const [tarjetas, setTarjetas] = useState<SavedCard[]>([]);
  const [cardToDelete, setCardToDelete] = useState<SavedCard | null>(null);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');

  /* =========================================================
     CARGA INICIAL Y SINCRONIZACIÓN CON URL
     ========================================================= */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabType | null;
    if (tabParam && ['datos', 'reservas', 'pagos'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    setNombre(localStorage.getItem('userName') || '');
    setCorreo(localStorage.getItem('userEmail') || '');
    setTelefono(localStorage.getItem('userPhone') || '');

    const savedCardsStr = localStorage.getItem('fu_saved_cards');
    if (savedCardsStr) {
      try {
        setTarjetas(JSON.parse(savedCardsStr));
      } catch {
        setTarjetas([]);
      }
    } else {
      setTarjetas([]);
    }

    const savedResStr = localStorage.getItem('fu_user_reservations');
    if (savedResStr) {
      try {
        setReservas(JSON.parse(savedResStr));
      } catch {
        setReservas([]);
      }
    } else {
      setReservas([]);
    }
  }, [location.search]);

  const showTempFeedback = (msg: string) => {
    setErrorMsg('');
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  /* =========================================================
     VALIDADORES DE CORREO Y TELÉFONO
     ========================================================= */
  const validateEmail = (email: string) => {
    if (!email.trim()) return 'El correo electrónico es obligatorio.';
    if (email.includes(',')) {
      return 'El correo contiene una coma (,). Por favor, reemplázala por un punto (.).';
    }
    if (email.includes(' ')) return 'El correo no puede contener espacios en blanco.';
    if (!email.includes('@')) return 'Al correo le falta el símbolo "@".';

    const parts = email.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return 'Ingresa un correo con formato usuario@dominio.com.';
    }
    if (!parts[1].includes('.') || parts[1].startsWith('.') || parts[1].endsWith('.')) {
      return 'El dominio del correo es inválido (ejemplo correcto: @gmail.com o @empresa.cl).';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'El formato del correo electrónico no es válido.';
    }
    return '';
  };

  /* =========================================================
     LÓGICA: GUARDAR DATOS PERSONALES Y CONTRASEÑA
     ========================================================= */
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !correo.trim() || !telefono.trim()) {
      setErrorMsg('Nombre, correo y teléfono son obligatorios.');
      return;
    }

    if (nombre.trim().length < 3) {
      setErrorMsg('Ingresa un nombre válido (mínimo 3 caracteres).');
      return;
    }

    const emailErr = validateEmail(correo.trim());
    if (emailErr) {
      setErrorMsg(emailErr);
      return;
    }

    const digitsOnly = telefono.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      setErrorMsg('El teléfono móvil debe contener al menos 9 números (ej: +56 9 1234 5678).');
      return;
    }

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setErrorMsg('Ingresa tu contraseña actual para autorizar el cambio de clave.');
        return;
      }
      if (newPassword.length < 4) {
        setErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('La nueva contraseña y su confirmación no coinciden.');
        return;
      }
    }

    localStorage.setItem('userName', nombre.trim());
    localStorage.setItem('userEmail', correo.trim());
    localStorage.setItem('userPhone', telefono.trim());

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showTempFeedback('¡Tus datos personales se actualizaron correctamente!');
  };

  /* =========================================================
     LÓGICA: SOLICITAR CANCELACIÓN DE RESERVA
     ========================================================= */
  const handleConfirmCancelRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalReserva) return;

    if (!motivoCancelacion.trim()) {
      setErrorMsg('Por favor indica brevemente el motivo de la cancelación.');
      return;
    }

    const updated = reservas.map((r) =>
      r.id === cancelModalReserva.id
        ? { ...r, estado: 'Cancelación Solicitada' as const, motivoCancelacion: motivoCancelacion.trim() }
        : r
    );

    setReservas(updated);
    localStorage.setItem('fu_user_reservations', JSON.stringify(updated));
    setCancelModalReserva(null);
    setMotivoCancelacion('');
    showTempFeedback(`Solicitud enviada para la reserva ${cancelModalReserva.codigo}.`);
  };

  /* =========================================================
     LÓGICA: AGREGAR Y ELIMINAR TARJETAS
     ========================================================= */
  const formatCardNum = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    return raw.length >= 3 ? `${raw.slice(0, 2)}/${raw.slice(2, 4)}` : raw;
  };

  const detectBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
    return 'DÉBITO / CRÉDITO';
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newCardNumber.replace(/\s/g, '');

    if (cleanNum.length < 15) {
      setErrorMsg('Ingresa los 16 dígitos de la tarjeta.');
      return;
    }
    if (newCardHolder.trim().length < 5) {
      setErrorMsg('Ingresa el nombre y apellido del titular.');
      return;
    }
    if (newCardExpiry.length !== 5 || !newCardExpiry.includes('/')) {
      setErrorMsg('Ingresa el vencimiento en formato MM/AA.');
      return;
    }

    const [mesStr, anioStr] = newCardExpiry.split('/');
    const mes = parseInt(mesStr, 10);
    const anio = parseInt(`20${anioStr}`, 10);

    if (isNaN(mes) || mes < 1 || mes > 12) {
      setErrorMsg('El mes de vencimiento debe estar entre 01 y 12.');
      return;
    }
    if (isNaN(anio) || anio < 2026 || (anio === 2026 && mes < 10)) {
      setErrorMsg('La tarjeta ingresada se encuentra vencida.');
      return;
    }
    if (newCardCvv.length < 3) {
      setErrorMsg('Ingresa un CVV válido (3 o 4 dígitos).');
      return;
    }

    const nueva: SavedCard = {
      id: `card-${Date.now()}`,
      brand: detectBrand(newCardNumber),
      numberMasked: `•••• •••• •••• ${cleanNum.slice(-4)}`,
      fullNumber: newCardNumber,
      holder: newCardHolder.toUpperCase(),
      expiry: newCardExpiry,
    };

    const updatedCards = [...tarjetas, nueva];
    setTarjetas(updatedCards);
    localStorage.setItem('fu_saved_cards', JSON.stringify(updatedCards));

    setNewCardNumber('');
    setNewCardHolder('');
    setNewCardExpiry('');
    setNewCardCvv('');
    showTempFeedback('¡Tarjeta registrada exitosamente! Ya puedes seleccionarla al pagar.');
  };

  /* =========================================================
     RENDERIZADO
     ========================================================= */
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="profile-toolbar">
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/cliente/inicio"
              text="Volver al Inicio"
              icon={arrowBackOutline}
              className="profile-back-btn"
            />
          </IonButtons>
          <IonTitle className="profile-title">Mi Cuenta — FaltaUno</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="profile-content">
        <div className="profile-overlay"></div>

        <div className="profile-layout">
          {/* --- MENÚ DE NAVEGACIÓN LATERAL IZQUIERDO --- */}
          <aside className="profile-nav-card">
            <div className="user-avatar-box">
              <div className="avatar-circle">
                {nombre.trim() ? nombre.trim().charAt(0).toUpperCase() : 'U'}
              </div>
              <h3>{nombre || 'Usuario'}</h3>
              <p>{correo || 'Sin correo registrado'}</p>
            </div>

            <div className="profile-tabs-list">
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'datos' ? 'active' : ''}`}
                onClick={() => {
                  setErrorMsg('');
                  setActiveTab('datos');
                }}
              >
                <IonIcon icon={personOutline} />
                <span>Datos Personales</span>
              </button>

              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'reservas' ? 'active' : ''}`}
                onClick={() => {
                  setErrorMsg('');
                  setActiveTab('reservas');
                }}
              >
                <IonIcon icon={calendarOutline} />
                <span>Mis Reservas</span>
              </button>

              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'pagos' ? 'active' : ''}`}
                onClick={() => {
                  setErrorMsg('');
                  setActiveTab('pagos');
                }}
              >
                <IonIcon icon={cardOutline} />
                <span>Métodos de Pago</span>
              </button>
            </div>
          </aside>

          {/* --- PANEL DE CONTENIDO DINÁMICO DERECHO --- */}
          <main className="profile-main-card">
            {feedbackMsg && (
              <div className="profile-alert success">
                <IonIcon icon={checkmarkCircleOutline} />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="profile-alert error">
                <IonIcon icon={alertCircleOutline} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* =========================================================
                SECCIÓN 1: DATOS PERSONALES
                ========================================================= */}
            {activeTab === 'datos' && (
              <form onSubmit={handleSaveProfile} className="tab-section">
                <div className="tab-header">
                  <h2>Datos Personales</h2>
                  <p>Visualiza y actualiza tu información de contacto y contraseña de acceso.</p>
                </div>

                <div className="profile-form-grid">
                  <div className="p-field">
                    <label>Nombre Completo</label>
                    <div className="p-input-box">
                      <IonIcon icon={personOutline} />
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) =>
                          setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 40))
                        }
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                  </div>

                  <div className="p-field">
                    <label>Correo Electrónico</label>
                    <div className="p-input-box">
                      <IonIcon icon={mailOutline} />
                      <input
                        type="text"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="p-field">
                    <label>Teléfono Móvil</label>
                    <div className="p-input-box">
                      <IonIcon icon={callOutline} />
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/[^0-9+ ]/g, ''))}
                        placeholder="+56 9 1234 5678"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                <div className="section-divider"></div>

                <div className="tab-header">
                  <h3>Cambiar Contraseña</h3>
                  <p>Completa estos campos solo si deseas modificar tu clave actual.</p>
                </div>

                <div className="profile-form-grid">
                  <div className="p-field">
                    <label>Contraseña Actual</label>
                    <div className="p-input-box">
                      <IonIcon icon={lockClosedOutline} />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="p-field">
                    <label>Nueva Contraseña</label>
                    <div className="p-input-box">
                      <IonIcon icon={lockClosedOutline} />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                      />
                    </div>
                  </div>

                  <div className="p-field">
                    <label>Confirmar Nueva Contraseña</label>
                    <div className="p-input-box">
                      <IonIcon icon={lockClosedOutline} />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la clave"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-save-profile">
                  <IonIcon icon={saveOutline} />
                  Guardar Cambios
                </button>
              </form>
            )}

            {/* =========================================================
                SECCIÓN 2: MIS RESERVAS
                ========================================================= */}
            {activeTab === 'reservas' && (
              <div className="tab-section">
                <div className="tab-header">
                  <h2>Historial de Mis Reservas</h2>
                  <p>Revisa tus canchas agendadas o solicita la cancelación de un turno.</p>
                </div>

                <div className="reservations-list">
                  {reservas.length === 0 ? (
                    <div className="empty-state-box">
                      <p style={{ color: '#cbd5e1', marginBottom: '14px' }}>
                        Aún no tienes reservas registradas en tu cuenta.
                      </p>
                      <button
                        type="button"
                        className="btn-save-profile"
                        onClick={() => router.push('/cliente/inicio')}
                      >
                        Explorar Canchas
                      </button>
                    </div>
                  ) : (
                    reservas.map((res) => (
                      <div key={res.id} className="res-history-card">
                        <div className="res-card-top">
                          <div>
                            <span className="res-code-tag">{res.codigo}</span>
                            <h4>{res.canchaNombre}</h4>
                          </div>
                          <span
                            className={`res-status-badge ${
                              res.estado === 'Confirmada' ? 'confirmada' : 'pendiente'
                            }`}
                          >
                            {res.estado.toUpperCase()}
                          </span>
                        </div>

                        <div className="res-card-details">
                          <span>
                            <IonIcon icon={calendarOutline} /> {res.fecha}
                          </span>
                          <span>
                            <IonIcon icon={timeOutline} /> {res.horario} hrs
                          </span>
                          <span>
                            <IonIcon icon={cashOutline} /> ${res.monto.toLocaleString('es-CL')}
                          </span>
                          <span>
                            <IonIcon icon={cardOutline} /> {res.tarjetaUsada}
                          </span>
                        </div>

                        {res.motivoCancelacion && (
                          <p className="cancel-reason-note">
                            Motivo de solicitud: &ldquo;{res.motivoCancelacion}&rdquo;
                          </p>
                        )}

                        <div className="res-card-actions">
                          {res.estado === 'Confirmada' ? (
                            <button
                              type="button"
                              className="btn-request-cancel"
                              onClick={() => {
                                setErrorMsg('');
                                setMotivoCancelacion('');
                                setCancelModalReserva(res);
                              }}
                            >
                              <IonIcon icon={closeCircleOutline} />
                              Solicitar Cancelación
                            </button>
                          ) : (
                            <span className="pending-review-text">
                              En revisión por administración para reembolso
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                SECCIÓN 3: MÉTODOS DE PAGO
                ========================================================= */}
            {activeTab === 'pagos' && (
              <div className="tab-section">
                <div className="tab-header">
                  <h2>Mis Métodos de Pago</h2>
                  <p>
                    Registra tus tarjetas de débito o crédito para seleccionarlas rápidamente al pagar una cancha.
                  </p>
                </div>

                {tarjetas.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                    Aún no has guardado ninguna tarjeta. Agrega una en el formulario inferior.
                  </p>
                ) : (
                  <div className="saved-cards-grid">
                    {tarjetas.map((card) => (
                      <div key={card.id} className="saved-card-visual">
                        <div className="saved-card-top">
                          <span className="saved-brand">{card.brand}</span>
                          <button
                            type="button"
                            className="btn-delete-card"
                            onClick={() => setCardToDelete(card)}
                            title="Eliminar tarjeta"
                          >
                            <IonIcon icon={trashOutline} />
                          </button>
                        </div>
                        <div className="saved-number">{card.numberMasked}</div>
                        <div className="saved-card-bottom">
                          <div>
                            <small>TITULAR</small>
                            <p>{card.holder}</p>
                          </div>
                          <div>
                            <small>VENCE</small>
                            <p>{card.expiry}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="section-divider"></div>

                <form onSubmit={handleAddCard} className="add-card-form">
                  <h3>Agregar Nueva Tarjeta</h3>
                  <div className="profile-form-grid">
                    <div className="p-field">
                      <label>Número de Tarjeta</label>
                      <div className="p-input-box">
                        <IonIcon icon={cardOutline} />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="1234 5678 9012 3456"
                          value={newCardNumber}
                          onChange={(e) => setNewCardNumber(formatCardNum(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="p-field">
                      <label>Nombre del Titular</label>
                      <div className="p-input-box">
                        <IonIcon icon={personOutline} />
                        <input
                          type="text"
                          placeholder="EJ: JUAN PÉREZ"
                          value={newCardHolder}
                          onChange={(e) =>
                            setNewCardHolder(
                              e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="p-field">
                      <label>Vencimiento (MM/AA)</label>
                      <div className="p-input-box">
                        <IonIcon icon={calendarOutline} />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/AA"
                          value={newCardExpiry}
                          onChange={(e) => setNewCardExpiry(formatExpiry(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="p-field">
                      <label>CVV</label>
                      <div className="p-input-box">
                        <IonIcon icon={lockClosedOutline} />
                        <input
                          type="password"
                          inputMode="numeric"
                          placeholder="123"
                          value={newCardCvv}
                          onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-save-profile">
                    <IonIcon icon={addCircleOutline} />
                    Guardar Tarjeta
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>

        {/* =========================================================
            MODAL PARA SOLICITAR CANCELACIÓN DE RESERVA
            ========================================================= */}
        {cancelModalReserva && (
          <div className="cancel-modal-backdrop">
            <div className="cancel-modal-box">
              <h3>Solicitar Cancelación</h3>
              <p>
                Estás solicitando cancelar la reserva <strong>{cancelModalReserva.codigo}</strong> en{' '}
                <strong>{cancelModalReserva.canchaNombre}</strong> ({cancelModalReserva.fecha} a las{' '}
                {cancelModalReserva.horario}).
              </p>

              <form onSubmit={handleConfirmCancelRequest}>
                <textarea
                  rows={3}
                  placeholder="Indica el motivo de la cancelación (ej: lesión, cambio de horario, lluvia)..."
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  className="cancel-textarea"
                />

                <div className="cancel-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-secondary"
                    onClick={() => setCancelModalReserva(null)}
                  >
                    Volver
                  </button>
                  <button type="submit" className="btn-modal-danger">
                    Enviar Solicitud
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================
            MODAL PARA CONFIRMAR ELIMINACIÓN DE TARJETA
            ========================================================= */}
        {cardToDelete && (
          <div className="cancel-modal-backdrop">
            <div className="cancel-modal-box">
              <h3>Eliminar Método de Pago</h3>
              <p>
                ¿Estás seguro de que deseas eliminar la tarjeta <strong>{cardToDelete.brand}</strong>{' '}
                terminada en <strong>{cardToDelete.fullNumber.slice(-4)}</strong>?
              </p>
              <div className="cancel-modal-actions">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setCardToDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-modal-danger"
                  onClick={() => {
                    const updated = tarjetas.filter((t) => t.id !== cardToDelete.id);
                    setTarjetas(updated);
                    localStorage.setItem('fu_saved_cards', JSON.stringify(updated));
                    setCardToDelete(null);
                    showTempFeedback('Método de pago eliminado correctamente.');
                  }}
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;