import React, { useCallback, useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner,
  useIonRouter
} from '@ionic/react';
import {
  addOutline,
  createOutline,
  trashOutline,
  powerOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';

import './AdminCourts.css';

// URL ACTUALIZADA AL V1 PARA QUE FUNCIONE CON TU BACKEND REFACTORIZADO
const API_URL = 'http://localhost:3000/api/v1/canchas';

interface Cancha {
  id: number;
  nombre: string;
  tipo_deporte: string;
  precio_hora: number;
  disponible: boolean;
  reservas_asociadas: number;
}

interface DatosCancha {
  nombre: string;
  tipo_deporte: string;
  precio_hora: string;
}

const FORMULARIO_INICIAL: DatosCancha = {
  nombre: '',
  tipo_deporte: 'Fútbol 7',
  precio_hora: '',
};

const AdminCourts: React.FC = () => {
  const router = useIonRouter();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<DatosCancha>(FORMULARIO_INICIAL);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const totalHabilitadas = canchas.filter((c) => c.disponible).length;
  const totalDeshabilitadas = canchas.filter((c) => !c.disponible).length;

  const cargarCanchas = useCallback(async () => {
    const token = localStorage.getItem('token');
    const rol = (localStorage.getItem('userRol') || '').trim().toLowerCase();

    if (!token || rol !== 'admin') {
      router.push('/login', 'root');
      return;
    }

    try {
      setError('');
      const respuesta = await fetch(`${API_URL}/admin/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) throw new Error(datos.mensaje || 'Error al cargar canchas.');
      setCanchas(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error interno.');
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    cargarCanchas();
  }, [cargarCanchas]);

  const abrirFormularioNuevo = () => {
    setCanchaEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setFormularioAbierto(true);
    setError(''); setMensaje('');
  };

  const abrirFormularioEdicion = (cancha: Cancha) => {
    setCanchaEditando(cancha.id);
    setFormulario({
      nombre: cancha.nombre,
      tipo_deporte: cancha.tipo_deporte,
      precio_hora: String(cancha.precio_hora),
    });
    setFormularioAbierto(true);
    setError(''); setMensaje('');
  };

  const guardarCancha = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const precio = Number(formulario.precio_hora);

    if (!formulario.nombre.trim() || !formulario.tipo_deporte.trim() || precio <= 0) {
      setError('Datos inválidos. Verifica el nombre, deporte y precio.');
      return;
    }

    try {
      setGuardando(true);
      const url = canchaEditando ? `${API_URL}/${canchaEditando}` : API_URL;
      const method = canchaEditando ? 'PUT' : 'POST';

      const respuesta = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: formulario.nombre, tipo_deporte: formulario.tipo_deporte, precio_hora: precio }),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.mensaje);

      setMensaje(datos.mensaje);
      setFormularioAbierto(false);
      cargarCanchas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarDisponibilidad = async (cancha: Cancha) => {
    const token = localStorage.getItem('token');
    if (!window.confirm(`¿Cambiar estado de "${cancha.nombre}"?`)) return;

    try {
      const respuesta = await fetch(`${API_URL}/${cancha.id}/disponibilidad`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: !cancha.disponible }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.mensaje);
      cargarCanchas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de disponibilidad.');
    }
  };

  const eliminarCancha = async (cancha: Cancha) => {
    const token = localStorage.getItem('token');
    if (cancha.reservas_asociadas > 0) return alert('No se puede eliminar una cancha con reservas.');
    if (!window.confirm(`¿Eliminar definitivamente "${cancha.nombre}"?`)) return;

    try {
      const respuesta = await fetch(`${API_URL}/${cancha.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.mensaje);
      cargarCanchas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  return (
    <IonPage className="admin-courts-page">
      <IonHeader className="ion-no-border">
        <IonToolbar color="dark">
          <button type="button" className="admin-courts-cancel-button" onClick={() => router.push('/admin/calendario', 'back')} style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IonIcon icon={arrowBackOutline} /> Volver al Calendario
          </button>
        </IonToolbar>
      </IonHeader>

      <IonContent className="admin-courts-content">
        <div className="admin-courts-overlay" />
        <main className="admin-courts-layout">
          
          <header className="admin-courts-heading">
            <div>
              <span className="admin-courts-eyebrow">Gestión de Recinto</span>
              <h1>Administrar Canchas</h1>
            </div>
            <button className="admin-courts-add-button" onClick={abrirFormularioNuevo}>
              <IonIcon icon={addOutline} /> Nueva Cancha
            </button>
          </header>

          <section className="admin-courts-stats">
            <div className="admin-courts-stat">
              <div><span>Total Registradas</span><strong>{canchas.length}</strong></div>
            </div>
            <div className="admin-courts-stat court-stat-active">
              <div><span>Habilitadas</span><strong>{totalHabilitadas}</strong></div>
            </div>
            <div className="admin-courts-stat court-stat-inactive">
              <div><span>Deshabilitadas</span><strong>{totalDeshabilitadas}</strong></div>
            </div>
          </section>

          {mensaje && <div className="admin-courts-alert success"><IonIcon icon={checkmarkCircleOutline} /> {mensaje}</div>}
          {error && <div className="admin-courts-alert danger"><IonIcon icon={alertCircleOutline} /> {error}</div>}

          {formularioAbierto && (
            <div className="admin-courts-form-panel">
              <div className="admin-courts-section-heading">
                <h2>{canchaEditando ? 'Editar Cancha' : 'Registrar Cancha'}</h2>
                <p>Define los parámetros para el cliente.</p>
              </div>
              <form onSubmit={guardarCancha}>
                <div className="admin-courts-form-grid">
                  <div className="admin-courts-field">
                    <label>Nombre de la cancha</label>
                    <input type="text" value={formulario.nombre} onChange={e => setFormulario({...formulario, nombre: e.target.value})} required />
                  </div>
                  <div className="admin-courts-field">
                    <label>Deporte</label>
                    <select value={formulario.tipo_deporte} onChange={e => setFormulario({...formulario, tipo_deporte: e.target.value})}>
                      <option value="Fútbol 7">Fútbol 7</option>
                      <option value="Fútbol 11">Fútbol 11</option>
                      <option value="Pádel">Pádel</option>
                      <option value="Tenis">Tenis</option>
                      <option value="Básquetbol">Básquetbol</option>
                      <option value="Voleibol">Voleibol</option>
                      <option value="Ping Pong">Ping Pong</option>
                    </select>
                  </div>
                  <div className="admin-courts-field">
                    <label>Precio por hora ($)</label>
                    <input type="number" min="1" value={formulario.precio_hora} onChange={e => setFormulario({...formulario, precio_hora: e.target.value})} required />
                  </div>
                </div>
                <div className="admin-courts-form-actions">
                  <button type="button" className="admin-courts-cancel-button" onClick={() => setFormularioAbierto(false)}>Cancelar</button>
                  <button type="submit" className="admin-courts-save-button" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                </div>
              </form>
            </div>
          )}

          <section className="admin-courts-list-panel">
            {cargando ? (
              <div style={{textAlign: 'center', padding: '40px', color: 'white'}}><IonSpinner name="crescent" /></div>
            ) : (
              <div className="admin-courts-grid">
                {canchas.map(cancha => (
                  <article key={cancha.id} className="admin-court-card">
                    <div className="admin-court-card-top">
                      <span className="admin-court-id">ID: {cancha.id}</span>
                      <span className={`admin-court-status ${cancha.disponible ? 'active' : 'inactive'}`}>
                        {cancha.disponible ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </div>
                    <h3>{cancha.nombre}</h3>
                    <p className="admin-court-sport">{cancha.tipo_deporte}</p>
                    
                    <div className="admin-court-details">
                      <div><span>Precio/Hr</span><strong>${Number(cancha.precio_hora).toLocaleString('es-CL')}</strong></div>
                      <div><span>Reservas</span><strong>{cancha.reservas_asociadas}</strong></div>
                    </div>

                    <div className="admin-court-actions">
                      <button className="admin-court-edit" onClick={() => abrirFormularioEdicion(cancha)}>
                        <IonIcon icon={createOutline} /> Editar
                      </button>
                      <button className="admin-court-toggle" onClick={() => cambiarDisponibilidad(cancha)}>
                        <IonIcon icon={powerOutline} /> {cancha.disponible ? 'Apagar' : 'Prender'}
                      </button>
                      <button className="admin-court-delete" disabled={cancha.reservas_asociadas > 0} onClick={() => eliminarCancha(cancha)}>
                        <IonIcon icon={trashOutline} /> Borrar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

        </main>
      </IonContent>
    </IonPage>
  );
};

export default AdminCourts;