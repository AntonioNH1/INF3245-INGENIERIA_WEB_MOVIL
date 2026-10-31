
import React, { useEffect, useState } from 'react';

import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonButtons,
  useIonRouter,
  IonIcon,
} from '@ionic/react';

import {
  menuOutline,
  personOutline,
  cardOutline,
  logOutOutline,
  calendarOutline,
  gridOutline,
} from 'ionicons/icons';

import './SearchCourts.css';

const SearchCourts: React.FC = () => {
  // Estados de la aplicación
  const [userName, setUserName] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const router = useIonRouter();

  // Comprobar sesión y rol del usuario
  useEffect(() => {
    const logged =
      localStorage.getItem('user_logged_in') === 'true';

    const rol = (localStorage.getItem('userRol') || '')
      .trim()
      .toLowerCase();

    setIsLoggedIn(logged);

    setIsAdmin(
      logged && ['admin', 'administrador'].includes(rol)
    );

    if (logged) {
      const storedName =
        localStorage.getItem('userName') || 'Usuario';

      setUserName(storedName);
    } else {
      setUserName('Usuario');
    }
  }, []);

  // Cerrar sesión
  const handleLogout = () => {
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

    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserName('Usuario');
    setIsSidebarOpen(false);

    router.push('/login', 'root', 'replace');
  };

  // Volver al calendario de administración
  // sin cerrar la sesión actual
  const volverAdministracion = () => {
    setIsSidebarOpen(false);

    router.push('/admin/calendario', 'root', 'replace');
  };

  // Cerrar menú lateral
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Categorías deportivas
  const categories = [
    {
      id: 'futbol-7',
      name: 'Fútbol 7',
      image: '/recuadro futbol 7.jpg',
      desc: 'Canchas de pasto sintético iluminadas',
    },
    {
      id: 'futbol-11',
      name: 'Fútbol 11',
      image: '/recuadro futbol 11.jpg',
      desc: 'Canchas oficiales de grass profesional',
    },
    {
      id: 'padel',
      name: 'Pádel',
      image: '/recuadro padel.jpg',
      desc: 'Canchas de vidrio con blindex',
    },
    {
      id: 'tenis',
      name: 'Tenis',
      image: '/recuadro tenis.jpg',
      desc: 'Superficie de arcilla y rápida',
    },
    {
      id: 'bask',
      name: 'Básquetbol',
      image: '/recuadro basquetball.jpg',
      desc: 'Gimnasio techado profesional',
    },
    {
      id: 'voley',
      name: 'Voleibol',
      image: '/recuadro voleyball.jpg',
      desc: 'Canchas de arena profesional',
    },
    {
      id: 'pingpong',
      name: 'Mesas de Ping Pong',
      image: '/recuadro pingpong.jpg',
      desc: 'Salón indoor climatizado',
    },
  ];

  // Seleccionar una categoría deportiva
  const handleSelectCategory = (categoryId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      setIsSidebarOpen(false);

      router.push(
        `/cliente/horarios/${categoryId}`,
        'forward',
        'push'
      );
    }
  };

  return (
    <IonPage>
      {/* ENCABEZADO */}
      <IonHeader
        translucent={true}
        className="header-custom-grande"
      >
        <IonToolbar className="translucent-toolbar">

          {/* LOGO */}
          <div className="toolbar-logo-container">
            <img
              src="/FaltaUno-Inicio.png"
              alt="FaltaUno Inicio"
              className="toolbar-logo-img"
            />
          </div>

          {/* BOTONES DEL ENCABEZADO */}
          <IonButtons
            slot="end"
            style={{
              marginRight: '16px',
              gap: '12px',
            }}
          >
            {isLoggedIn ? (
              <button
                type="button"
                className="btn-hamburger"
                aria-label={
                  isSidebarOpen
                    ? 'Cerrar menú'
                    : 'Abrir menú'
                }
                aria-expanded={isSidebarOpen}
                onClick={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              >
                <IonIcon icon={menuOutline} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1e4b8f',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Iniciar Sesión
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/registro')}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '6px 16px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow:
                      '0 2px 6px rgba(37,99,235,0.35)',
                  }}
                >
                  REGISTRARSE
                </button>
              </>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* CONTENIDO PRINCIPAL */}
      <IonContent
        className="ion-padding"
        style={
          {
            '--background':
              'url(/FondoMenuPrincipal.jpg) no-repeat center center fixed',
            backgroundSize: 'cover',
          } as React.CSSProperties
        }
      >
        {/* BIENVENIDA */}
        <div className="welcome-section">
          <h2>¡Hola, {userName}! 👋</h2>

          <p>
            ¿Qué deporte jugamos hoy? Selecciona una categoría
            para ver los horarios.
          </p>
        </div>

        {/* TARJETAS DE DEPORTES */}
        <div className="categories-grid">
          {categories.map((cat) => (
            <IonCard
              key={cat.id}
              className="category-card"
              onClick={() =>
                handleSelectCategory(cat.id)
              }
            >
              <div className="card-image-container">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="category-bg-image"
                />

                <div className="card-gradient-overlay" />

                <IonCardHeader className="card-header-absolute">
                  <IonCardTitle className="card-title-white">
                    {cat.name}
                  </IonCardTitle>
                </IonCardHeader>
              </div>

              <IonCardContent className="card-content-custom">
                <p>{cat.desc}</p>

                <IonButton
                  fill="solid"
                  color="light"
                  expand="block"
                  size="small"
                  className="ion-margin-top btn-ver-horarios"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectCategory(cat.id);
                  }}
                >
                  VER HORARIOS
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        {/* MODAL PARA USUARIOS SIN SESIÓN */}
        {showAuthModal && (
          <div
            className="auth-modal-backdrop"
            onClick={() => setShowAuthModal(false)}
          >
            <div
              className="auth-modal-box"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="auth-modal-icon-wrapper">
                <img
                  src="/Simbolo error FaltaUno.png"
                  alt="Alerta Iniciar Sesión"
                  className="auth-error-icon"
                />
              </div>

              <h2 className="auth-modal-title">
                ¡Inicia Sesión Para Continuar!
              </h2>

              <p className="auth-modal-message">
                Debes iniciar sesión o registrarte para poder
                reservar tu cancha y asegurar tu horario.
              </p>

              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-modal-login"
                  onClick={() => {
                    setShowAuthModal(false);
                    router.push('/login');
                  }}
                >
                  Inicia Sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FONDO OSCURO DEL MENÚ LATERAL */}
        {isSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={closeSidebar}
          />
        )}

        {/* MENÚ LATERAL */}
        <div
          className={`custom-sidebar ${
            isSidebarOpen ? 'open' : ''
          }`}
        >
          <div style={{ padding: '24px' }}>
            <div className="sidebar-menu-list">

              {/* VOLVER A ADMINISTRACIÓN */}
              {isAdmin && (
                <button
                  type="button"
                  className="sidebar-item"
                  onClick={volverAdministracion}
                >
                  <IonIcon icon={gridOutline} />
                  <span>Volver a Administración</span>
                </button>
              )}

              {/* DATOS PERSONALES */}
              <button
                type="button"
                className="sidebar-item"
                onClick={() => {
                  closeSidebar();

                  router.push(
                    '/cliente/perfil?tab=datos'
                  );
                }}
              >
                <IonIcon icon={personOutline} />
                <span>Datos Personales</span>
              </button>

              {/* MIS RESERVAS */}
              <button
                type="button"
                className="sidebar-item"
                onClick={() => {
                  closeSidebar();

                  router.push(
                    '/cliente/perfil?tab=reservas'
                  );
                }}
              >
                <IonIcon icon={calendarOutline} />
                <span>Mis Reservas</span>
              </button>

              {/* MÉTODOS DE PAGO */}
              <button
                type="button"
                className="sidebar-item"
                onClick={() => {
                  closeSidebar();

                  router.push(
                    '/cliente/perfil?tab=pagos'
                  );
                }}
              >
                <IonIcon icon={cardOutline} />
                <span>Métodos de Pago</span>
              </button>
            </div>

            <hr className="sidebar-divider" />

            {/* CERRAR SESIÓN */}
            <button
              type="button"
              className="sidebar-btn-logout"
              onClick={handleLogout}
            >
              <IonIcon icon={logOutOutline} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SearchCourts;
