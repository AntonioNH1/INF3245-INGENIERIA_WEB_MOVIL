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
  tennisballOutline,
  cardOutline,
  globeOutline,
  shieldCheckmarkOutline,
  logOutOutline,
} from 'ionicons/icons';

import './SearchCourts.css';

// 1. EXTRAÍDO: Mover los datos estáticos fuera del componente mejora el rendimiento.
const CATEGORIES = [
  { id: 'futbol-7', name: 'Fútbol 7', image: '/recuadro futbol 7.jpg', desc: 'Canchas de pasto sintético iluminadas' },
  { id: 'futbol-11', name: 'Fútbol 11', image: '/recuadro futbol 11.jpg', desc: 'Canchas oficiales de grass profesional' },
  { id: 'padel', name: 'Pádel', image: '/recuadro padel.jpg', desc: 'Canchas de vidrio con blindex' },
  { id: 'tenis', name: 'Tenis', image: '/recuadro tenis.jpg', desc: 'Superficie de arcilla y rápida' },
  { id: 'bask', name: 'Básquetbol', image: '/recuadro basquetball.jpg', desc: 'Gimnasio techado profesional' },
  { id: 'voley', name: 'Voleibol', image: '/recuadro voleyball.jpg', desc: 'Canchas de arena profesional' },
  { id: 'pingpong', name: 'Mesas de Ping Pong', image: '/recuadro pingpong.jpg', desc: 'Salón indoor climatizado' },
];

const SearchCourts: React.FC = () => {
  const [userName, setUserName] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const router = useIonRouter();

  useEffect(() => {
    const logged = localStorage.getItem('user_logged_in') === 'true';
    setIsLoggedIn(logged);
    if (logged) {
      const storedName = localStorage.getItem('userName') || 'Usuario';
      setUserName(storedName);
    } else {
      setUserName('Usuario');
    }
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserName('Usuario');
    setIsSidebarOpen(false);
    router.push('/login', 'root', 'replace');
  };

  const handleSelectCategory = (categoryId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      router.push(`/cliente/horarios/${categoryId}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
        setShowAuthModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <IonPage>
      {/* ENCABEZADO */}
      <IonHeader translucent={true} className="header-custom-grande">
        <IonToolbar className="translucent-toolbar">
          {isLoggedIn && (
            <IonButtons slot="start">
              <button
                type="button"
                className="btn-hamburger"
                aria-label={isSidebarOpen ? 'Cerrar menú de perfil' : 'Abrir menú de perfil'}
                aria-expanded={isSidebarOpen}
                onClick={toggleSidebar}
              >
                <IonIcon icon={menuOutline} />
              </button>
            </IonButtons>
          )}

          <div className="toolbar-logo-container">
            <img src="/FaltaUno-Inicio.png" alt="FaltaUno Inicio" className="toolbar-logo-img" />
          </div>

          <IonButtons slot="end" className="header-auth-buttons">
            {!isLoggedIn && (
              <>
                <button type="button" className="btn-header-login" onClick={() => router.push('/login')}>
                  Iniciar Sesión
                </button>
                <button type="button" className="btn-header-register" onClick={() => router.push('/registro')}>
                  REGISTRARSE
                </button>
              </>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* CONTENIDO PRINCIPAL: Fondo manejado 100% en CSS ahora */}
      <IonContent className="ion-padding content-main-bg">
        <div className="welcome-section">
          <h2>¡Hola, {userName}! 👋</h2>
          <p>¿Qué deporte jugamos hoy? Selecciona una categoría para ver los horarios.</p>
        </div>

        {/* TARJETAS DE DEPORTES */}
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <IonCard
              key={cat.id}
              className="category-card"
              button
              onClick={() => handleSelectCategory(cat.id)}
            >
              <div className="card-image-container">
                <img src={cat.image} alt={cat.name} className="category-bg-image" />
                <div className="card-gradient-overlay" />
                <IonCardHeader className="card-header-absolute">
                  <IonCardTitle className="card-title-white">{cat.name}</IonCardTitle>
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
          <div className="auth-modal-backdrop" onClick={() => setShowAuthModal(false)}>
            <div
              className="auth-modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="auth-modal-icon-wrapper">
                <img src="/Simbolo error FaltaUno.png" alt="Alerta" className="auth-error-icon" />
              </div>
              <h2 id="auth-modal-title" className="auth-modal-title">¡Inicia Sesión Para Continuar!</h2>
              <p className="auth-modal-message">
                Debes iniciar sesión o registrarte para poder reservar tu cancha y asegurar tu horario.
              </p>
              <div className="auth-modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAuthModal(false)}>
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
        {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />}

        {/* MENÚ LATERAL DE PERFIL */}
        <aside
          className={`custom-sidebar ${isSidebarOpen ? 'open' : ''}`}
          aria-label="Menú de perfil"
          aria-hidden={!isSidebarOpen}
        >
          <h3 className="sidebar-title">MI PERFIL</h3>
          <div className="sidebar-menu-list">
            
            {/* 3. CORREGIDO: router.push en vez de window.location.href */}
            <button
              type="button"
              className="sidebar-item active"
              onClick={() => {
                closeSidebar();
                router.push('/cliente/perfil'); 
              }}
              tabIndex={isSidebarOpen ? 0 : -1}
            >
              <IonIcon icon={personOutline} />
              <span>Datos Personales</span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                closeSidebar();
                router.push('/cliente/perfil?seccion=reservas');
              }}
              tabIndex={isSidebarOpen ? 0 : -1}
            >
              <IonIcon icon={tennisballOutline} />
              <span>Mis Reservas</span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                closeSidebar();
                router.push('/cliente/perfil?seccion=pagos');
              }}
              tabIndex={isSidebarOpen ? 0 : -1}
            >
              <IonIcon icon={cardOutline} />
              <span>Métodos de Pago</span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                closeSidebar();
                router.push('/cliente/perfil?seccion=preferencias');
              }}
              tabIndex={isSidebarOpen ? 0 : -1}
            >
              <IonIcon icon={globeOutline} />
              <span>Preferencias Regionales</span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                closeSidebar();
                router.push('/cliente/perfil?seccion=seguridad');
              }}
              tabIndex={isSidebarOpen ? 0 : -1}
            >
              <IonIcon icon={shieldCheckmarkOutline} />
              <span>Seguridad</span>
            </button>

            <hr className="sidebar-divider" />

            <button
              type="button"
              className="sidebar-btn-logout"
              onClick={handleLogout}
              tabIndex={isSidebarOpen ? 0 : -1}
            >
              <IonIcon icon={logOutOutline} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      </IonContent>
    </IonPage>
  );
};

export default SearchCourts;