import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  useIonRouter,
  useIonViewWillEnter,
  useIonAlert,
} from '@ionic/react';
import {
  personOutline,
  calendarOutline,
  cardOutline,
  globeOutline,
  shieldCheckmarkOutline,
  logOutOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  addOutline,
  trashOutline,
  languageOutline,
  cashOutline,
  timeOutline,
  lockClosedOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import './Profile.css';

type SeccionPerfil =
  | 'menu'
  | 'datos'
  | 'reservas'
  | 'pagos'
  | 'preferencias'
  | 'seguridad';

type ErroresDatos = {
  nombre?: string;
  correo?: string;
  telefono?: string;
};

type Tarjeta = {
  id: number;
  tipo: 'Visa' | 'Mastercard';
  terminacion: string;
  vencimiento: string;
  color: string;
};

const KEY_LOGGED = 'user_logged_in';
const KEY_NOMBRE = 'userName';
const KEY_NOMBRE_COMPLETO = 'userFullName';
const KEY_RUT = 'userRut';
const KEY_CORREO = 'userEmail';
const KEY_TELEFONO = 'userPhone';
const KEY_TARJETAS = 'faltauno_tarjetas';

const perfilKey = (correo: string) => `profile_${correo.trim().toLowerCase()}`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^\+?[0-9\s]{8,15}$/;

const TARJETAS_INICIALES: Tarjeta[] = [
  {
    id: 1,
    tipo: 'Visa',
    terminacion: '4589',
    vencimiento: '12/28',
    color: 'linear-gradient(135deg, #0a1f44, #1a428a, #2563eb)',
  },
  {
    id: 2,
    tipo: 'Mastercard',
    terminacion: '1024',
    vencimiento: '05/27',
    color: 'linear-gradient(135deg, #2b2b2b, #404040, #1a1a1a)',
  },
];

const leerTarjetas = (): Tarjeta[] => {
  try {
    const guardadas = localStorage.getItem(KEY_TARJETAS);
    if (guardadas) {
      const parsed: unknown = JSON.parse(guardadas);
      if (Array.isArray(parsed)) return parsed as Tarjeta[];
    }
  } catch {
    // Retorna datos de demostración si falla
  }
  return TARJETAS_INICIALES;
};

const leerSeccionDeUrl = (): SeccionPerfil => {
  const param = new URLSearchParams(window.location.search).get('seccion');
  const validas: SeccionPerfil[] = [
    'datos',
    'reservas',
    'pagos',
    'preferencias',
    'seguridad',
  ];
  return validas.includes(param as SeccionPerfil) ? (param as SeccionPerfil) : 'menu';
};

// 1. OPTIMIZACIÓN: Extraemos OptionButton fuera del componente principal
// para evitar que React lo re-renderice innecesariamente
const OptionButton = ({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
}) => (
  <button type="button" className="profile-option" onClick={onClick}>
    <span className="profile-option-icon">
      <IonIcon icon={icon} />
    </span>
    <span className="profile-option-text">
      <strong>{title}</strong>
      <small>{desc}</small>
    </span>
    <IonIcon className="profile-option-arrow arrow-rotated" icon={arrowBackOutline} />
  </button>
);


const Profile: React.FC = () => {
  const router = useIonRouter();
  const [presentAlert] = useIonAlert();

  const [seccion, setSeccion] = useState<SeccionPerfil>(leerSeccionDeUrl);
  const [filtroReservas, setFiltroReservas] = useState<'proximas' | 'historial'>('proximas');

  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');

  const [editando, setEditando] = useState(false);
  const [errores, setErrores] = useState<ErroresDatos>({});
  const [guardadoOk, setGuardadoOk] = useState(false);

  const [idioma, setIdioma] = useState('es-CL');
  const [moneda, setMoneda] = useState('CLP');
  const [zonaHoraria, setZonaHoraria] = useState('America/Santiago');

  const [tarjetasGuardadas, setTarjetasGuardadas] = useState<Tarjeta[]>(leerTarjetas);
  const [mostrarFormularioTarjeta, setMostrarFormularioTarjeta] = useState(false);
  const [tipoTarjeta, setTipoTarjeta] = useState<'Visa' | 'Mastercard'>('Visa');
  const [terminacionTarjeta, setTerminacionTarjeta] = useState('');
  const [vencimientoTarjeta, setVencimientoTarjeta] = useState('');
  const [errorTarjeta, setErrorTarjeta] = useState('');

  const guardarTarjetas = (tarjetas: Tarjeta[]) => {
    setTarjetasGuardadas(tarjetas);
    try {
      localStorage.setItem(KEY_TARJETAS, JSON.stringify(tarjetas));
    } catch {
      setErrorTarjeta('No fue posible guardar los cambios en este navegador.');
    }
  };

  const handleEliminarTarjeta = (idTarjeta: number) => {
    guardarTarjetas(tarjetasGuardadas.filter((tarjeta) => tarjeta.id !== idTarjeta));
  };

  const confirmarEliminacion = (idTarjeta: number, terminacion: string) => {
    presentAlert({
      header: 'Eliminar tarjeta',
      message: `¿Estás seguro de que deseas eliminar la tarjeta terminada en ****${terminacion}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => handleEliminarTarjeta(idTarjeta) },
      ],
    });
  };

  const handleAgregarTarjeta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorTarjeta('');

    if (!/^\d{4}$/.test(terminacionTarjeta)) {
      setErrorTarjeta('Ingresa exactamente los últimos cuatro dígitos.');
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimientoTarjeta)) {
      setErrorTarjeta('Ingresa el vencimiento en formato MM/AA, por ejemplo 08/28.');
      return;
    }

    const nuevaTarjeta: Tarjeta = {
      id: Date.now(),
      tipo: tipoTarjeta,
      terminacion: terminacionTarjeta,
      vencimiento: vencimientoTarjeta,
      color:
        tipoTarjeta === 'Visa'
          ? 'linear-gradient(135deg, #0a1f44, #1a428a, #2563eb)'
          : 'linear-gradient(135deg, #2b2b2b, #404040, #1a1a1a)',
    };

    guardarTarjetas([...tarjetasGuardadas, nuevaTarjeta]);
    setTipoTarjeta('Visa');
    setTerminacionTarjeta('');
    setVencimientoTarjeta('');
    setMostrarFormularioTarjeta(false);
  };

  const cargarDatos = () => {
    setNombre(
      localStorage.getItem(KEY_NOMBRE_COMPLETO) ||
      localStorage.getItem(KEY_NOMBRE) || ''
    );
    setRut(localStorage.getItem(KEY_RUT) || '');
    setCorreo(localStorage.getItem(KEY_CORREO) || '');
    setTelefono(localStorage.getItem(KEY_TELEFONO) || '');
  };

  useIonViewWillEnter(() => {
    if (localStorage.getItem(KEY_LOGGED) !== 'true') {
      router.push('/login', 'root', 'replace');
      return;
    }
    cargarDatos();
    setSeccion(leerSeccionDeUrl());
    setEditando(false);
    setErrores({});
    setGuardadoOk(false);
    setTarjetasGuardadas(leerTarjetas());
  });

  const handleLogout = () => {
    [
      KEY_LOGGED,
      KEY_NOMBRE,
      KEY_NOMBRE_COMPLETO,
      KEY_RUT,
      KEY_CORREO,
      KEY_TELEFONO,
    ].forEach((key) => localStorage.removeItem(key));
    router.push('/login', 'root', 'replace');
  };

  const validar = (): ErroresDatos => {
    const nuevos: ErroresDatos = {};
    if (nombre.trim().length < 2) nuevos.nombre = 'Ingresa un nombre de al menos 2 caracteres.';
    if (correo.trim() === '') nuevos.correo = 'El correo es obligatorio.';
    else if (!EMAIL_REGEX.test(correo.trim())) nuevos.correo = 'Ingresa un correo válido.';
    if (telefono.trim() !== '' && !TELEFONO_REGEX.test(telefono.trim())) nuevos.telefono = 'Ingresa un teléfono válido.';
    return nuevos;
  };

  const handleGuardar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);

    if (Object.keys(nuevos).length > 0) {
      setGuardadoOk(false);
      return;
    }

    const correoAnterior = localStorage.getItem(KEY_CORREO);
    const primerNombre = nombre.trim().split(/\s+/)[0];

    localStorage.setItem(KEY_NOMBRE, primerNombre);
    localStorage.setItem(KEY_NOMBRE_COMPLETO, nombre.trim());
    localStorage.setItem(KEY_RUT, rut.trim());
    localStorage.setItem(KEY_CORREO, correo.trim());
    localStorage.setItem(KEY_TELEFONO, telefono.trim());

    if (correoAnterior && correoAnterior !== correo.trim()) {
      localStorage.removeItem(perfilKey(correoAnterior));
    }

    localStorage.setItem(
      perfilKey(correo),
      JSON.stringify({ nombre: nombre.trim(), rut: rut.trim(), correo: correo.trim(), telefono: telefono.trim() })
    );

    setNombre(nombre.trim());
    setRut(rut.trim());
    setCorreo(correo.trim());
    setTelefono(telefono.trim());
    setEditando(false);
    setGuardadoOk(true);
  };

  const iniciarEdicion = () => {
    setGuardadoOk(false);
    setEditando(true);
  };

  // 2. OPTIMIZACIÓN: Corregida la lógica para que al volver siempre vayas
  // al menú si estabas en otra sección.
  const handleVolver = () => {
    if (seccion === 'datos') {
      // Si está en datos, vuelve al menú de perfil
      setSeccion('menu');
      setEditando(false);
      setErrores({});
      setGuardadoOk(false);
    } else {
      // Si está en 'menu', 'reservas', 'pagos', 'preferencias' o 'seguridad', va directo al home
      router.push('/cliente/inicio', 'root');
    }
  };

  const renderMenu = () => (
    <>
      <div className="profile-heading">
        <div className="profile-heading-icon"><IonIcon icon={personOutline} /></div>
        <div>
          <h1>Mi perfil</h1>
          <p>Administra tu cuenta de FaltaUno</p>
        </div>
      </div>

      <section className="profile-group">
        <h2 className="profile-group-title">Mi cuenta</h2>
        <div className="profile-options">
          <OptionButton
            icon={personOutline}
            title="Ver o editar datos personales"
            desc="Nombre, RUT, correo electrónico y teléfono"
            onClick={() => setSeccion('datos')}
          />
        </div>
      </section>

      <section className="profile-group">
        <h2 className="profile-group-title">Gestión de cuenta</h2>
        <div className="profile-options">
          <OptionButton icon={calendarOutline} title="Mis reservas" desc="Consulta tus reservas de canchas" onClick={() => setSeccion('reservas')} />
          <OptionButton icon={cardOutline} title="Métodos de pago" desc="Consulta tus opciones de pago" onClick={() => setSeccion('pagos')} />
          <OptionButton icon={globeOutline} title="Preferencias regionales" desc="Configura tus preferencias regionales" onClick={() => setSeccion('preferencias')} />
          <OptionButton icon={shieldCheckmarkOutline} title="Seguridad" desc="Consulta las opciones de seguridad de tu cuenta" onClick={() => setSeccion('seguridad')} />
        </div>
      </section>

      <div className="profile-logout">
        <button type="button" className="logout-button" onClick={handleLogout}>
          <IonIcon icon={logOutOutline} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  const renderDatos = () => (
    <form className="profile-detail" onSubmit={handleGuardar} noValidate>
      <h1>DATOS PERSONALES</h1>
      <p>Consulta y edita la información de tu perfil.</p>
      
      <div className="profile-avatar" aria-hidden="true">
        {nombre.trim().charAt(0).toUpperCase() || '?'}
      </div>

      {guardadoOk && (
        <div className="profile-feedback-ok" role="status">
          <IonIcon icon={checkmarkCircleOutline} />
          <span>Tus datos se guardaron correctamente.</span>
        </div>
      )}

      <label htmlFor="nombre">Nombre completo</label>
      <input id="nombre" type="text" value={nombre} disabled={!editando} onChange={(e) => setNombre(e.target.value)} placeholder="Ingresa tu nombre" className={errores.nombre ? 'input-error' : ''} />
      {errores.nombre && <span className="field-error">{errores.nombre}</span>}

      <label htmlFor="rut">RUT</label>
      <input id="rut" type="text" value={rut} disabled={!editando} onChange={(e) => setRut(e.target.value)} placeholder="Ej: 12.345.678-5" />
      <span className="field-hint">Ingresa tu RUT para completar tus datos personales.</span>

      <label htmlFor="correo">Correo electrónico</label>
      <input id="correo" type="email" value={correo} disabled={!editando} onChange={(e) => setCorreo(e.target.value)} placeholder="Ingresa tu correo" className={errores.correo ? 'input-error' : ''} />
      {errores.correo && <span className="field-error">{errores.correo}</span>}

      <label htmlFor="telefono">Teléfono</label>
      <input id="telefono" type="tel" value={telefono} disabled={!editando} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 1234 5678" className={errores.telefono ? 'input-error' : ''} />
      {errores.telefono && <span className="field-error">{errores.telefono}</span>}

      {!editando ? (
        <button type="button" className="profile-action" onClick={iniciarEdicion}>Editar datos</button>
      ) : (
        <div className="profile-actions-row">
          <button type="button" className="profile-action profile-action-secondary" onClick={() => { cargarDatos(); setEditando(false); setErrores({}); }}>Cancelar</button>
          <button type="submit" className="profile-action">Guardar cambios</button>
        </div>
      )}
    </form>
  );

  const renderReservas = () => (
    <section className="profile-detail reservas-section">
      <div className="reservas-heading">
        <div className="reservas-heading-icon"><IonIcon icon={calendarOutline} /></div>
        <div>
          <h1>Mis reservas</h1>
          <p>Organiza tus partidos y consulta tus reservas de canchas.</p>
        </div>
      </div>

      <div className="reservas-tabs">
        <button type="button" className={`reservas-tab ${filtroReservas === 'proximas' ? 'reservas-tab-active' : ''}`} onClick={() => setFiltroReservas('proximas')}>Próximas reservas</button>
        <button type="button" className={`reservas-tab ${filtroReservas === 'historial' ? 'reservas-tab-active' : ''}`} onClick={() => setFiltroReservas('historial')}>Historial</button>
      </div>

      <div className="reservas-empty">
        <div className="reservas-empty-icon"><IonIcon icon={calendarOutline} /></div>
        {filtroReservas === 'proximas' ? (
          <>
            <h2>Aún no tienes reservas</h2>
            <p>Cuando reserves una cancha, encontrarás aquí la fecha, el horario y los detalles.</p>
            <button type="button" className="profile-action" onClick={() => router.push('/cliente/inicio')}>Explorar canchas</button>
          </>
        ) : (
          <>
            <h2>Tu historial está vacío</h2>
            <p>Aquí podrás consultar tus reservas anteriores cuando estén disponibles.</p>
            <button type="button" className="profile-action" onClick={() => setFiltroReservas('proximas')}>Ver próximas reservas</button>
          </>
        )}
      </div>
    </section>
  );

  const renderPagos = () => (
    <section className="profile-detail pagos-section">
      <div className="pagos-heading">
        <div className="pagos-heading-icon"><IonIcon icon={cardOutline} /></div>
        <div>
          <h1>Métodos de pago</h1>
          <p>Administra tus tarjetas de crédito y débito.</p>
        </div>
      </div>

      {errorTarjeta && <div className="field-error" role="alert">{errorTarjeta}</div>}

      <div className="tarjetas-lista">
        {tarjetasGuardadas.length === 0 ? (
          <div className="pagos-vacio">
            <IonIcon icon={cardOutline} />
            <h2>Aún no tienes tarjetas guardadas</h2>
            <p>Agrega una tarjeta de prueba para verla en esta sección.</p>
          </div>
        ) : (
          tarjetasGuardadas.map((tarjeta) => (
            <div key={tarjeta.id} className="tarjeta-credito" style={{ background: tarjeta.color }}>
              <div className="tarjeta-bg-circle circle-1" />
              <div className="tarjeta-bg-circle circle-2" />
              <div className="tarjeta-header">
                <div className="tarjeta-chip" />
                <span className="tarjeta-marca">{tarjeta.tipo}</span>
              </div>
              <div className="tarjeta-numero">
                <span>****</span><span>****</span><span>****</span><span>{tarjeta.terminacion}</span>
              </div>
              <div className="tarjeta-footer">
                <div className="tarjeta-info">
                  <small>VENCIMIENTO</small>
                  <span>{tarjeta.vencimiento}</span>
                </div>
                <button
                  type="button"
                  className="btn-eliminar-tarjeta"
                  aria-label={`Eliminar tarjeta terminada en ${tarjeta.terminacion}`}
                  title="Eliminar tarjeta"
                  onClick={() => confirmarEliminacion(tarjeta.id, tarjeta.terminacion)}
                >
                  <IonIcon icon={trashOutline} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!mostrarFormularioTarjeta ? (
        <button type="button" className="profile-action btn-agregar-tarjeta" onClick={() => { setErrorTarjeta(''); setMostrarFormularioTarjeta(true); }}>
          <IonIcon icon={addOutline} className="icon-add-tarjeta" />
          Agregar nueva tarjeta
        </button>
      ) : (
        <form className="formulario-tarjeta" onSubmit={handleAgregarTarjeta}>
          <h2>Agregar tarjeta de prueba</h2>
          <p>No ingreses datos de una tarjeta bancaria real. Esta función es solamente una demostración visual.</p>
          
          <label htmlFor="tipoTarjeta">Tipo de tarjeta</label>
          <select id="tipoTarjeta" value={tipoTarjeta} onChange={(e) => setTipoTarjeta(e.target.value as 'Visa' | 'Mastercard')}>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
          </select>

          <label htmlFor="terminacionTarjeta">Últimos cuatro dígitos</label>
          <input id="terminacionTarjeta" type="text" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} value={terminacionTarjeta} onChange={(e) => setTerminacionTarjeta(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Ej.: 4589" required />

          <label htmlFor="vencimientoTarjeta">Vencimiento (MM/AA)</label>
          <input id="vencimientoTarjeta" type="text" inputMode="numeric" pattern="(0[1-9]|1[0-2])\/[0-9]{2}" maxLength={5} value={vencimientoTarjeta} onChange={(e) => setVencimientoTarjeta(e.target.value)} placeholder="Ej.: 12/28" required />

          <div className="profile-actions-row">
            <button type="button" className="profile-action profile-action-secondary" onClick={() => { setMostrarFormularioTarjeta(false); setErrorTarjeta(''); }}>Cancelar</button>
            <button type="submit" className="profile-action">Guardar tarjeta</button>
          </div>
        </form>
      )}
    </section>
  );

  const renderPreferencias = () => (
    <section className="profile-detail preferencias-section">
      <div className="preferencias-heading">
        <div className="preferencias-heading-icon"><IonIcon icon={globeOutline} /></div>
        <div>
          <h1>Preferencias regionales</h1>
          <p>Personaliza tu experiencia según tu ubicación.</p>
        </div>
      </div>

      <div className="preferencias-form">
        <div className="pref-group">
          <label htmlFor="idioma"><IonIcon icon={languageOutline} /> Idioma</label>
          <select id="idioma" value={idioma} onChange={(e) => setIdioma(e.target.value)} className="pref-select">
            <option value="es-CL">Español (Chile)</option>
            <option value="en-US">English (US)</option>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </div>

        <div className="pref-group">
          <label htmlFor="moneda"><IonIcon icon={cashOutline} /> Moneda</label>
          <select id="moneda" value={moneda} onChange={(e) => setMoneda(e.target.value)} className="pref-select">
            <option value="CLP">Peso Chileno (CLP)</option>
            <option value="USD">Dólar Estadounidense (USD)</option>
            <option value="ARS">Peso Argentino (ARS)</option>
          </select>
        </div>

        <div className="pref-group">
          <label htmlFor="zonaHoraria"><IonIcon icon={timeOutline} /> Zona Horaria</label>
          <select id="zonaHoraria" value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)} className="pref-select">
            <option value="America/Santiago">Hora de Chile (GMT-4 / GMT-3)</option>
            <option value="America/Argentina/Buenos_Aires">Hora de Argentina (GMT-3)</option>
            <option value="America/Bogota">Hora de Colombia (GMT-5)</option>
          </select>
        </div>

        <button type="button" className="profile-action btn-guardar-pref" onClick={() => presentAlert({ header: 'Preferencias', message: 'Las preferencias están aplicadas en esta vista.', buttons: ['Aceptar'] })}>
          Guardar preferencias
        </button>
      </div>
    </section>
  );

  const renderSeguridad = () => (
    <section className="profile-detail seguridad-section">
      <div className="seguridad-heading">
        <div className="seguridad-heading-icon"><IonIcon icon={shieldCheckmarkOutline} /></div>
        <div>
          <h1>Seguridad de mi cuenta</h1>
          <p>Protege tu cuenta de FaltaUno.</p>
        </div>
      </div>
      <div className="seguridad-card">
        <div className="seguridad-card-heading">
          <IonIcon icon={lockClosedOutline} />
          <div>
            <h2>Cambiar contraseña</h2>
            <p>Mantén tu cuenta segura utilizando una contraseña personal.</p>
          </div>
        </div>
        <div className="seguridad-aviso">
          <IonIcon icon={informationCircleOutline} />
          <p>Esta sección es una interfaz inicial. El cambio de contraseña se habilitará cuando esté conectado al sistema de autenticación.</p>
        </div>
      </div>
    </section>
  );

  return (
    <IonPage>
      <IonContent className="profile-content app-bg">
        <div className="profile-container">
          
          {/* Reemplaza el botón para que los textos de accesibilidad coincidan con la nueva lógica */}
          <button
            type="button"
            className="profile-panel-back"
            onClick={handleVolver}
            aria-label={seccion === 'datos' ? 'Volver al menú' : 'Volver al inicio'}
            title={seccion === 'datos' ? 'Volver al menú' : 'Volver al inicio'}
          >
            <IonIcon icon={arrowBackOutline} />
          </button>

          {seccion === 'menu' && renderMenu()}
          {seccion === 'datos' && renderDatos()}
          {seccion === 'reservas' && renderReservas()}
          {seccion === 'pagos' && renderPagos()}
          {seccion === 'preferencias' && renderPreferencias()}
          {seccion === 'seguridad' && renderSeguridad()}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;