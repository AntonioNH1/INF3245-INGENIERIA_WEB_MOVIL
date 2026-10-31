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

const API_USUARIOS = 'http://localhost:3000/api/usuarios';
const API_METODOS_PAGO = 'http://localhost:3000/api/metodos-pago';

/* =========================================================
   INTERFACES Y TIPOS
   ========================================================= */

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  numberMasked: string;
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
  estado:
    | 'Confirmada'
    | 'Cancelación Solicitada'
    | 'Cancelada'
    | 'Solicitud de cancelación rechazada';
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

  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  /* =========================================================
     ESTADOS: MIS RESERVAS
     ========================================================= */

  const [reservas, setReservas] = useState<UserReservation[]>([]);

  const [cancelModalReserva, setCancelModalReserva] =
    useState<UserReservation | null>(null);

  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  /* =========================================================
     ESTADOS: MÉTODOS DE PAGO
     ========================================================= */

  const [tarjetas, setTarjetas] = useState<SavedCard[]>([]);

  const [cardToDelete, setCardToDelete] =
    useState<SavedCard | null>(null);

  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');

  const [cargandoTarjetas, setCargandoTarjetas] = useState(false);
  const [guardandoTarjeta, setGuardandoTarjeta] = useState(false);
  const [eliminandoTarjeta, setEliminandoTarjeta] = useState(false);

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

  /* =========================================================
     CARGAR MÉTODOS DE PAGO DESDE POSTGRESQL
     ========================================================= */

  useEffect(() => {
    if (activeTab !== 'pagos') return;

    let activo = true;

    const cargarTarjetasDesdeBD = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login', 'root', 'replace');
        return;
      }

      setCargandoTarjetas(true);

      // Eliminar las tarjetas antiguas que se guardaban localmente.
      // A partir de ahora los métodos de pago se consultan en PostgreSQL.
      localStorage.removeItem('fu_saved_cards');

      try {
        const respuesta = await fetch(API_METODOS_PAGO, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje || 'No se pudieron cargar los métodos de pago.'
          );
        }

        if (!Array.isArray(datos)) {
          throw new Error('La respuesta de métodos de pago no es válida.');
        }

        const tarjetasBD: SavedCard[] = datos.map((tarjeta: {
          id: number;
          marca: string;
          ultimos_cuatro: string;
          titular: string;
          vencimiento: string;
        }) => ({
          id: String(tarjeta.id),
          brand: String(tarjeta.marca || ''),
          last4: String(tarjeta.ultimos_cuatro || ''),
          numberMasked: `•••• •••• •••• ${tarjeta.ultimos_cuatro}`,
          holder: String(tarjeta.titular || ''),
          expiry: String(tarjeta.vencimiento || ''),
        }));

        if (activo) {
          setTarjetas(tarjetasBD);
        }
      } catch (error) {
        console.error('Error al cargar métodos de pago:', error);

        if (activo) {
          setTarjetas([]);

          setErrorMsg(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los métodos de pago.'
          );
        }
      } finally {
        if (activo) {
          setCargandoTarjetas(false);
        }
      }
    };

    void cargarTarjetasDesdeBD();

    return () => {
      activo = false;
    };
  }, [activeTab]);

  /* =========================================================
     CARGAR DATOS PERSONALES DESDE POSTGRESQL
     ========================================================= */

  useEffect(() => {
    let activo = true;

    const cargarPerfilDesdeBD = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login', 'root', 'replace');
        return;
      }

      try {
        const respuesta = await fetch(`${API_USUARIOS}/yo`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            data.mensaje || 'No se pudieron cargar tus datos personales.'
          );
        }

        const usuario = data.usuario || data;

        if (!activo) return;

        const nombreBD = String(usuario.nombre || '');
        const correoBD = String(usuario.email || '');
        const telefonoBD = String(usuario.telefono || '');

        setNombre(nombreBD);
        setCorreo(correoBD);
        setTelefono(telefonoBD);

        // Mantener sincronizados los datos utilizados por otras pantallas.
        localStorage.setItem('userName', nombreBD);
        localStorage.setItem('userFullName', nombreBD);
        localStorage.setItem('userEmail', correoBD);
        localStorage.setItem('userPhone', telefonoBD);

        if (usuario.rut) {
          localStorage.setItem('userRut', String(usuario.rut));
        }
      } catch (error) {
        console.error('Error al cargar los datos personales:', error);

        if (activo) {
          setErrorMsg(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar tus datos personales.'
          );
        }
      }
    };

    void cargarPerfilDesdeBD();

    return () => {
      activo = false;
    };
  }, []);

  /* =========================================================
     CARGAR RESERVAS DESDE POSTGRESQL
     ========================================================= */

  useEffect(() => {
    let activo = true;

    const cargarReservasDesdeBD = async () => {
      const token = localStorage.getItem('token');

      if (!token) return;

      try {
        const respuesta = await fetch(
          'http://localhost:3000/api/reservas/mis-reservas',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje || 'No se pudieron cargar tus reservas.'
          );
        }

        if (!Array.isArray(datos)) {
          throw new Error('La respuesta de reservas no es válida.');
        }

        // Recuperar los datos locales para conservar el comprobante,
        // el monto y la tarjeta que ya muestra el perfil.
        let reservasLocales: UserReservation[] = [];

        try {
          const guardadas = localStorage.getItem('fu_user_reservations');
          reservasLocales = guardadas ? JSON.parse(guardadas) : [];
        } catch {
          reservasLocales = [];
        }

        const reservasActualizadas: UserReservation[] = datos.map(
          (reserva: {
            id: number;
            fecha_reserva: string;
            hora_inicio: string;
            hora_fin: string;
            estado: string;
            motivo_cancelacion?: string | null;
            cancha_nombre: string;
            tipo_deporte: string;
            precio_hora: number;
          }) => {
            const reservaLocal = reservasLocales.find(
              (local) =>
                local.id === `res-${reserva.id}` ||
                local.id === String(reserva.id)
            );

            let estado: UserReservation['estado'];

            switch (String(reserva.estado).toLowerCase()) {
              case 'cancelacion_solicitada':
                estado = 'Cancelación Solicitada';
                break;

              case 'cancelada':
                estado = 'Cancelada';
                break;

              case 'cancelacion_rechazada':
                estado = 'Solicitud de cancelación rechazada';
                break;

              default:
                estado = 'Confirmada';
            }

            return {
              id: `res-${reserva.id}`,
              codigo: reservaLocal?.codigo || `FU-${reserva.id}`,
              canchaNombre: reserva.cancha_nombre,
              deporte: reserva.tipo_deporte,
              fecha: String(reserva.fecha_reserva).slice(0, 10),
              horario:
                `${String(reserva.hora_inicio).slice(0, 5)} - ` +
                `${String(reserva.hora_fin).slice(0, 5)}`,
              monto:
                reservaLocal?.monto ?? Number(reserva.precio_hora ?? 0),
              tarjetaUsada: reservaLocal?.tarjetaUsada || 'No registrada',
              estado,
              motivoCancelacion:
                reserva.motivo_cancelacion ||
                reservaLocal?.motivoCancelacion,
            };
          }
        );

        if (activo) {
          setReservas(reservasActualizadas);

          // Sincronizar el almacenamiento local con el estado real
          // recibido de PostgreSQL.
          localStorage.setItem(
            'fu_user_reservations',
            JSON.stringify(reservasActualizadas)
          );
        }
      } catch (error) {
        console.error('Error al sincronizar las reservas:', error);

        if (activo) {
          setErrorMsg(
            'No se pudieron actualizar tus reservas desde el servidor. Intenta recargar la página.'
          );
        }
      }
    };

    void cargarReservasDesdeBD();

    return () => {
      activo = false;
    };
  }, []);

  /* =========================================================
     MENSAJES TEMPORALES
     ========================================================= */

  const showTempFeedback = (msg: string) => {
    setErrorMsg('');
    setFeedbackMsg(msg);

    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  /* =========================================================
     VALIDADORES DE CORREO Y TELÉFONO
     ========================================================= */

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'El correo electrónico es obligatorio.';
    }

    if (email.includes(',')) {
      return 'El correo contiene una coma (,). Por favor, reemplázala por un punto (.).';
    }

    if (email.includes(' ')) {
      return 'El correo no puede contener espacios en blanco.';
    }

    if (!email.includes('@')) {
      return 'Al correo le falta el símbolo "@".';
    }

    const parts = email.split('@');

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return 'Ingresa un correo con formato usuario@dominio.com.';
    }

    if (
      !parts[1].includes('.') ||
      parts[1].startsWith('.') ||
      parts[1].endsWith('.')
    ) {
      return 'El dominio del correo es inválido (ejemplo correcto: @gmail.com o @empresa.cl).';
    }

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return 'El formato del correo electrónico no es válido.';
    }

    return '';
  };

  /* =========================================================
     GUARDAR DATOS PERSONALES Y CONTRASEÑA
     ========================================================= */

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg('');
    setFeedbackMsg('');

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

    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
      setErrorMsg('Ingresa un teléfono válido (entre 9 y 15 números).');
      return;
    }

    // La contraseña es opcional.
    // Si se desea cambiar, deben completarse los tres campos.
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setErrorMsg(
          'Ingresa tu contraseña actual para autorizar el cambio de clave.'
        );
        return;
      }

      if (newPassword.length < 4) {
        setErrorMsg(
          'La nueva contraseña debe tener al menos 4 caracteres.'
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMsg(
          'La nueva contraseña y su confirmación no coinciden.'
        );
        return;
      }
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorMsg('Tu sesión ha expirado. Inicia sesión nuevamente.');
      router.push('/login', 'root', 'replace');
      return;
    }

    setGuardandoPerfil(true);

    try {
      const cuerpo: {
        nombre: string;
        email: string;
        telefono: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        nombre: nombre.trim(),
        email: correo.trim().toLowerCase(),
        telefono: telefono.trim(),
      };

      // Enviar contraseña solo cuando se desea cambiar.
      if (newPassword) {
        cuerpo.currentPassword = currentPassword;
        cuerpo.newPassword = newPassword;
      }

      const respuesta = await fetch(`${API_USUARIOS}/yo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cuerpo),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje || 'No se pudieron guardar tus datos.'
        );
      }

      const usuario = data.usuario || {};

      const nombreGuardado = String(usuario.nombre || cuerpo.nombre);
      const correoGuardado = String(usuario.email || cuerpo.email);
      const telefonoGuardado = String(usuario.telefono || cuerpo.telefono);

      setNombre(nombreGuardado);
      setCorreo(correoGuardado);
      setTelefono(telefonoGuardado);

      // Sincronizar datos usados por SearchCourts y las demás pantallas.
      localStorage.setItem('userName', nombreGuardado);
      localStorage.setItem('userFullName', nombreGuardado);
      localStorage.setItem('userEmail', correoGuardado);
      localStorage.setItem('userPhone', telefonoGuardado);

      // Limpiar campos de contraseña después de guardar.
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showTempFeedback(
        cuerpo.newPassword
          ? 'Tus datos y contraseña se actualizaron correctamente.'
          : 'Tus datos personales se actualizaron correctamente.'
      );
    } catch (error) {
      console.error('Error al guardar el perfil:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar tus datos.'
      );
    } finally {
      setGuardandoPerfil(false);
    }
  };

  /* =========================================================
     SOLICITAR CANCELACIÓN DE RESERVA
     ========================================================= */

  const handleConfirmCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cancelModalReserva) return;

    if (!motivoCancelacion.trim()) {
      setErrorMsg(
        'Por favor indica brevemente el motivo de la cancelación.'
      );
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorMsg('Tu sesión ha expirado. Inicia sesión nuevamente.');
      router.push('/login', 'root');
      return;
    }

    // El ID local tiene el formato "res-1".
    // Extraemos el ID real de PostgreSQL.
    const idLocal = cancelModalReserva.id;
    const idBD = idLocal.replace(/^res-/, '');

    if (!/^\d+$/.test(idBD)) {
      setErrorMsg(
        'No se pudo identificar la reserva en la base de datos. Actualiza la información de la reserva e inténtalo nuevamente.'
      );
      return;
    }

    try {
      setErrorMsg('');

      const respuesta = await fetch(
        `http://localhost:3000/api/reservas/mis-reservas/${idBD}/solicitar-cancelacion`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            motivo: motivoCancelacion.trim(),
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje || 'No se pudo enviar la solicitud.'
        );
      }

      // Actualizar la pantalla solo si el backend confirmó
      // que la solicitud se guardó correctamente.
      const updated = reservas.map((reserva) =>
        reserva.id === cancelModalReserva.id
          ? {
              ...reserva,
              estado: 'Cancelación Solicitada' as const,
              motivoCancelacion: motivoCancelacion.trim(),
            }
          : reserva
      );

      setReservas(updated);

      localStorage.setItem(
        'fu_user_reservations',
        JSON.stringify(updated)
      );

      const codigo = cancelModalReserva.codigo;

      setCancelModalReserva(null);
      setMotivoCancelacion('');

      showTempFeedback(
        `Solicitud enviada para la reserva ${codigo}.`
      );
    } catch (error) {
      console.error('Error al solicitar la cancelación:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al enviar la solicitud.'
      );
    }
  };

  /* =========================================================
     AGREGAR Y ELIMINAR TARJETAS
     ========================================================= */

  const formatCardNum = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);

    return raw.length >= 3
      ? `${raw.slice(0, 2)}/${raw.slice(2, 4)}`
      : raw;
  };

  const detectBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');

    if (clean.startsWith('4')) return 'VISA';

    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) {
      return 'MASTERCARD';
    }

    if (/^3[47]/.test(clean)) return 'AMEX';

    return 'DÉBITO / CRÉDITO';
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg('');
    setFeedbackMsg('');

    const cleanNum = newCardNumber.replace(/\D/g, '');

    if (cleanNum.length !== 15 && cleanNum.length !== 16) {
      setErrorMsg(
        'Ingresa un número de tarjeta válido de 15 o 16 dígitos.'
      );
      return;
    }

    if (newCardHolder.trim().length < 5) {
      setErrorMsg('Ingresa el nombre y apellido del titular.');
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(newCardExpiry)) {
      setErrorMsg('Ingresa el vencimiento en formato MM/AA.');
      return;
    }

    const [mesStr, anioStr] = newCardExpiry.split('/');
    const mes = Number(mesStr);
    const anio = 2000 + Number(anioStr);

    const partesChile = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());

    const anioActual = Number(
      partesChile.find((parte) => parte.type === 'year')?.value
    );

    const mesActual = Number(
      partesChile.find((parte) => parte.type === 'month')?.value
    );

    if (
      !Number.isInteger(mes) ||
      anio < anioActual ||
      (anio === anioActual && mes < mesActual)
    ) {
      setErrorMsg('La tarjeta ingresada se encuentra vencida.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorMsg('Tu sesión ha expirado. Inicia sesión nuevamente.');
      router.push('/login', 'root', 'replace');
      return;
    }

    setGuardandoTarjeta(true);

    try {
      const respuesta = await fetch(API_METODOS_PAGO, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marca: detectBrand(cleanNum),
          ultimos_cuatro: cleanNum.slice(-4),
          titular: newCardHolder.trim().toUpperCase(),
          vencimiento: newCardExpiry,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje || 'No se pudo guardar el método de pago.'
        );
      }

      const tarjeta = data.tarjeta;

      if (!tarjeta || tarjeta.id == null) {
        throw new Error(
          'El servidor no devolvió la tarjeta registrada.'
        );
      }

      const nueva: SavedCard = {
        id: String(tarjeta.id),
        brand: String(tarjeta.marca),
        last4: String(tarjeta.ultimos_cuatro),
        numberMasked: `•••• •••• •••• ${tarjeta.ultimos_cuatro}`,
        holder: String(tarjeta.titular),
        expiry: String(tarjeta.vencimiento),
      };

      setTarjetas((anteriores) => [nueva, ...anteriores]);

      setNewCardNumber('');
      setNewCardHolder('');
      setNewCardExpiry('');

      showTempFeedback('¡Tarjeta registrada exitosamente!');
    } catch (error) {
      console.error('Error al registrar tarjeta:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar la tarjeta.'
      );
    } finally {
      setGuardandoTarjeta(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorMsg('Tu sesión ha expirado. Inicia sesión nuevamente.');
      router.push('/login', 'root', 'replace');
      return;
    }

    setEliminandoTarjeta(true);

    try {
      const respuesta = await fetch(
        `${API_METODOS_PAGO}/${encodeURIComponent(cardToDelete.id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje || 'No se pudo eliminar el método de pago.'
        );
      }

      setTarjetas((anteriores) =>
        anteriores.filter(
          (tarjeta) => tarjeta.id !== cardToDelete.id
        )
      );

      setCardToDelete(null);

      showTempFeedback('Método de pago eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar tarjeta:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar la tarjeta.'
      );
    } finally {
      setEliminandoTarjeta(false);
    }
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

          <IonTitle className="profile-title">
            Mi Cuenta — FaltaUno
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="profile-content">
        <div className="profile-overlay"></div>

        <div className="profile-layout">
          {/* MENÚ DE NAVEGACIÓN LATERAL */}
          <aside className="profile-nav-card">
            <div className="user-avatar-box">
              <div className="avatar-circle">
                {nombre.trim()
                  ? nombre.trim().charAt(0).toUpperCase()
                  : 'U'}
              </div>

              <h3>{nombre || 'Usuario'}</h3>

              <p>{correo || 'Sin correo registrado'}</p>
            </div>

            <div className="profile-tabs-list">
              <button
                type="button"
                className={`profile-tab-btn ${
                  activeTab === 'datos' ? 'active' : ''
                }`}
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
                className={`profile-tab-btn ${
                  activeTab === 'reservas' ? 'active' : ''
                }`}
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
                className={`profile-tab-btn ${
                  activeTab === 'pagos' ? 'active' : ''
                }`}
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

          {/* PANEL DE CONTENIDO */}
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
              <form
                onSubmit={handleSaveProfile}
                className="tab-section"
              >
                <div className="tab-header">
                  <h2>Datos Personales</h2>

                  <p>
                    Visualiza y actualiza tu información de contacto y contraseña de acceso.
                  </p>
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
                          setNombre(
                            e.target.value
                              .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
                              .slice(0, 40)
                          )
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
                        onChange={(e) =>
                          setTelefono(
                            e.target.value.replace(/[^0-9+ ]/g, '')
                          )
                        }
                        placeholder="+56 9 1234 5678"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                <div className="section-divider"></div>

                <div className="tab-header">
                  <h3>Cambiar Contraseña</h3>

                  <p>
                    Completa estos campos solo si deseas modificar tu clave actual.
                  </p>
                </div>

                <div className="profile-form-grid">
                  <div className="p-field">
                    <label>Contraseña Actual</label>

                    <div className="p-input-box">
                      <IonIcon icon={lockClosedOutline} />

                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) =>
                          setCurrentPassword(e.target.value)
                        }
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
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
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
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        placeholder="Repite la clave"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-save-profile"
                  disabled={guardandoPerfil}
                >
                  <IonIcon icon={saveOutline} />

                  {guardandoPerfil
                    ? 'Guardando...'
                    : 'Guardar Cambios'}
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

                  <p>
                    Revisa tus canchas agendadas o solicita la cancelación de un turno.
                  </p>
                </div>

                <div className="reservations-list">
                  {reservas.length === 0 ? (
                    <div className="empty-state-box">
                      <p
                        style={{
                          color: '#cbd5e1',
                          marginBottom: '14px',
                        }}
                      >
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
                      <div
                        key={res.id}
                        className="res-history-card"
                      >
                        <div className="res-card-top">
                          <div>
                            <span className="res-code-tag">
                              {res.codigo}
                            </span>

                            <h4>{res.canchaNombre}</h4>
                          </div>

                          <span
                            className={`res-status-badge ${
                              res.estado === 'Confirmada'
                                ? 'confirmada'
                                : 'pendiente'
                            }`}
                          >
                            {res.estado.toUpperCase()}
                          </span>
                        </div>

                        <div className="res-card-details">
                          <span>
                            <IonIcon icon={calendarOutline} />
                            {' '}{res.fecha}
                          </span>

                          <span>
                            <IonIcon icon={timeOutline} />
                            {' '}{res.horario} hrs
                          </span>

                          <span>
                            <IonIcon icon={cashOutline} />
                            {' '}${res.monto.toLocaleString('es-CL')}
                          </span>

                          <span>
                            <IonIcon icon={cardOutline} />
                            {' '}{res.tarjetaUsada}
                          </span>
                        </div>

                        {res.motivoCancelacion && (
                          <p className="cancel-reason-note">
                            Motivo de solicitud: &ldquo;
                            {res.motivoCancelacion}
                            &rdquo;
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
                          ) : res.estado === 'Cancelación Solicitada' ? (
                            <span className="pending-review-text">
                              En revisión por administración para reembolso
                            </span>
                          ) : res.estado === 'Cancelada' ? (
                            <span className="pending-review-text">
                              Cancelación aprobada por administración
                            </span>
                          ) : (
                            <span className="pending-review-text">
                              La solicitud de cancelación fue rechazada por administración
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

                {cargandoTarjetas ? (
                  <p
                    style={{
                      color: '#94a3b8',
                      fontSize: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    Cargando métodos de pago...
                  </p>
                ) : tarjetas.length === 0 ? (
                  <p
                    style={{
                      color: '#94a3b8',
                      fontSize: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    Aún no has guardado ninguna tarjeta. Agrega una en el formulario inferior.
                  </p>
                ) : (
                  <div className="saved-cards-grid">
                    {tarjetas.map((card) => (
                      <div
                        key={card.id}
                        className="saved-card-visual"
                      >
                        <div className="saved-card-top">
                          <span className="saved-brand">
                            {card.brand}
                          </span>

                          <button
                            type="button"
                            className="btn-delete-card"
                            onClick={() => setCardToDelete(card)}
                            title="Eliminar tarjeta"
                          >
                            <IonIcon icon={trashOutline} />
                          </button>
                        </div>

                        <div className="saved-number">
                          {card.numberMasked}
                        </div>

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

                <form
                  onSubmit={handleAddCard}
                  className="add-card-form"
                >
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
                          onChange={(e) =>
                            setNewCardNumber(
                              formatCardNum(e.target.value)
                            )
                          }
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
                              e.target.value
                                .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
                                .toUpperCase()
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
                          onChange={(e) =>
                            setNewCardExpiry(
                              formatExpiry(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-save-profile"
                    disabled={guardandoTarjeta}
                  >
                    <IonIcon icon={addCircleOutline} />

                    {guardandoTarjeta
                      ? 'Guardando...'
                      : 'Guardar Tarjeta'}
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
                Estás solicitando cancelar la reserva{' '}
                <strong>{cancelModalReserva.codigo}</strong> en{' '}
                <strong>{cancelModalReserva.canchaNombre}</strong>
                {' '}({cancelModalReserva.fecha} a las{' '}
                {cancelModalReserva.horario}).
              </p>

              <form onSubmit={handleConfirmCancelRequest}>
                <textarea
                  rows={3}
                  placeholder="Indica el motivo de la cancelación (ej: lesión, cambio de horario, lluvia)..."
                  value={motivoCancelacion}
                  onChange={(e) =>
                    setMotivoCancelacion(e.target.value)
                  }
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

                  <button
                    type="submit"
                    className="btn-modal-danger"
                  >
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
                ¿Estás seguro de que deseas eliminar la tarjeta{' '}
                <strong>{cardToDelete.brand}</strong>
                {' '}terminada en{' '}
                <strong>{cardToDelete.last4}</strong>?
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
                  onClick={handleDeleteCard}
                  disabled={eliminandoTarjeta}
                >
                  {eliminandoTarjeta
                    ? 'Eliminando...'
                    : 'Sí, Eliminar'}
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