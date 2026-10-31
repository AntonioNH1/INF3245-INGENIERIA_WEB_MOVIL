import React, { useCallback, useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import {
  addOutline,
  createOutline,
  trashOutline,
  powerOutline,
  refreshOutline,
  arrowBackOutline,
} from 'ionicons/icons';

import './AdminCourts.css';

const API_URL = 'http://localhost:3000/api/canchas';

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

  const totalHabilitadas = canchas.filter(
    (cancha) => cancha.disponible
  ).length;

  const totalDeshabilitadas = canchas.filter(
    (cancha) => !cancha.disponible
  ).length;

  // Cargar todas las canchas desde PostgreSQL
  const cargarCanchas = useCallback(async () => {
    const token = localStorage.getItem('token');
    const rol = (localStorage.getItem('userRol') || '')
      .trim()
      .toLowerCase();

    if (!token || !['admin', 'administrador'].includes(rol)) {
      router.push('/login', 'root');
      return;
    }

    try {
      setError('');

      const respuesta = await fetch(`${API_URL}/admin/todas`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
          datos.mensaje || 'No se pudieron cargar las canchas.'
        );
      }

      if (!Array.isArray(datos)) {
        throw new Error('La respuesta del servidor no es válida.');
      }

      setCanchas(datos);
    } catch (err) {
      console.error('Error al cargar las canchas:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar las canchas.'
      );
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargarCanchas();
  }, [cargarCanchas]);

  // Abrir formulario para crear una cancha
  const abrirFormularioNuevo = () => {
    setCanchaEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setFormularioAbierto(true);
    setError('');
    setMensaje('');
  };

  // Abrir formulario para editar una cancha
  const abrirFormularioEdicion = (cancha: Cancha) => {
    setCanchaEditando(cancha.id);

    setFormulario({
      nombre: cancha.nombre,
      tipo_deporte: cancha.tipo_deporte,
      precio_hora: String(cancha.precio_hora),
    });

    setFormularioAbierto(true);
    setError('');
    setMensaje('');
  };

  // Cerrar y limpiar formulario
  const cerrarFormulario = () => {
    setFormularioAbierto(false);
    setCanchaEditando(null);
    setFormulario(FORMULARIO_INICIAL);
  };

  // Crear o actualizar una cancha
  const guardarCancha = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login', 'root');
      return;
    }

    const precio = Number(formulario.precio_hora);

    if (
      !formulario.nombre.trim() ||
      !formulario.tipo_deporte.trim() ||
      !Number.isInteger(precio) ||
      precio <= 0
    ) {
      setError('Completa todos los campos e indica un precio válido.');
      return;
    }

    const editando = canchaEditando !== null;

    try {
      setGuardando(true);
      setError('');
      setMensaje('');

      const respuesta = await fetch(
        editando
          ? `${API_URL}/${canchaEditando}`
          : API_URL,
        {
          method: editando ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            tipo_deporte: formulario.tipo_deporte,
            precio_hora: precio,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo guardar la cancha.'
        );
      }

      setMensaje(datos.mensaje || 'Cancha guardada correctamente.');
      cerrarFormulario();

      await cargarCanchas();
    } catch (err) {
      console.error('Error al guardar la cancha:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar la cancha.'
      );
    } finally {
      setGuardando(false);
    }
  };

  // Habilitar o deshabilitar una cancha
  const cambiarDisponibilidad = async (cancha: Cancha) => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login', 'root');
      return;
    }

    const nuevaDisponibilidad = !cancha.disponible;

    const confirmado = window.confirm(
      nuevaDisponibilidad
        ? `¿Deseas habilitar "${cancha.nombre}" para los clientes?`
        : `¿Deseas deshabilitar "${cancha.nombre}"?`
    );

    if (!confirmado) return;

    try {
      setError('');
      setMensaje('');

      const respuesta = await fetch(
        `${API_URL}/${cancha.id}/disponibilidad`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            disponible: nuevaDisponibilidad,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo cambiar la disponibilidad.'
        );
      }

      setMensaje(datos.mensaje);
      await cargarCanchas();
    } catch (err) {
      console.error('Error al cambiar disponibilidad:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cambiar la disponibilidad.'
      );
    }
  };

  // Eliminar una cancha sin reservas asociadas
  const eliminarCancha = async (cancha: Cancha) => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login', 'root');
      return;
    }

    if (Number(cancha.reservas_asociadas) > 0) {
      setError(
        'Esta cancha tiene reservas asociadas. Debes deshabilitarla en lugar de eliminarla.'
      );
      return;
    }

    const confirmado = window.confirm(
      `¿Estás seguro de eliminar permanentemente "${cancha.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmado) return;

    try {
      setError('');
      setMensaje('');

      const respuesta = await fetch(`${API_URL}/${cancha.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo eliminar la cancha.'
        );
      }

      setMensaje(datos.mensaje);
      await cargarCanchas();
    } catch (err) {
      console.error('Error al eliminar la cancha:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al eliminar la cancha.'
      );
    }
  };

  const volverCalendario = () => {
    router.push('/admin/calendario', 'back');
  };

  return (
    <IonPage className="admin-courts-page">
      <IonHeader className="admin-courts-header ion-no-border">
        <IonToolbar className="admin-courts-toolbar">
          <button
            type="button"
            className="admin-courts-back"
            onClick={volverCalendario}
          >
            <IonIcon icon={arrowBackOutline} />
            <span>Volver al calendario</span>
          </button>

          <IonTitle className="admin-courts-toolbar-title">
            FaltaUno — Administración
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="admin-courts-content">
        <div className="admin-courts-overlay" />

        <main className="admin-courts-layout">
          <section className="admin-courts-heading">
            <div>
              <span className="admin-courts-eyebrow">
                PANEL DE CONTROL
              </span>

              <h1>Administrar canchas</h1>

              <p>
                Gestiona las canchas disponibles en la plataforma,
                modifica sus datos y controla su disponibilidad.
              </p>
            </div>

            <button
              type="button"
              className="admin-courts-add-button"
              onClick={abrirFormularioNuevo}
            >
              <IonIcon icon={addOutline} />
              Nueva cancha
            </button>
          </section>

          {/* ESTADÍSTICAS */}
          <section className="admin-courts-stats">
            <article className="admin-courts-stat">
              <span>Total de canchas</span>
              <strong>{canchas.length}</strong>
              <small>Registradas en el sistema</small>
            </article>

            <article className="admin-courts-stat court-stat-active">
              <span>Habilitadas</span>
              <strong>{totalHabilitadas}</strong>
              <small>Visibles para los clientes</small>
            </article>

            <article className="admin-courts-stat court-stat-inactive">
              <span>Deshabilitadas</span>
              <strong>{totalDeshabilitadas}</strong>
              <small>No disponibles para reservar</small>
            </article>
          </section>

          {/* MENSAJES */}
          {mensaje && (
            <div className="admin-courts-alert success" role="status">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="admin-courts-alert danger" role="alert">
              {error}
            </div>
          )}

          {/* FORMULARIO */}
          {formularioAbierto && (
            <section className="admin-courts-form-panel">
              <div className="admin-courts-section-heading">
                <div>
                  <h2>
                    {canchaEditando !== null
                      ? 'Editar cancha'
                      : 'Registrar nueva cancha'}
                  </h2>

                  <p>
                    Ingresa los datos que se mostrarán en la plataforma.
                  </p>
                </div>
              </div>

              <form onSubmit={guardarCancha}>
                <div className="admin-courts-form-grid">
                  <div className="admin-courts-field">
                    <label htmlFor="cancha-nombre">
                      Nombre de la cancha
                    </label>

                    <input
                      id="cancha-nombre"
                      type="text"
                      value={formulario.nombre}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          nombre: e.target.value,
                        })
                      }
                      placeholder="Ej. Cancha Sintética 1"
                      required
                    />
                  </div>

                  <div className="admin-courts-field">
                    <label htmlFor="cancha-deporte">
                      Deporte
                    </label>

                    <select
                      id="cancha-deporte"
                      value={formulario.tipo_deporte}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          tipo_deporte: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="Fútbol 7">Fútbol 7</option>
                      <option value="Fútbol 11">Fútbol 11</option>
                      <option value="Pádel">Pádel</option>
                      <option value="Tenis">Tenis</option>
                      <option value="Básquetbol">Básquetbol</option>
                      <option value="Voleibol">Voleibol</option>
                      <option value="Mesas de Ping Pong">
                        Mesas de Ping Pong
                      </option>
                    </select>
                  </div>

                  <div className="admin-courts-field">
                    <label htmlFor="cancha-precio">
                      Precio por hora ($)
                    </label>

                    <input
                      id="cancha-precio"
                      type="number"
                      min="1"
                      step="1"
                      value={formulario.precio_hora}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          precio_hora: e.target.value,
                        })
                      }
                      placeholder="Ej. 25000"
                      required
                    />
                  </div>
                </div>

                <div className="admin-courts-form-actions">
                  <button
                    type="button"
                    className="admin-courts-cancel-button"
                    onClick={cerrarFormulario}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="admin-courts-save-button"
                    disabled={guardando}
                  >
                    {guardando
                      ? 'Guardando...'
                      : canchaEditando !== null
                        ? 'Guardar cambios'
                        : 'Registrar cancha'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* LISTADO */}
          <section className="admin-courts-list-panel">
            <div className="admin-courts-section-heading">
              <div>
                <h2>Listado de canchas</h2>

                <p>
                  Consulta y administra las canchas registradas.
                </p>
              </div>

              <button
                type="button"
                className="admin-courts-refresh"
                onClick={() => void cargarCanchas()}
                disabled={cargando}
              >
                <IonIcon icon={refreshOutline} />
                Actualizar
              </button>
            </div>

            {cargando && (
              <div className="admin-courts-state">
                <IonSpinner />
                <p>Cargando canchas...</p>
              </div>
            )}

            {!cargando && !error && canchas.length === 0 && (
              <div className="admin-courts-state">
                <h3>Aún no hay canchas registradas</h3>
                <p>
                  Utiliza el botón «Nueva cancha» para agregar la primera.
                </p>
              </div>
            )}

            {!cargando && canchas.length > 0 && (
              <div className="admin-courts-grid">
                {canchas.map((cancha) => {
                  const reservas = Number(cancha.reservas_asociadas) || 0;

                  return (
                    <article
                      key={cancha.id}
                      className={`admin-court-card ${
                        cancha.disponible ? 'is-active' : 'is-inactive'
                      }`}
                    >
                      <div className="admin-court-card-top">
                        <span className="admin-court-id">
                          CANCHA #{cancha.id}
                        </span>

                        <span
                          className={`admin-court-status ${
                            cancha.disponible ? 'active' : 'inactive'
                          }`}
                        >
                          {cancha.disponible
                            ? 'Habilitada'
                            : 'Deshabilitada'}
                        </span>
                      </div>

                      <h3>{cancha.nombre}</h3>

                      <p className="admin-court-sport">
                        {cancha.tipo_deporte}
                      </p>

                      <div className="admin-court-details">
                        <div>
                          <span>Precio por hora</span>
                          <strong>
                            ${Number(cancha.precio_hora).toLocaleString('es-CL')}
                          </strong>
                        </div>

                        <div>
                          <span>Reservas asociadas</span>
                          <strong>{reservas}</strong>
                        </div>
                      </div>

                      <div className="admin-court-actions">
                        <button
                          type="button"
                          className="admin-court-edit"
                          onClick={() => abrirFormularioEdicion(cancha)}
                        >
                          <IonIcon icon={createOutline} />
                          Editar
                        </button>

                        <button
                          type="button"
                          className="admin-court-toggle"
                          onClick={() => void cambiarDisponibilidad(cancha)}
                        >
                          <IonIcon icon={powerOutline} />
                          {cancha.disponible
                            ? 'Deshabilitar'
                            : 'Habilitar'}
                        </button>

                        <button
                          type="button"
                          className="admin-court-delete"
                          disabled={reservas > 0}
                          title={
                            reservas > 0
                              ? 'No se puede eliminar porque tiene reservas asociadas'
                              : 'Eliminar cancha'
                          }
                          onClick={() => void eliminarCancha(cancha)}
                        >
                          <IonIcon icon={trashOutline} />
                          Eliminar
                        </button>
                      </div>

                      {reservas > 0 && (
                        <p className="admin-court-delete-note">
                          Esta cancha conserva su historial de reservas y no
                          se puede eliminar.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default AdminCourts;