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
  useIonRouter,
  useIonViewWillEnter
} from '@ionic/react';
import {
  menuOutline,
  closeOutline,
  eyeOutline,
  logOutOutline,
  gridOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons';

import './AdminCalendar.css';
import emailjs from '@emailjs/browser';

// URL actualizada a V1 (Exigencia EP2)
const API_URL = 'http://localhost:3000/api/v1/reservas';

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

const formatearFecha = (fecha: string) => {
  if (!fecha) return 'Fecha no disponible';
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

const formatearHora = (hora: string) => hora ? hora.slice(0, 5) : '--:--';
const normalizarEstado = (estado: string) => String(estado || '').trim().toLowerCase();

const mostrarEstado = (estado: string) => {
  switch (normalizarEstado(estado)) {
    case 'confirmada': return 'Confirmada';
    case 'cancelacion_solicitada': return 'Cancelación solicitada';
    case 'cancelada': return 'Cancelada';
    case 'cancelacion_rechazada': return 'Solicitud rechazada';
    default: return estado || 'Sin estado';
  }
};

const claseEstado = (estado: string) => {
  switch (normalizarEstado(estado)) {
    case 'confirmada': return 'confirmada';
    case 'cancelacion_solicitada': return 'solicitud-pendiente';
    case 'cancelada': return 'cancelada';
    case 'cancelacion_rechazada': return 'solicitud-rechazada';
    default: return 'desconocido';
  }
};

const AdminCalendar: React.FC = () => {
  const router = useIonRouter();

    // Controlar la actualización del calendario al volver a ingresar
  const [recargaPorEntrada, setRecargaPorEntrada] = useState(0);
  const primeraEntrada = useRef(true);

    // Actualizar información cada vez que se vuelve a entrar al calendario
  useIonViewWillEnter(() => {
    // La primera carga ya la realiza el useEffect
    if (primeraEntrada.current) {
      primeraEntrada.current = false;
      return;
    }

    // En las siguientes entradas se vuelven a consultar las reservas
    setRecargaPorEntrada((anterior) => anterior + 1);
  });

  // PEGAR ESTA FUNCIÓN JUSTO ARRIBA DE: const AdminCalendar: React.FC = () => {

const enviarNotificacionReembolso = async (reservaAprobada: Reserva) => {
  try {
    const templateParams = {
      to_email: reservaAprobada.usuario_email, 
      to_name: reservaAprobada.usuario_nombre,
      cancha: reservaAprobada.cancha_nombre,
      fecha: formatearFecha(reservaAprobada.fecha_reserva),
      horario: `${formatearHora(reservaAprobada.hora_inicio)} - ${formatearHora(reservaAprobada.hora_fin)}`,
      mensaje_reembolso: "Tu solicitud de cancelación ha sido aprobada. Se realizará el reembolso de tu dinero dentro de 24 horas hábiles solo si aplica (las cancelaciones realizadas a última hora o fuera del plazo mínimo establecido por el recinto no están sujetas a devolución)."
    };

    await emailjs.send(
      'service_f87jd0c', 
      'template_q990hmw', 
      templateParams,
      'cSuY7Qpek6E40r4WM' 
    );
    console.log('✉️ Correo de reembolso enviado al cliente.');
  } catch (error) {
    console.error('Error al enviar el correo de reembolso:', error);
  }
};
  
  // Estados para Reservas y Paginación (Exigencia EP2)
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const limitePorPagina = 10; // 10 reservas máximo por página

  const [fechaFiltro, setFechaFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [deporteFiltro, setDeporteFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');
  const [resolviendoId, setResolviendoId] = useState<number | null>(null);

  // Stats
  const [stats, setStats] = useState({ confirmadas: 0, pendientes: 0, canceladas: 0 });

  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrarAlHacerClicFuera = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node) || menuDropdownRef.current?.contains(e.target as Node)) return;
      setMenuAbierto(false);
    };
    const cerrarConEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAbierto(false); };
    
    document.addEventListener('pointerdown', cerrarAlHacerClicFuera);
    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.removeEventListener('pointerdown', cerrarAlHacerClicFuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [menuAbierto]);

  // Cargar reservas paginadas desde el Backend
  useEffect(() => {
    let activo = true;
    const cargarReservas = async () => {
      const token = localStorage.getItem('token');
      const rol = (localStorage.getItem('userRol') || '').trim().toLowerCase();

      if (!token || !['admin', 'administrador'].includes(rol)) {
  router.push('/login', 'root');
  return;
}

      try {
        setCargando(true);
        setError('');
        
        // Petición al backend V1 incluyendo paginación en la URL
        const parametros = new URLSearchParams({
  page: String(paginaActual),
  limit: String(limitePorPagina),
});

if (estadoFiltro) {
  parametros.set('estado', estadoFiltro);
}

if (fechaFiltro) {
  parametros.set('fecha', fechaFiltro);
}

if (deporteFiltro) {
  parametros.set('deporte', deporteFiltro);
}

const url = `${API_URL}?${parametros.toString()}`;
        
        const respuesta = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.mensaje || 'Error al cargar reservas.');

        if (activo) {
          // El backend ahora devuelve { reservas: [...], paginacion: { total: X, ... } }
          setReservas(datos.reservas || []);
          setTotalRegistros(datos.paginacion?.total || 0);

          // Calcular stats rápidos solo de esta página (o podrías pedirle al backend que los mande)
          const conf = (datos.reservas || []).filter((r: Reserva) => normalizarEstado(r.estado) === 'confirmada').length;
          const pend = (datos.reservas || []).filter((r: Reserva) => normalizarEstado(r.estado) === 'cancelacion_solicitada').length;
          const canc = (datos.reservas || []).filter((r: Reserva) => normalizarEstado(r.estado) === 'cancelada').length;
          setStats({ confirmadas: conf, pendientes: pend, canceladas: canc });
        }
      } catch (err) {
        if (activo) setError(err instanceof Error ? err.message : 'Error interno.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargarReservas();
    return () => { activo = false; };
  }, [
  router,
  paginaActual,
  recargaPorEntrada,
  estadoFiltro,
  fechaFiltro,
  deporteFiltro
]);

  const reservasFiltradas = reservas;

  const totalPaginas = Math.ceil(totalRegistros / limitePorPagina);

const resolverSolicitud = async (id: number, decision: 'aprobar' | 'rechazar') => {
    if (!window.confirm(`¿Deseas ${decision} la cancelación?`)) return;
    const token = localStorage.getItem('token');
    
    try {
      setResolviendoId(id);
      const respuesta = await fetch(`${API_URL}/${id}/resolver-cancelacion`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.mensaje);

      if (decision === 'aprobar') {
        const reservaCancelada = reservas.find(r => r.id === id);
        if (reservaCancelada) {
          await enviarNotificacionReembolso(reservaCancelada);
        }
      }

      setReservas((prev) => prev.map((r) => r.id === id ? { ...r, estado: datos.reserva.estado } : r));
      setMensajeAccion(datos.mensaje);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar.');
    } finally {
      setResolviendoId(null);
    }
  };

  return (
    <IonPage className="admin-page">
      <IonHeader className="admin-header ion-no-border">
        <IonToolbar className="admin-toolbar">
          <IonTitle className="admin-toolbar-title">FaltaUno — Administración</IonTitle>
          <div className="admin-toolbar-menu" ref={menuRef}>
            <button className="admin-menu-trigger" onClick={() => setMenuAbierto(!menuAbierto)}>
              <IonIcon icon={menuAbierto ? closeOutline : menuOutline} />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      {menuAbierto && createPortal(
        <div className="admin-menu-dropdown" ref={menuDropdownRef}>
          <div className="admin-menu-heading"><span>Menú Admin</span><small>Accesos rápidos</small></div>
          <button className="admin-menu-item" onClick={() => { setMenuAbierto(false); router.push('/admin/canchas', 'forward'); }}>
            <IonIcon icon={gridOutline} /><span><strong>Administrar canchas</strong><small>Crear, editar, etc.</small></span>
          </button>
          <button className="admin-menu-item" onClick={() => { setMenuAbierto(false); router.push('/cliente/inicio', 'forward'); }}>
            <IonIcon icon={eyeOutline} /><span><strong>Ver sitio cliente</strong></span>
          </button>
          <button className="admin-menu-item admin-menu-logout" onClick={() => { localStorage.clear(); router.push('/login', 'root'); }}>
            <IonIcon icon={logOutOutline} /><span><strong>Cerrar sesión</strong></span>
          </button>
        </div>,
        document.body
      )}

      <IonContent className="admin-content">
        <div className="admin-overlay" />
        <main className="admin-layout">
          
          <section className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">Panel de Control</span>
              <h1>Calendario de Reservas</h1>
            </div>
            <div className="admin-heading-count">
              <span>Registros Totales</span>
              <strong>{totalRegistros}</strong>
            </div>
          </section>

          <section className="admin-stats-grid">
            <article className="admin-stat-card stat-total">
              <span className="admin-stat-label">Mostrando</span>
              <strong className="admin-stat-value">{reservas.length}</strong>
              <span className="admin-stat-caption">En esta página</span>
            </article>
            <article className="admin-stat-card stat-confirmed">
              <span className="admin-stat-label">Confirmadas</span>
              <strong className="admin-stat-value">{stats.confirmadas}</strong>
            </article>
            <article className="admin-stat-card stat-pending">
              <span className="admin-stat-label">Pendientes</span>
              <strong className="admin-stat-value">{stats.pendientes}</strong>
            </article>
            <article className="admin-stat-card stat-cancelled">
              <span className="admin-stat-label">Canceladas</span>
              <strong className="admin-stat-value">{stats.canceladas}</strong>
            </article>
          </section>

          {mensajeAccion && <div className="admin-alert admin-alert-success">{mensajeAccion}</div>}
          {error && <div className="admin-alert admin-alert-error">{error}</div>}

          <section className="admin-filter-panel">
  <div className="admin-filter-copy">
    <h2>Filtros de Reservas</h2>
    <p>
      Busca reservas por estado, fecha y deporte.
      Puedes combinar los filtros.
    </p>
  </div>

  <div className="admin-filter-controls">

    {/* FILTRO POR ESTADO */}
    <select
      className="admin-filter-select"
      value={estadoFiltro}
      aria-label="Filtrar por estado"
      onChange={(e) => {
        setEstadoFiltro(e.target.value);
        setPaginaActual(1);
      }}
    >
      <option value="">Todos los estados</option>
      <option value="confirmada">Confirmadas</option>
      <option value="cancelacion_solicitada">
        Cancelación solicitada
      </option>
      <option value="cancelada">Canceladas</option>
      <option value="cancelacion_rechazada">
        Cancelación rechazada
      </option>
    </select>

    {/* FILTRO POR FECHA */}
    <input
      type="date"
      className="admin-date-input"
      value={fechaFiltro}
      aria-label="Filtrar por fecha"
      onChange={(e) => {
        setFechaFiltro(e.target.value);
        setPaginaActual(1);
      }}
    />

    {/* FILTRO POR DEPORTE */}
    <select
      className="admin-filter-select"
      value={deporteFiltro}
      aria-label="Filtrar por deporte"
      onChange={(e) => {
        setDeporteFiltro(e.target.value);
        setPaginaActual(1);
      }}
    >
      <option value="">Todos los deportes</option>
      <option value="Fútbol 7">Fútbol 7</option>
      <option value="Fútbol 11">Fútbol 11</option>
      <option value="Pádel">Pádel</option>
      <option value="Tenis">Tenis</option>
      <option value="Básquetbol">Básquetbol</option>
      <option value="Voleibol">Voleibol</option>
      <option value="Ping Pong">Ping Pong</option>
    </select>

    {/* LIMPIAR TODOS LOS FILTROS */}
    <IonButton
      className="admin-clear-filter"
      fill="clear"
      onClick={() => {
        setEstadoFiltro('');
        setFechaFiltro('');
        setDeporteFiltro('');
        setPaginaActual(1);
      }}
    >
      Limpiar filtros
    </IonButton>

  </div>
</section>

          <section className="admin-reservations-section">
            <div className="admin-section-heading">
              <h2>Listado de Reservas (Pág. {paginaActual})</h2>
            </div>

            {cargando ? (
              <div className="admin-state-card"><IonSpinner /> <p>Cargando...</p></div>
            ) : reservasFiltradas.length === 0 ? (
              <div className="admin-state-card"><h3>Sin resultados</h3><p>No hay reservas en esta página.</p></div>
            ) : (
              <IonList className="admin-reservation-list">
                {reservasFiltradas.map((r) => (
                  <IonItem key={r.id} className="admin-reservation-item">
                    <IonLabel className="admin-reservation-label">
                      <div className="admin-reservation-top">
                        <div className="admin-reservation-title-group">
                          <span className="admin-reservation-code">ID: {r.id}</span>
                          <h3>{r.cancha_nombre}</h3>
                        </div>
                        <span className={`admin-status-badge ${claseEstado(r.estado)}`}>{mostrarEstado(r.estado)}</span>
                      </div>

                      <div className="admin-reservation-info">
                        <div className="admin-info-cell">
                          <span className="admin-info-label">Deporte/Fecha</span>
                          <strong>{r.tipo_deporte} <br/> {formatearFecha(r.fecha_reserva)}</strong>
                        </div>
                        <div className="admin-info-cell">
                          <span className="admin-info-label">Horario</span>
                          <strong>{formatearHora(r.hora_inicio)} - {formatearHora(r.hora_fin)}</strong>
                        </div>
                        <div className="admin-info-cell">
                          <span className="admin-info-label">Cliente</span>
                          <strong>{r.usuario_nombre} <br/> {r.usuario_email}</strong>
                        </div>
                      </div>

                      {normalizarEstado(r.estado) === 'cancelacion_solicitada' && (
                        <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                          <p style={{color: '#fbbf24', fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0'}}>MOTIVO: {r.motivo_cancelacion}</p>
                          <div style={{display: 'flex', gap: '10px'}}>
                            <button className="admin-page-btn" style={{background: '#10b981', color: 'white', border: 'none'}} onClick={() => resolverSolicitud(r.id, 'aprobar')}>Aprobar</button>
                            <button className="admin-page-btn" style={{background: 'transparent', color: '#ef4444', border: '1px solid #ef4444'}} onClick={() => resolverSolicitud(r.id, 'rechazar')}>Rechazar</button>
                          </div>
                        </div>
                      )}
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}

            {/* CONTROLES DE PAGINACIÓN */}
            {!cargando && totalPaginas > 1 && (
              <div className="admin-pagination-controls">
                <span className="admin-pagination-info">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <div className="admin-pagination-buttons">
                  <button 
                    className="admin-page-btn" 
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(prev => prev - 1)}
                  >
                    <IonIcon icon={chevronBackOutline} /> Anterior
                  </button>
                  <button 
                    className="admin-page-btn" 
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(prev => prev + 1)}
                  >
                    Siguiente <IonIcon icon={chevronForwardOutline} />
                  </button>
                </div>
              </div>
            )}

          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default AdminCalendar;