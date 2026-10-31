import { createPortal } from 'react-dom';
import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import {
  menuOutline,
  closeOutline,
  eyeOutline,
  logOutOutline,
  gridOutline,
} from 'ionicons/icons';

import './AdminCalendar.css';

interface Reserva {
  id: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  usuario_nombre: string;
  usuario_email: string;
  cancha_nombre: string;
  tipo_deporte: string;
  motivo_cancelacion?: string | null;
}

// Formatear fecha para mostrar día/mes/año
const formatearFecha = (fecha: string) => {
  if (!fecha) return 'Fecha no disponible';

  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

// Mostrar las horas sin segundos
const formatearHora = (hora: string) => {
  return hora ? hora.slice(0, 5) : '--:--';
};

// Normalizar estados provenientes de PostgreSQL
const normalizarEstado = (estado: string) =>
  String(estado || '').trim().toLowerCase();

// Convertir los estados técnicos en textos legibles
const mostrarEstado = (estado: string) => {
  switch (normalizarEstado(estado)) {
    case 'confirmada':
      return 'Confirmada';

    case 'cancelacion_solicitada':
      return 'Cancelación solicitada';

    case 'cancelada':
      return 'Cancelada';

    case 'cancelacion_rechazada':
      return 'Solicitud rechazada';

    default:
      return estado || 'Sin estado';
  }
};

// Asignar una clase CSS según el estado
const claseEstado = (estado: string) => {
  switch (normalizarEstado(estado)) {
    case 'confirmada':
      return 'confirmada';

    case 'cancelacion_solicitada':
      return 'solicitud-pendiente';

    case 'cancelada':
      return 'cancelada';

    case 'cancelacion_rechazada':
      return 'solicitud-rechazada';

    default:
      return 'desconocido';
  }
};

const AdminCalendar: React.FC = () => {
  const router = useIonRouter();

  // Estados principales
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');
  const [resolviendoId, setResolviendoId] = useState<number | null>(null);

  // Estados del menú hamburguesa
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera o presionar Escape
  useEffect(() => {
  if (!menuAbierto) return;

  const cerrarAlHacerClicFuera = (event: PointerEvent) => {
    const objetivo = event.target;

    if (!(objetivo instanceof Node)) return;

    const clicEnBoton =
      menuRef.current?.contains(objetivo);

    const clicEnMenu =
      menuDropdownRef.current?.contains(objetivo);

    if (!clicEnBoton && !clicEnMenu) {
      setMenuAbierto(false);
    }
  };

  const cerrarConEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMenuAbierto(false);
    }
  };

  document.addEventListener(
    'pointerdown',
    cerrarAlHacerClicFuera
  );

  document.addEventListener(
    'keydown',
    cerrarConEscape
  );

  return () => {
    document.removeEventListener(
      'pointerdown',
      cerrarAlHacerClicFuera
    );

    document.removeEventListener(
      'keydown',
      cerrarConEscape
    );
  };
}, [menuAbierto]);

  // Filtrar reservas según la fecha seleccionada
  const reservasFiltradas = fechaFiltro
    ? reservas.filter(
        (reserva) =>
          reserva.fecha_reserva.slice(0, 10) === fechaFiltro
      )
    : reservas;

  // Calcular estadísticas del panel
  const totalConfirmadas = reservas.filter(
    (reserva) =>
      normalizarEstado(reserva.estado) === 'confirmada'
  ).length;

  const totalSolicitudes = reservas.filter(
    (reserva) =>
      normalizarEstado(reserva.estado) === 'cancelacion_solicitada'
  ).length;

  const totalCanceladas = reservas.filter(
    (reserva) =>
      normalizarEstado(reserva.estado) === 'cancelada'
  ).length;

  // Cargar reservas desde PostgreSQL
  useEffect(() => {
    let activo = true;

    const cargarReservas = async () => {
      const token = localStorage.getItem('token');

      const rol = (localStorage.getItem('userRol') || '')
        .trim()
        .toLowerCase();

      // Verificar que el usuario sea administrador
      if (
        !token ||
        !['admin', 'administrador'].includes(rol)
      ) {
        router.push('/login', 'root');
        return;
      }

      try {
        setError('');

        const respuesta = await fetch(
          'http://localhost:3000/api/reservas',
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
          if (respuesta.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_logged_in');
            localStorage.removeItem('userRol');
            localStorage.removeItem('userId');

            router.push('/login', 'root');
            return;
          }

          throw new Error(
            datos.mensaje ||
              'No se pudieron cargar las reservas.'
          );
        }

        if (!Array.isArray(datos)) {
          throw new Error(
            'La respuesta del servidor no es válida.'
          );
        }

        if (activo) {
          setReservas(datos);
        }
      } catch (err) {
        console.error('Error al cargar reservas:', err);

        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'Ocurrió un error al cargar las reservas.'
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    void cargarReservas();

    return () => {
      activo = false;
    };
  }, [router]);

  // Aprobar o rechazar solicitudes de cancelación
  const resolverSolicitud = async (
    id: number,
    decision: 'aprobar' | 'rechazar'
  ) => {
    const accion =
      decision === 'aprobar'
        ? 'aprobar la cancelación'
        : 'rechazar la solicitud';

    const confirmado = window.confirm(
      `¿Confirmas que deseas ${accion}?`
    );

    if (!confirmado) return;

    const token = localStorage.getItem('token');

    const rol = (localStorage.getItem('userRol') || '')
      .trim()
      .toLowerCase();

    if (
      !token ||
      !['admin', 'administrador'].includes(rol)
    ) {
      router.push('/login', 'root');
      return;
    }

    setResolviendoId(id);
    setError('');
    setMensajeAccion('');

    try {
      const respuesta = await fetch(
        `http://localhost:3000/api/reservas/${id}/resolver-cancelacion`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ decision }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
            'No se pudo procesar la solicitud.'
        );
      }

      // Actualizar el estado de la reserva en pantalla
      setReservas((anteriores) =>
        anteriores.map((reserva) =>
          reserva.id === id
            ? {
                ...reserva,
                estado: datos.reserva.estado,
              }
            : reserva
        )
      );

      setMensajeAccion(
        datos.mensaje ||
          'La solicitud se procesó correctamente.'
      );
    } catch (err) {
      console.error(
        'Error al resolver la solicitud:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al procesar la solicitud.'
      );
    } finally {
      setResolviendoId(null);
    }
  };

  // Abrir el sitio principal de FaltaUno
  // sin cerrar la sesión administrativa
  const verSitioComoUsuario = () => {
    setMenuAbierto(false);
    router.push('/cliente/inicio', 'forward');
  };

  const irAdministrarCanchas = () => {
  setMenuAbierto(false);
  router.push('/admin/canchas', 'forward');
};

  // Cerrar sesión y limpiar los datos de autenticación
  const cerrarSesion = () => {
    setMenuAbierto(false);

    [
      'token',
      'userName',
      'userEmail',
      'userPhone',
      'userRol',
      'userId',
      'user_logged_in',
    ].forEach((clave) => {
      localStorage.removeItem(clave);
    });

    router.push('/login', 'root');
  };

  return (
    <IonPage className="admin-page">

      {/* ENCABEZADO Y MENÚ DE ADMINISTRACIÓN */}
<IonHeader className="admin-header ion-no-border">
  <IonToolbar className="admin-toolbar">

    <IonTitle className="admin-toolbar-title">
      FaltaUno — Administración
    </IonTitle>

    {/* BOTÓN HAMBURGUESA */}
    <div
      className="admin-toolbar-menu"
      ref={menuRef}
    >
      <button
        type="button"
        className="admin-menu-trigger"
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-haspopup="menu"
        aria-expanded={menuAbierto}
        onClick={() => setMenuAbierto((abierto) => !abierto)}
      >
        <IonIcon
          icon={menuAbierto ? closeOutline : menuOutline}
        />
      </button>
    </div>

  </IonToolbar>
</IonHeader>

{/* MENÚ DESPLEGABLE FUERA DE IONTOOLBAR */}
{menuAbierto &&
  createPortal(
    <div
      className="admin-menu-dropdown"
      ref={menuDropdownRef}
      role="menu"
    >
      <div className="admin-menu-heading">
        <span>Menú de administración</span>
        <small>Accesos rápidos</small>
      </div>

{/* ADMINISTRAR CANCHAS */}
<button
  type="button"
  className="admin-menu-item"
  role="menuitem"
  onClick={irAdministrarCanchas}
>
  <IonIcon icon={gridOutline} />

  <span>
    <strong>Administrar canchas</strong>
    <small>Crear, editar y gestionar canchas</small>
  </span>
</button>


      {/* VER SITIO COMO USUARIO */}
      <button
        type="button"
        className="admin-menu-item"
        role="menuitem"
        onClick={verSitioComoUsuario}
      >
        <IonIcon icon={eyeOutline} />

        <span>
          <strong>Ver sitio como usuario</strong>
          <small>Ir a la página principal</small>
        </span>
      </button>

      {/* CERRAR SESIÓN */}
      <button
        type="button"
        className="admin-menu-item admin-menu-logout"
        role="menuitem"
        onClick={cerrarSesion}
      >
        <IonIcon icon={logOutOutline} />

        <span>
          <strong>Cerrar sesión</strong>
          <small>Salir de la cuenta administrativa</small>
        </span>
      </button>
    </div>,
    document.body
  )
}

      {/* CONTENIDO PRINCIPAL */}
      <IonContent className="admin-content">

        <div className="admin-overlay" />

        <main className="admin-layout">

          {/* TÍTULO DEL PANEL */}
          <section className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">
                PANEL DE CONTROL
              </span>

              <h1>Calendario de reservas</h1>

              <p>
                Consulta las reservas y gestiona las solicitudes de cancelación.
              </p>
            </div>

            <div className="admin-heading-count">
              <span>Reservas registradas</span>
              <strong>{reservas.length}</strong>
            </div>
          </section>

          {/* TARJETAS DE ESTADÍSTICAS */}
          <section
            className="admin-stats-grid"
            aria-label="Resumen de reservas"
          >
            <article className="admin-stat-card stat-total">
              <span className="admin-stat-label">
                Total de reservas
              </span>

              <strong className="admin-stat-value">
                {reservas.length}
              </strong>

              <span className="admin-stat-caption">
                Registros en el sistema
              </span>
            </article>

            <article className="admin-stat-card stat-confirmed">
              <span className="admin-stat-label">
                Confirmadas
              </span>

              <strong className="admin-stat-value">
                {totalConfirmadas}
              </strong>

              <span className="admin-stat-caption">
                Reservas activas
              </span>
            </article>

            <article className="admin-stat-card stat-pending">
              <span className="admin-stat-label">
                Cancelaciones pendientes
              </span>

              <strong className="admin-stat-value">
                {totalSolicitudes}
              </strong>

              <span className="admin-stat-caption">
                Requieren revisión
              </span>
            </article>

            <article className="admin-stat-card stat-cancelled">
              <span className="admin-stat-label">
                Canceladas
              </span>

              <strong className="admin-stat-value">
                {totalCanceladas}
              </strong>

              <span className="admin-stat-caption">
                Solicitudes aprobadas
              </span>
            </article>
          </section>

          {/* MENSAJE DE ÉXITO */}
          {mensajeAccion && (
            <div
              className="admin-alert admin-alert-success"
              role="status"
            >
              {mensajeAccion}
            </div>
          )}

          {/* MENSAJE DE ERROR */}
          {error && (
            <div
              className="admin-alert admin-alert-error"
              role="alert"
            >
              <span>{error}</span>

              <IonButton
                className="admin-retry-button"
                fill="outline"
                size="small"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </IonButton>
            </div>
          )}

          {/* FILTRO DE RESERVAS */}
          <section className="admin-filter-panel">

            <div className="admin-filter-copy">
              <h2>Buscar reservas</h2>

              <p>
                Selecciona una fecha para filtrar los turnos registrados.
              </p>
            </div>

            <div className="admin-filter-controls">
              <label htmlFor="admin-fecha-filtro">
                Fecha de la reserva
              </label>

              <input
                id="admin-fecha-filtro"
                className="admin-date-input"
                type="date"
                value={fechaFiltro}
                onChange={(e) =>
                  setFechaFiltro(e.target.value)
                }
              />

              <IonButton
                className="admin-clear-filter"
                fill="clear"
                size="small"
                onClick={() => setFechaFiltro('')}
              >
                Mostrar todas
              </IonButton>
            </div>
          </section>

          {/* LISTADO DE RESERVAS */}
          <section className="admin-reservations-section">

            <div className="admin-section-heading">
              <div>
                <h2>Reservas registradas</h2>

                <p>
                  {fechaFiltro
                    ? `Resultados para ${formatearFecha(fechaFiltro)}`
                    : 'Listado general de reservas'}
                </p>
              </div>

              <span className="admin-results-count">
                {reservasFiltradas.length}{' '}
                {reservasFiltradas.length === 1
                  ? 'reserva'
                  : 'reservas'}
              </span>
            </div>

            {/* CARGANDO */}
            {cargando && (
              <div className="admin-state-card">
                <IonSpinner />
                <p>Cargando reservas...</p>
              </div>
            )}

            {/* SIN RESERVAS REGISTRADAS */}
            {!cargando &&
              !error &&
              reservas.length === 0 && (
                <div className="admin-state-card">
                  <h3>Aún no hay reservas</h3>

                  <p>
                    Cuando los clientes registren una reserva, aparecerá en este panel.
                  </p>
                </div>
              )}

            {/* SIN RESULTADOS PARA LA FECHA */}
            {!cargando &&
              !error &&
              reservas.length > 0 &&
              reservasFiltradas.length === 0 && (
                <div className="admin-state-card">
                  <h3>No hay reservas para esta fecha</h3>

                  <p>
                    Prueba con otro día o selecciona “Mostrar todas”.
                  </p>
                </div>
              )}

            {/* LISTA DE RESERVAS */}
            {!cargando &&
              !error &&
              reservasFiltradas.length > 0 && (
                <IonList className="admin-reservation-list">

                  {reservasFiltradas.map((reserva) => {
                    const estado = normalizarEstado(
                      reserva.estado
                    );

                    const solicitudPendiente =
                      estado === 'cancelacion_solicitada';

                    return (
                      <IonItem
                        key={reserva.id}
                        lines="none"
                        className="admin-reservation-item"
                      >
                        <IonLabel className="ion-text-wrap admin-reservation-label">

                          {/* ENCABEZADO DE LA RESERVA */}
                          <div className="admin-reservation-top">

                            <div className="admin-reservation-title-group">
                              <span className="admin-reservation-code">
                                RESERVA #{reserva.id}
                              </span>

                              <h3>
                                {reserva.cancha_nombre}
                              </h3>
                            </div>

                            <span
                              className={`admin-status-badge ${claseEstado(
                                reserva.estado
                              )}`}
                            >
                              {mostrarEstado(reserva.estado)}
                            </span>
                          </div>

                          {/* INFORMACIÓN DE LA RESERVA */}
                          <div className="admin-reservation-info">

                            <div className="admin-info-cell">
                              <span className="admin-info-label">
                                Deporte
                              </span>

                              <strong>
                                {reserva.tipo_deporte}
                              </strong>
                            </div>

                            <div className="admin-info-cell">
                              <span className="admin-info-label">
                                Fecha
                              </span>

                              <strong>
                                {formatearFecha(
                                  reserva.fecha_reserva
                                )}
                              </strong>
                            </div>

                            <div className="admin-info-cell">
                              <span className="admin-info-label">
                                Horario
                              </span>

                              <strong>
                                {formatearHora(reserva.hora_inicio)} –{' '}
                                {formatearHora(reserva.hora_fin)}
                              </strong>
                            </div>

                            <div className="admin-info-cell">
                              <span className="admin-info-label">
                                Cliente
                              </span>

                              <strong>
                                {reserva.usuario_nombre}
                              </strong>
                            </div>

                            <div className="admin-info-cell admin-info-email">
                              <span className="admin-info-label">
                                Correo electrónico
                              </span>

                              <strong>
                                {reserva.usuario_email}
                              </strong>
                            </div>

                          </div>

                          {/* MOTIVO DE CANCELACIÓN */}
                          {reserva.motivo_cancelacion && (
                            <div className="admin-cancellation-reason">
                              <strong>
                                Motivo de cancelación
                              </strong>

                              <p>
                                {reserva.motivo_cancelacion}
                              </p>
                            </div>
                          )}

                          {/* BOTONES DE APROBACIÓN Y RECHAZO */}
                          {solicitudPendiente && (
                            <div className="admin-reservation-actions">

                              <p>
                                Esta solicitud está pendiente de revisión.
                              </p>

                              <div className="admin-action-buttons">

                                <IonButton
                                  className="admin-action-button admin-approve-button"
                                  size="small"
                                  disabled={
                                    resolviendoId === reserva.id
                                  }
                                  onClick={() =>
                                    resolverSolicitud(
                                      reserva.id,
                                      'aprobar'
                                    )
                                  }
                                >
                                  {resolviendoId === reserva.id
                                    ? 'Procesando...'
                                    : 'Aprobar cancelación'}
                                </IonButton>

                                <IonButton
                                  className="admin-action-button admin-reject-button"
                                  size="small"
                                  disabled={
                                    resolviendoId === reserva.id
                                  }
                                  onClick={() =>
                                    resolverSolicitud(
                                      reserva.id,
                                      'rechazar'
                                    )
                                  }
                                >
                                  Rechazar solicitud
                                </IonButton>

                              </div>
                            </div>
                          )}

                        </IonLabel>
                      </IonItem>
                    );
                  })}

                </IonList>
              )}

          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default AdminCalendar;