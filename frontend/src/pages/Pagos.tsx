/* =========================================================
   IMPORTACIONES
   ========================================================= */
import React, { useState, useMemo, useEffect } from 'react';
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
  calendarOutline,
  timeOutline,
  lockClosedOutline,
  cardOutline,
  personOutline,
  shieldCheckmarkOutline,
  checkmarkCircle,
  alertCircleOutline,
  footballOutline,
  receiptOutline,
} from 'ionicons/icons';
import { useParams, useLocation } from 'react-router-dom';
import type { SavedCard, UserReservation } from './Profile';
import './Pagos.css';

/* =========================================================
   CATÁLOGO DE CANCHAS Y PRECIOS BASE
   ========================================================= */
const COURTS_CATALOG: Record<number, { nombre: string; deporte: string; precioBase: number }> = {
  1: { nombre: 'Cancha Sintética 1 (Techada)', deporte: 'Fútbol 7', precioBase: 25000 },
  2: { nombre: 'Cancha Sintética 2 (Iluminada)', deporte: 'Fútbol 7', precioBase: 22000 },
  3: { nombre: 'Cancha Sintética 3 (Sur)', deporte: 'Fútbol 7', precioBase: 20000 },
  4: { nombre: 'Estadio Principal Grass', deporte: 'Fútbol 11', precioBase: 45000 },
  5: { nombre: 'Cancha Oficial Norte', deporte: 'Fútbol 11', precioBase: 40000 },
  6: { nombre: 'Cancha Pádel Panorámica 1', deporte: 'Pádel', precioBase: 18000 },
  7: { nombre: 'Cancha Pádel Blindex 2', deporte: 'Pádel', precioBase: 16000 },
  8: { nombre: 'Cancha Pádel Indoor 3', deporte: 'Pádel', precioBase: 20000 },
  9: { nombre: 'Cancha Central Arcilla', deporte: 'Tenis', precioBase: 14000 },
  10: { nombre: 'Cancha Rápida 2', deporte: 'Tenis', precioBase: 12000 },
  11: { nombre: 'Cancha Arcilla 3', deporte: 'Tenis', precioBase: 12000 },
  12: { nombre: 'Gimnasio Parquet Principal', deporte: 'Básquetbol', precioBase: 22000 },
  13: { nombre: 'Cancha Multiuso Techada', deporte: 'Básquetbol', precioBase: 16000 },
  14: { nombre: 'Cancha Arena Profesional 1', deporte: 'Voleibol', precioBase: 15000 },
  15: { nombre: 'Gimnasio Voleibol Indoor', deporte: 'Voleibol', precioBase: 18000 },
  16: { nombre: 'Mesa Profesional 1 (Salón VIP)', deporte: 'Ping Pong', precioBase: 6000 },
  17: { nombre: 'Mesa Profesional 2 (Salón General)', deporte: 'Ping Pong', precioBase: 5000 },
  18: { nombre: 'Mesa Profesional 3 (Salón General)', deporte: 'Ping Pong', precioBase: 5000 },
};

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
const Pagos: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const fechaReserva = queryParams.get('fecha') || '2026-10-28';
  const horarioReserva = queryParams.get('horario') || '18:00 - 19:00';

  const canchaIdNum = parseInt(id || '1', 10);
  const infoCancha = COURTS_CATALOG[canchaIdNum] || COURTS_CATALOG[1];

  const montoTotal = useMemo(() => {
    const horaInicio = parseInt(horarioReserva.split(':')[0], 10);
    return !isNaN(horaInicio) && horaInicio >= 19
      ? infoCancha.precioBase + 3000
      : infoCancha.precioBase;
  }, [horarioReserva, infoCancha]);

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('NEW');

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [codigoReserva, setCodigoReserva] = useState('');

  /* =========================================================
     CARGAR TARJETAS GUARDADAS DEL PERFIL
     ========================================================= */
  useEffect(() => {
    const raw = localStorage.getItem('fu_saved_cards');
    if (raw) {
      const parsed: SavedCard[] = JSON.parse(raw);
      setSavedCards(parsed);
      if (parsed.length > 0) {
        setSelectedCardId(parsed[0].id);
        setCardNumber(parsed[0].fullNumber);
        setCardHolder(parsed[0].holder);
        setCardExpiry(parsed[0].expiry);
      }
    }
  }, []);

  const handleSelectSavedCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setErrorMsg('');
    if (cardId === 'NEW') {
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvv('');
      return;
    }
    const found = savedCards.find((c) => c.id === cardId);
    if (found) {
      setCardNumber(found.fullNumber);
      setCardHolder(found.holder);
      setCardExpiry(found.expiry);
      setCardCvv('');
    }
  };

  /* =========================================================
     FORMATEADORES Y VALIDACIÓN DE PAGO
     ========================================================= */
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCardId('NEW');
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(rawValue.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCardId('NEW');
    const cleanName = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 28);
    setCardHolder(cleanName.toUpperCase());
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCardId('NEW');
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setCardExpiry(raw);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
  };

  const detectCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
    if (/^3[47]/.test(clean)) return 'AMEX';
    return 'TARJETA';
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCardNum = cardNumber.replace(/\s/g, '');
    const [mesStr, anioStr] = cardExpiry.split('/');
    const mes = parseInt(mesStr, 10);
    const anio = parseInt(`20${anioStr}`, 10);

    if (cleanCardNum.length < 15) {
      setErrorMsg('Ingresa un número de tarjeta válido (16 dígitos).');
      return;
    }

    if (cardHolder.trim().length < 5) {
      setErrorMsg('Ingresa el nombre y apellido del titular.');
      return;
    }

    if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
      setErrorMsg('Ingresa la fecha de vencimiento en formato MM/AA.');
      return;
    }

    if (cardCvv.length < 3) {
      setErrorMsg('Ingresa el código de seguridad (CVV) de tu tarjeta para confirmar.');
      return;
    }

    if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
      setErrorMsg('Ingresa la fecha de vencimiento en formato MM/AA.');
      return;
    }

    if (mes < 1 || mes > 12) {
      setErrorMsg('El mes de vencimiento debe estar entre 01 y 12.');
      return;
    }

    if (anio < 2026 || (anio === 2026 && mes < 10)) {
      setErrorMsg('La tarjeta ingresada se encuentra vencida.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);

    const randomCode = `FU-${Math.floor(100000 + Math.random() * 900000)}`;

    const nuevaReserva: UserReservation = {
      id: `res-${Date.now()}`,
      codigo: randomCode,
      canchaNombre: infoCancha.nombre,
      deporte: infoCancha.deporte,
      fecha: fechaReserva,
      horario: horarioReserva,
      monto: montoTotal,
      tarjetaUsada: `•••• ${cleanCardNum.slice(-4)}`,
      estado: 'Confirmada',
    };

    const existingStr = localStorage.getItem('fu_user_reservations');
    const existingList: UserReservation[] = existingStr ? JSON.parse(existingStr) : [];
    localStorage.setItem('fu_user_reservations', JSON.stringify([nuevaReserva, ...existingList]));

    setTimeout(() => {
      setCodigoReserva(randomCode);
      setIsProcessing(false);
      setShowSuccessModal(true);
    }, 800);
  };

  /* =========================================================
     RENDERIZADO
     ========================================================= */
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="pago-toolbar">
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/cliente/inicio"
              text="Volver"
              icon={arrowBackOutline}
              className="pago-back-btn"
            />
          </IonButtons>
          <IonTitle className="pago-title">Confirmar y Pagar Reserva</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="pago-content">
        <div className="pago-overlay"></div>

        <div className="pago-layout">
          <div className="pago-left-col">
            <div className="pago-glass-card">
              <div className="section-header">
                <IonIcon icon={receiptOutline} />
                <h3>Resumen de tu Reserva</h3>
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span className="summary-label">
                    <IonIcon icon={footballOutline} /> Cancha
                  </span>
                  <span className="summary-value">{infoCancha.nombre}</span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">
                    <IonIcon icon={calendarOutline} /> Fecha
                  </span>
                  <span className="summary-value">{fechaReserva}</span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">
                    <IonIcon icon={timeOutline} /> Horario
                  </span>
                  <span className="summary-value">{horarioReserva} hrs</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-total-row">
                  <span>Total a Pagar</span>
                  <span className="total-amount">${montoTotal.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            <div className="credit-card-preview">
              <div className="card-top-row">
                <div className="card-chip"></div>
                <span className="card-brand">{detectCardBrand(cardNumber)}</span>
              </div>

              <div className="card-number-display">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              <div className="card-bottom-row">
                <div className="card-meta-block">
                  <span className="meta-label">TITULAR</span>
                  <span className="meta-value">{cardHolder || 'NOMBRE DEL TITULAR'}</span>
                </div>
                <div className="card-meta-block">
                  <span className="meta-label">VENCE</span>
                  <span className="meta-value">{cardExpiry || 'MM/AA'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pago-right-col">
            <form className="pago-glass-card form-card" onSubmit={handleConfirmPayment}>
              <div className="section-header">
                <IonIcon icon={lockClosedOutline} />
                <h3>Método de Pago</h3>
              </div>

              {savedCards.length > 0 && (
                <div className="saved-cards-selector">
                  <label className="selector-title">Seleccionar tarjeta guardada</label>
                  <div className="saved-pills-row">
                    {savedCards.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        className={`saved-card-pill ${selectedCardId === sc.id ? 'active' : ''}`}
                        onClick={() => handleSelectSavedCard(sc.id)}
                      >
                        <IonIcon icon={cardOutline} />
                        <span>
                          {sc.brand} •••• {sc.fullNumber.slice(-4)}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`saved-card-pill ${selectedCardId === 'NEW' ? 'active' : ''}`}
                      onClick={() => handleSelectSavedCard('NEW')}
                    >
                      + Otra tarjeta
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="pago-error-banner">
                  <IonIcon icon={alertCircleOutline} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-field">
                <label>Número de Tarjeta</label>
                <div className="field-input-wrapper">
                  <IonIcon icon={cardOutline} className="field-icon" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Nombre del Titular</label>
                <div className="field-input-wrapper">
                  <IonIcon icon={personOutline} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Ej: ANTONIO NAVARRO"
                    value={cardHolder}
                    onChange={handleCardHolderChange}
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-row-split">
                <div className="form-field">
                  <label>Vencimiento</label>
                  <div className="field-input-wrapper">
                    <IonIcon icon={calendarOutline} className="field-icon" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="field-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>CVV (Confirmación)</label>
                  <div className="field-input-wrapper">
                    <IonIcon icon={shieldCheckmarkOutline} className="field-icon" />
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="123"
                      value={cardCvv}
                      onChange={handleCvvChange}
                      className="field-input"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-confirmar-pago" disabled={isProcessing}>
                {isProcessing
                  ? 'PROCESANDO PAGO...'
                  : `PAGAR $${montoTotal.toLocaleString('es-CL')} Y CONFIRMAR`}
              </button>
            </form>
          </div>
        </div>

        {showSuccessModal && (
          <div className="success-modal-backdrop">
            <div className="success-modal-box">
              <div className="success-icon-badge">
                <IonIcon icon={checkmarkCircle} />
              </div>

              <h2>¡Pago Ejecutado con Éxito!</h2>
              <p className="success-subtitle">
                Tu cancha ha sido reservada y ya aparece disponible en la sección Mis Reservas.
              </p>

              <div className="receipt-box">
                <div className="receipt-item">
                  <span>Código de Reserva</span>
                  <strong>{codigoReserva}</strong>
                </div>
                <div className="receipt-item">
                  <span>Cancha</span>
                  <strong>{infoCancha.nombre}</strong>
                </div>
                <div className="receipt-item">
                  <span>Fecha y Hora</span>
                  <strong>
                    {fechaReserva} ({horarioReserva})
                  </strong>
                </div>
                <div className="receipt-item">
                  <span>Tarjeta</span>
                  <strong>•••• {cardNumber.slice(-4)}</strong>
                </div>
                <div className="receipt-item total">
                  <span>Monto Pagado</span>
                  <strong>${montoTotal.toLocaleString('es-CL')}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-volver-inicio"
                  style={{ background: '#0f172a' }}
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/cliente/perfil?tab=reservas', 'root', 'replace');
                  }}
                >
                  Ver Mis Reservas
                </button>
                <button
                  type="button"
                  className="btn-volver-inicio"
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/cliente/inicio', 'root', 'replace');
                  }}
                >
                  Ir al Inicio
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Pagos;