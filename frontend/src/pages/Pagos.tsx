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
   CONFIGURACIÓN DE API
   ========================================================= */
const API_CANCHAS = 'http://localhost:3000/api/canchas';
const API_RESERVAS = 'http://localhost:3000/api/reservas';
const API_METODOS_PAGO = 'http://localhost:3000/api/metodos-pago';

/* =========================================================
   INTERFAZ DE CANCHA
   ========================================================= */
interface CanchaBackend {
  id: number;
  nombre: string;
  tipo_deporte: string;
  precio_hora: number;
  disponible: boolean;
}

/* =========================================================
   FUNCIÓN PARA CALCULAR EL PRECIO
   Mantiene el recargo de $3.000 desde las 19:00.
   ========================================================= */
const calcularMonto = (
  precioBase: number,
  horario: string
): number => {
  const horaInicio = parseInt(
    horario.split(':')[0],
    10
  );

  return !isNaN(horaInicio) && horaInicio >= 19
    ? precioBase + 3000
    : precioBase;
};

/* =========================================================
   FORMATEAR PRECIO
   ========================================================= */
const formatearPrecio = (precio: number): string => {
  return `$${precio.toLocaleString('es-CL')}`;
};

// Obtiene fecha y hora oficial de Chile para coincidir con el backend.
const obtenerFechaHoraChile = () => {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value || '00';

  return {
    fecha: `${obtener('year')}-${obtener('month')}-${obtener('day')}`,
    minutos: Number(obtener('hour')) * 60 + Number(obtener('minute')),
  };
};

// Suma días a una fecha YYYY-MM-DD sin depender de la zona horaria.
const sumarDiasAFecha = (fecha: string, dias: number): string => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

  fechaUTC.setUTCDate(fechaUTC.getUTCDate() + dias);

  const nuevoAnio = fechaUTC.getUTCFullYear();
  const nuevoMes = String(fechaUTC.getUTCMonth() + 1).padStart(2, '0');
  const nuevoDia = String(fechaUTC.getUTCDate()).padStart(2, '0');

  return `${nuevoAnio}-${nuevoMes}-${nuevoDia}`;
};

// Comprobar que la fecha exista realmente.
const esFechaReal = (fecha: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [anio, mes, dia] = fecha.split('-').map(Number);

  const fechaUTC = new Date(
    Date.UTC(anio, mes - 1, dia)
  );

  return (
    fechaUTC.getUTCFullYear() === anio &&
    fechaUTC.getUTCMonth() === mes - 1 &&
    fechaUTC.getUTCDate() === dia
  );
};

// Convertir HH:MM a minutos.
const horaAMinutos = (hora: string): number => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
const Pagos: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Obtener los datos enviados desde CourtSchedule.
  const queryParams = new URLSearchParams(location.search);

  const fechaReserva = queryParams.get('fecha') || '';
  const horarioReserva = queryParams.get('horario') || '';

  const canchaIdNum = Number(id);

  /* =========================================================
     ESTADOS: DATOS DE LA CANCHA
     ========================================================= */

  const [infoCancha, setInfoCancha] =
    useState<CanchaBackend | null>(null);

  const [cargandoCancha, setCargandoCancha] =
    useState(true);

  const [errorCancha, setErrorCancha] = useState('');

  /* =========================================================
     ESTADOS: MÉTODO DE PAGO
     ========================================================= */

  const [savedCards, setSavedCards] =
    useState<SavedCard[]>([]);

  const [selectedCardId, setSelectedCardId] =
    useState<string>('NEW');

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [cargandoTarjetas, setCargandoTarjetas] = useState(false);

  const [ultimosCuatroUsados, setUltimosCuatroUsados] = useState('');

  /* =========================================================
     ESTADOS: CONFIRMACIÓN
     ========================================================= */

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [codigoReserva, setCodigoReserva] = useState('');

  /* =========================================================
     CÁLCULO DEL TOTAL
     Se utiliza el precio real de PostgreSQL.
     ========================================================= */

  const montoTotal = useMemo(() => {
    if (!infoCancha) {
      return 0;
    }

    return calcularMonto(
      Number(infoCancha.precio_hora),
      horarioReserva
    );
  }, [infoCancha, horarioReserva]);

  /* =========================================================
     CARGAR CANCHA DESDE POSTGRESQL
     ========================================================= */

  useEffect(() => {
    let activo = true;

    const cargarCancha = async () => {
      setCargandoCancha(true);
      setErrorCancha('');
      setInfoCancha(null);

      if (
        !Number.isInteger(canchaIdNum) ||
        canchaIdNum <= 0
      ) {
        setErrorCancha(
          'El identificador de la cancha no es válido.'
        );

        setCargandoCancha(false);
        return;
      }

      try {
        const respuesta = await fetch(API_CANCHAS);
        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ||
            'No se pudieron cargar las canchas.'
          );
        }

        if (!Array.isArray(datos)) {
          throw new Error(
            'La respuesta del servidor no es válida.'
          );
        }

        // Buscar la cancha seleccionada por su ID.
        // La API pública entrega las canchas habilitadas.
        const canchaEncontrada = datos.find(
          (cancha: CanchaBackend) =>
            Number(cancha.id) === canchaIdNum
        );

        if (!canchaEncontrada) {
          throw new Error(
            'La cancha seleccionada no existe o fue deshabilitada. Regresa a los horarios y selecciona otra cancha.'
          );
        }

        const canchaNormalizada: CanchaBackend = {
          id: Number(canchaEncontrada.id),
          nombre: String(canchaEncontrada.nombre || ''),
          tipo_deporte: String(
            canchaEncontrada.tipo_deporte || ''
          ),
          precio_hora: Number(
            canchaEncontrada.precio_hora
          ),
          disponible:
            canchaEncontrada.disponible === true ||
            String(canchaEncontrada.disponible).toLowerCase() === 'true',
        };

        if (
          !canchaNormalizada.nombre ||
          !canchaNormalizada.tipo_deporte ||
          !Number.isFinite(canchaNormalizada.precio_hora) ||
          canchaNormalizada.precio_hora <= 0 ||
          !canchaNormalizada.disponible
        ) {
          throw new Error(
            'Los datos de la cancha no son válidos o no está habilitada.'
          );
        }

        if (activo) {
          setInfoCancha(canchaNormalizada);
        }
      } catch (error) {
        console.error(
          'Error al cargar la cancha:',
          error
        );

        if (activo) {
          setErrorCancha(
            error instanceof Error
              ? error.message
              : 'Ocurrió un error al cargar la cancha.'
          );
        }
      } finally {
        if (activo) {
          setCargandoCancha(false);
        }
      }
    };

    void cargarCancha();

    return () => {
      activo = false;
    };
  }, [canchaIdNum]);

  /* =========================================================
     CARGAR TARJETAS DESDE POSTGRESQL
     ========================================================= */

  useEffect(() => {
    let activo = true;

    const cargarTarjetas = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login', 'root', 'replace');
        return;
      }

      setCargandoTarjetas(true);

      // Eliminar el almacenamiento antiguo que contenía
      // números completos de tarjetas.
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
            datos.mensaje || 'No se pudieron cargar las tarjetas guardadas.'
          );
        }

        if (!Array.isArray(datos)) {
          throw new Error(
            'La respuesta de métodos de pago no es válida.'
          );
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

        if (!activo) return;

        setSavedCards(tarjetasBD);

        if (tarjetasBD.length > 0) {
          const primera = tarjetasBD[0];

          setSelectedCardId(primera.id);
          setCardNumber(primera.numberMasked);
          setCardHolder(primera.holder);
          setCardExpiry(primera.expiry);
          setCardCvv('');
        } else {
          setSelectedCardId('NEW');
          setCardNumber('');
          setCardHolder('');
          setCardExpiry('');
          setCardCvv('');
        }
      } catch (error) {
        console.error('Error al cargar tarjetas:', error);

        if (activo) {
          setSavedCards([]);
          setSelectedCardId('NEW');
          setCardNumber('');
          setCardHolder('');
          setCardExpiry('');

          setErrorMsg(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar las tarjetas guardadas.'
          );
        }
      } finally {
        if (activo) {
          setCargandoTarjetas(false);
        }
      }
    };

    void cargarTarjetas();

    return () => {
      activo = false;
    };
  }, [router]);

  /* =========================================================
     SELECCIONAR UNA TARJETA GUARDADA
     ========================================================= */

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

    const found = savedCards.find(
      (card) => card.id === cardId
    );

    if (!found) {
      setErrorMsg('No se encontró la tarjeta seleccionada.');
      setSelectedCardId('NEW');
      return;
    }

    setCardNumber(found.numberMasked);
    setCardHolder(found.holder);
    setCardExpiry(found.expiry);
    setCardCvv('');
  };

  /* =========================================================
     FORMATEAR NÚMERO DE TARJETA
     ========================================================= */

  const handleCardNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedCardId('NEW');

    const rawValue = e.target.value
      .replace(/\D/g, '')
      .slice(0, 16);

    setCardNumber(
      rawValue.replace(/(\d{4})(?=\d)/g, '$1 ')
    );
  };

  /* =========================================================
     FORMATEAR NOMBRE DEL TITULAR
     ========================================================= */

  const handleCardHolderChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedCardId('NEW');

    const cleanName = e.target.value
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .slice(0, 28);

    setCardHolder(cleanName.toUpperCase());
  };

  /* =========================================================
     FORMATEAR FECHA DE VENCIMIENTO
     ========================================================= */

  const handleExpiryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedCardId('NEW');

    let raw = e.target.value
      .replace(/\D/g, '')
      .slice(0, 4);

    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }

    setCardExpiry(raw);
  };

  /* =========================================================
     FORMATEAR CVV
     ========================================================= */

  const handleCvvChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCardCvv(
      e.target.value.replace(/\D/g, '').slice(0, 4)
    );
  };

  /* =========================================================
     DETECTAR MARCA DE TARJETA
     ========================================================= */

  const detectCardBrand = (num: string) => {
    const tarjetaSeleccionada = savedCards.find(
      (card) => card.id === selectedCardId
    );

    if (tarjetaSeleccionada) {
      return tarjetaSeleccionada.brand;
    }

    const clean = num.replace(/\s/g, '');

    if (clean.startsWith('4')) return 'VISA';

    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) {
      return 'MASTERCARD';
    }

    if (/^3[47]/.test(clean)) return 'AMEX';

    return 'TARJETA';
  };

  /* =========================================================
     CONFIRMAR RESERVA
     ========================================================= */

  const handleConfirmPayment = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isProcessing) return;

    setErrorMsg('');

    // Comprobar que la cancha se haya cargado.
    if (cargandoCancha) {
      setErrorMsg(
        'Espera a que se carguen los datos de la cancha.'
      );
      return;
    }

    if (!infoCancha) {
      setErrorMsg(
        errorCancha ||
        'No se encontró la información de la cancha.'
      );
      return;
    }

    /* =====================================================
       VALIDAR FECHA Y HORARIO DE LA RESERVA
       La hora oficial se calcula usando America/Santiago.
       ===================================================== */

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaReserva) ||
      !/^\d{2}:\d{2} - \d{2}:\d{2}$/.test(horarioReserva)
    ) {
      setErrorMsg('La fecha o el horario no son válidos.');
      return;
    }

    const ahoraChile = obtenerFechaHoraChile();
    const fechaMaxima = sumarDiasAFecha(ahoraChile.fecha, 30);

    if (!esFechaReal(fechaReserva)) {
      setErrorMsg('La fecha seleccionada no existe.');
      return;
    }

    if (fechaReserva < ahoraChile.fecha) {
      setErrorMsg('No puedes reservar en fechas pasadas.');
      return;
    }

    if (fechaReserva > fechaMaxima) {
      setErrorMsg(
        'Solo puedes reservar con un máximo de 30 días de anticipación.'
      );
      return;
    }

    const [horaInicioReserva, horaFinReserva] =
      horarioReserva.split(' - ');

    if (
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaInicioReserva) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaFinReserva)
    ) {
      setErrorMsg('El horario seleccionado no es válido.');
      return;
    }

    const inicioMinutos = horaAMinutos(horaInicioReserva);
    const finMinutos = horaAMinutos(horaFinReserva);

    if (
      inicioMinutos < 480 ||
      finMinutos > 1380 ||
      finMinutos - inicioMinutos !== 60 ||
      inicioMinutos % 60 !== 0
    ) {
      setErrorMsg(
        'El horario debe ser un bloque de una hora entre las 08:00 y las 23:00, comenzando en una hora exacta.'
      );
      return;
    }

    if (
      fechaReserva === ahoraChile.fecha &&
      inicioMinutos <= ahoraChile.minutos
    ) {
      setErrorMsg(
        'Este horario ya comenzó o ya pasó. Regresa y selecciona otro.'
      );
      return;
    }

    /* =====================================================
       VALIDAR TARJETA GUARDADA O NUEVA
       ===================================================== */

    const tarjetaGuardada = selectedCardId === 'NEW'
      ? undefined
      : savedCards.find((card) => card.id === selectedCardId);

    if (selectedCardId !== 'NEW' && !tarjetaGuardada) {
      setErrorMsg(
        'La tarjeta seleccionada ya no está disponible. Recarga la página.'
      );
      return;
    }

    let cleanCardNum = '';
    let ultimosCuatroParaReserva = '';

    if (tarjetaGuardada) {
      // Las tarjetas guardadas solo contienen los últimos cuatro dígitos.
      if (!/^\d{4}$/.test(tarjetaGuardada.last4)) {
        setErrorMsg('Los datos de la tarjeta guardada no son válidos.');
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(tarjetaGuardada.expiry)) {
        setErrorMsg('El vencimiento de la tarjeta guardada no es válido.');
        return;
      }

      const [mesGuardadoStr, anioGuardadoStr] =
        tarjetaGuardada.expiry.split('/');

      const mesGuardado = Number(mesGuardadoStr);
      const anioGuardado = 2000 + Number(anioGuardadoStr);

      const [anioActualGuardado, mesActualGuardado] =
        ahoraChile.fecha.split('-').slice(0, 2).map(Number);

      if (
        mesGuardado < 1 ||
        mesGuardado > 12 ||
        anioGuardado < anioActualGuardado ||
        (anioGuardado === anioActualGuardado &&
          mesGuardado < mesActualGuardado)
      ) {
        setErrorMsg(
          'La tarjeta seleccionada se encuentra vencida. Registra otro método de pago.'
        );
        return;
      }

      ultimosCuatroParaReserva = tarjetaGuardada.last4;
    } else {
      // Validar una tarjeta nueva ingresada para esta simulación.
      cleanCardNum = cardNumber.replace(/\s/g, '');

      if (cleanCardNum.length !== 15 && cleanCardNum.length !== 16) {
        setErrorMsg('Ingresa un número de tarjeta válido de 15 o 16 dígitos.');
        return;
      }

      if (cardHolder.trim().length < 5) {
        setErrorMsg('Ingresa el nombre y apellido del titular.');
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setErrorMsg('Ingresa la fecha de vencimiento en formato MM/AA.');
        return;
      }

      const [mesStr, anioStr] = cardExpiry.split('/');

      const mes = Number(mesStr);
      const anio = 2000 + Number(anioStr);

      const [anioActual, mesActual] =
        ahoraChile.fecha.split('-').slice(0, 2).map(Number);

      if (
        mes < 1 ||
        mes > 12 ||
        anio < anioActual ||
        (anio === anioActual && mes < mesActual)
      ) {
        setErrorMsg(
          'La tarjeta ingresada se encuentra vencida o tiene un vencimiento inválido.'
        );
        return;
      }

      ultimosCuatroParaReserva = cleanCardNum.slice(-4);
    }

    // El CVV se valida solo para esta simulación.
    // Nunca se almacena ni se envía a los endpoints del backend.
    if (!/^\d{3,4}$/.test(cardCvv)) {
      setErrorMsg(
        'Ingresa el código de seguridad (CVV) de 3 o 4 dígitos.'
      );
      return;
    }

    // Comprobar sesión.
    const token = localStorage.getItem('token');

    if (!token) {
      setErrorMsg(
        'Debes iniciar sesión para confirmar la reserva.'
      );

      router.push('/login', 'root');
      return;
    }

    // Separar hora de inicio y hora de término.
    const [horaInicio, horaFin] = horarioReserva
      .split(' - ')
      .map((hora) => hora.trim());

    if (!horaInicio || !horaFin) {
      setErrorMsg(
        'El horario seleccionado no es válido.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      /* =================================================
         VOLVER A CONSULTAR LA CANCHA
         Para comprobar que siga habilitada y que
         el precio no haya cambiado.
         ================================================= */

      const respuestaCanchas = await fetch(API_CANCHAS);
      const datosCanchas = await respuestaCanchas.json();

      if (!respuestaCanchas.ok) {
        throw new Error(
          datosCanchas.mensaje ||
          'No se pudo verificar nuevamente la cancha.'
        );
      }

      if (!Array.isArray(datosCanchas)) {
        throw new Error(
          'La respuesta del servidor no es válida.'
        );
      }

      const canchaActual = datosCanchas.find(
        (cancha: CanchaBackend) =>
          Number(cancha.id) === canchaIdNum
      );

      // Comprobar que todavía exista y esté habilitada.
      if (!canchaActual) {
        throw new Error(
          'La cancha ya no está habilitada para reservar. Regresa a los horarios y selecciona otra.'
        );
      }

      const precioActual = Number(
        canchaActual.precio_hora
      );

      if (
        !Number.isFinite(precioActual) ||
        precioActual <= 0
      ) {
        throw new Error(
          'El precio actual de la cancha no es válido.'
        );
      }

      // Si cambió el precio, actualizar el resumen
      // y pedir al usuario que revise antes de continuar.
      if (precioActual !== Number(infoCancha.precio_hora)) {
        setInfoCancha({
          id: Number(canchaActual.id),
          nombre: String(canchaActual.nombre),
          tipo_deporte: String(canchaActual.tipo_deporte),
          precio_hora: precioActual,
          disponible: true,
        });

        throw new Error(
          'El precio de esta cancha fue actualizado. Revisa el nuevo monto antes de confirmar nuevamente.'
        );
      }

      // Usar los datos actuales de la cancha.
      const canchaConfirmada: CanchaBackend = {
        id: Number(canchaActual.id),
        nombre: String(canchaActual.nombre),
        tipo_deporte: String(canchaActual.tipo_deporte),
        precio_hora: precioActual,
        disponible: true,
      };

      const montoConfirmado = calcularMonto(
        canchaConfirmada.precio_hora,
        horarioReserva
      );

      /* =================================================
         REGISTRAR RESERVA EN POSTGRESQL
         El backend vuelve a comprobar la disponibilidad.
         ================================================= */

      const respuestaReserva = await fetch(
        API_RESERVAS,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cancha_id: canchaConfirmada.id,
            fecha_reserva: fechaReserva,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
          }),
        }
      );

      const data = await respuestaReserva.json();

      if (!respuestaReserva.ok) {
        throw new Error(
          data.mensaje ||
          'No se pudo registrar la reserva.'
        );
      }

      // Comprobar que el backend haya devuelto
      // el identificador de la reserva creada.
      const reservaId = data?.reserva?.id;

      if (!reservaId) {
        throw new Error(
          'El servidor no devolvió el identificador de la reserva.'
        );
      }

      /* =================================================
         GENERAR COMPROBANTE
         ================================================= */

      const randomCode = `FU-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      const nuevaReserva: UserReservation = {
        id: `res-${reservaId}`,
        codigo: randomCode,
        canchaNombre: canchaConfirmada.nombre,
        deporte: canchaConfirmada.tipo_deporte,
        fecha: fechaReserva,
        horario: horarioReserva,
        monto: montoConfirmado,
        tarjetaUsada: `•••• ${ultimosCuatroParaReserva}`,
        estado: 'Confirmada',
      };

      /* =================================================
         MANTENER HISTORIAL LOCAL DEL PERFIL
         La reserva principal ya fue guardada en PostgreSQL.
         ================================================= */

      try {
        const existingStr = localStorage.getItem(
          'fu_user_reservations'
        );

        const existingList: UserReservation[] =
          existingStr
            ? JSON.parse(existingStr)
            : [];

        const historial = Array.isArray(existingList)
          ? existingList
          : [];

        localStorage.setItem(
          'fu_user_reservations',
          JSON.stringify([
            nuevaReserva,
            ...historial,
          ])
        );

      } catch (error) {
        // Un problema con el historial local no debe
        // invalidar una reserva que ya se guardó en PostgreSQL.
        console.warn(
          'No se pudo actualizar el historial local:',
          error
        );
      }

      // Actualizar los datos de la cancha.
      setInfoCancha(canchaConfirmada);
      setCodigoReserva(randomCode);
      setUltimosCuatroUsados(ultimosCuatroParaReserva);
      setErrorMsg('');

      // Mostrar comprobante.
      setShowSuccessModal(true);

    } catch (error) {
      console.error(
        'Error al confirmar la reserva:',
        error
      );

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al registrar la reserva.'
      );

    } finally {
      setIsProcessing(false);
    }
  };

  /* =========================================================
     MOSTRAR CARGA O ERROR DE CANCHA
     ========================================================= */

  const canchaLista = !cargandoCancha && infoCancha !== null;

  /* =========================================================
     RENDERIZADO
     ========================================================= */

  return (
    <IonPage>

      {/* ENCABEZADO */}
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

          <IonTitle className="pago-title">
            Confirmar y Pagar Reserva
          </IonTitle>

        </IonToolbar>
      </IonHeader>

      {/* CONTENIDO */}
      <IonContent
        fullscreen
        className="pago-content"
      >
        <div className="pago-overlay"></div>

        <div className="pago-layout">

          {/* COLUMNA IZQUIERDA */}
          <div className="pago-left-col">

            {/* RESUMEN DE RESERVA */}
            <div className="pago-glass-card">

              <div className="section-header">
                <IonIcon icon={receiptOutline} />
                <h3>Resumen de tu Reserva</h3>
              </div>

              <div className="summary-details">

                {/* ESTADO DE CARGA */}
                {cargandoCancha && (
                  <div className="pago-error-banner">
                    Consultando información de la cancha...
                  </div>
                )}

                {/* ERROR DE CARGA */}
                {!cargandoCancha && errorCancha && (
                  <div className="pago-error-banner">
                    <IonIcon icon={alertCircleOutline} />
                    <span>{errorCancha}</span>
                  </div>
                )}

                {/* CANCHA */}
                <div className="summary-row">
                  <span className="summary-label">
                    <IonIcon icon={footballOutline} />
                    Cancha
                  </span>

                  <span className="summary-value">
                    {infoCancha?.nombre || 'No disponible'}
                  </span>
                </div>

                {/* DEPORTE */}
                <div className="summary-row">
                  <span className="summary-label">
                    Deporte
                  </span>

                  <span className="summary-value">
                    {infoCancha?.tipo_deporte || 'No disponible'}
                  </span>
                </div>

                {/* FECHA */}
                <div className="summary-row">
                  <span className="summary-label">
                    <IonIcon icon={calendarOutline} />
                    Fecha
                  </span>

                  <span className="summary-value">
                    {fechaReserva || 'No indicada'}
                  </span>
                </div>

                {/* HORARIO */}
                <div className="summary-row">
                  <span className="summary-label">
                    <IonIcon icon={timeOutline} />
                    Horario
                  </span>

                  <span className="summary-value">
                    {horarioReserva || 'No indicado'} hrs
                  </span>
                </div>

                <div className="summary-divider"></div>

                {/* TOTAL */}
                <div className="summary-total-row">
                  <span>Total a Pagar</span>

                  <span className="total-amount">
                    {formatearPrecio(montoTotal)}
                  </span>
                </div>

                {infoCancha && (
                  <p style={{
                    fontSize: '12px',
                    opacity: 0.75,
                    marginTop: '8px',
                  }}>
                    Precio obtenido desde el registro
                    de la cancha en el sistema.
                  </p>
                )}

              </div>
            </div>

            {/* VISTA PREVIA DE TARJETA */}
            <div className="credit-card-preview">

              <div className="card-top-row">
                <div className="card-chip"></div>

                <span className="card-brand">
                  {detectCardBrand(cardNumber)}
                </span>
              </div>

              <div className="card-number-display">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              <div className="card-bottom-row">

                <div className="card-meta-block">
                  <span className="meta-label">
                    TITULAR
                  </span>

                  <span className="meta-value">
                    {cardHolder || 'NOMBRE DEL TITULAR'}
                  </span>
                </div>

                <div className="card-meta-block">
                  <span className="meta-label">
                    VENCE
                  </span>

                  <span className="meta-value">
                    {cardExpiry || 'MM/AA'}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="pago-right-col">

            <form
              className="pago-glass-card form-card"
              onSubmit={handleConfirmPayment}
            >

              <div className="section-header">
                <IonIcon icon={lockClosedOutline} />
                <h3>Método de Pago</h3>
              </div>

              {/* TARJETAS GUARDADAS */}
              {cargandoTarjetas && (
                <p className="selector-title">
                  Cargando métodos de pago...
                </p>
              )}

              {savedCards.length > 0 && (
                <div className="saved-cards-selector">

                  <label className="selector-title">
                    Seleccionar tarjeta guardada
                  </label>

                  <div className="saved-pills-row">

                    {savedCards.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        className={`saved-card-pill ${
                          selectedCardId === sc.id
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          handleSelectSavedCard(sc.id)
                        }
                        disabled={!canchaLista || isProcessing || cargandoTarjetas}
                      >
                        <IonIcon icon={cardOutline} />

                        <span>
                          {sc.brand} •••• {sc.last4}
                        </span>
                      </button>
                    ))}

                    <button
                      type="button"
                      className={`saved-card-pill ${
                        selectedCardId === 'NEW'
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        handleSelectSavedCard('NEW')
                      }
                      disabled={!canchaLista || isProcessing || cargandoTarjetas}
                    >
                      + Otra tarjeta
                    </button>

                  </div>
                </div>
              )}

              {/* MENSAJE DE ERROR */}
              {(errorMsg || errorCancha) && (
                <div className="pago-error-banner">
                  <IonIcon icon={alertCircleOutline} />

                  <span>
                    {errorMsg || errorCancha}
                  </span>
                </div>
              )}

              {/* NÚMERO DE TARJETA */}
              <div className="form-field">

                <label>Número de Tarjeta</label>

                <div className="field-input-wrapper">
                  <IonIcon
                    icon={cardOutline}
                    className="field-icon"
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="field-input"
                    disabled={
                      !canchaLista ||
                      isProcessing ||
                      cargandoTarjetas ||
                      selectedCardId !== 'NEW'
                    }
                  />
                </div>
              </div>

              {/* TITULAR */}
              <div className="form-field">

                <label>Nombre del Titular</label>

                <div className="field-input-wrapper">
                  <IonIcon
                    icon={personOutline}
                    className="field-icon"
                  />

                  <input
                    type="text"
                    placeholder="Ej: ANTONIO NAVARRO"
                    value={cardHolder}
                    onChange={handleCardHolderChange}
                    className="field-input"
                    disabled={
                      !canchaLista ||
                      isProcessing ||
                      cargandoTarjetas ||
                      selectedCardId !== 'NEW'
                    }
                  />
                </div>
              </div>

              {/* VENCIMIENTO Y CVV */}
              <div className="form-row-split">

                <div className="form-field">

                  <label>Vencimiento</label>

                  <div className="field-input-wrapper">
                    <IonIcon
                      icon={calendarOutline}
                      className="field-icon"
                    />

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="field-input"
                      disabled={
                        !canchaLista ||
                        isProcessing ||
                        cargandoTarjetas ||
                        selectedCardId !== 'NEW'
                      }
                    />
                  </div>
                </div>

                <div className="form-field">

                  <label>CVV (Confirmación)</label>

                  <div className="field-input-wrapper">
                    <IonIcon
                      icon={shieldCheckmarkOutline}
                      className="field-icon"
                    />

                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="123"
                      value={cardCvv}
                      onChange={handleCvvChange}
                      className="field-input"
                      disabled={!canchaLista || isProcessing}
                    />
                  </div>
                </div>
              </div>

              {/* BOTÓN DE CONFIRMACIÓN */}
              <button
                type="submit"
                className="btn-confirmar-pago"
                disabled={
                  !canchaLista ||
                  isProcessing ||
                  cargandoCancha ||
                  cargandoTarjetas
                }
              >
                {isProcessing
                  ? 'PROCESANDO...'
                  : `SIMULAR PAGO ${formatearPrecio(montoTotal)} Y CONFIRMAR`}
              </button>

              {!canchaLista && !cargandoCancha && (
                <p style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  marginTop: '12px',
                }}>
                  No es posible continuar sin una cancha habilitada.
                </p>
              )}

            </form>
          </div>
        </div>

        {/* =================================================
           MODAL DE RESERVA EXITOSA
           ================================================= */}

        {showSuccessModal && (

          <div className="success-modal-backdrop">

            <div className="success-modal-box">

              <div className="success-icon-badge">
                <IonIcon icon={checkmarkCircle} />
              </div>

              <h2>
                ¡Reserva registrada con éxito!
              </h2>

              <p className="success-subtitle">
                Tu reserva quedó registrada correctamente
                y aparecerá en la sección Mis Reservas.
              </p>

              {/* COMPROBANTE */}
              <div className="receipt-box">

                <div className="receipt-item">
                  <span>Código de Reserva</span>
                  <strong>{codigoReserva}</strong>
                </div>

                <div className="receipt-item">
                  <span>Cancha</span>
                  <strong>
                    {infoCancha?.nombre}
                  </strong>
                </div>

                <div className="receipt-item">
                  <span>Deporte</span>
                  <strong>
                    {infoCancha?.tipo_deporte}
                  </strong>
                </div>

                <div className="receipt-item">
                  <span>Fecha y Hora</span>
                  <strong>
                    {fechaReserva} ({horarioReserva})
                  </strong>
                </div>

                <div className="receipt-item">
                  <span>Tarjeta</span>
                  <strong>
                    •••• {ultimosCuatroUsados}
                  </strong>
                </div>

                <div className="receipt-item total">
                  <span>Monto</span>
                  <strong>
                    {formatearPrecio(montoTotal)}
                  </strong>
                </div>
              </div>

              {/* BOTONES */}
              <div style={{
                display: 'flex',
                gap: '10px',
              }}>

                <button
                  type="button"
                  className="btn-volver-inicio"
                  style={{ background: '#0f172a' }}
                  onClick={() => {
                    setShowSuccessModal(false);

                    router.push(
                      '/cliente/perfil?tab=reservas',
                      'root',
                      'replace'
                    );
                  }}
                >
                  Ver Mis Reservas
                </button>

                <button
                  type="button"
                  className="btn-volver-inicio"
                  onClick={() => {
                    setShowSuccessModal(false);

                    router.push(
                      '/cliente/inicio',
                      'root',
                      'replace'
                    );
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