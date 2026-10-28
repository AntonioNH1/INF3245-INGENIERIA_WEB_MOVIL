import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonButtons, useIonRouter, IonIcon } from '@ionic/react';
import { menuOutline, personOutline, tennisballOutline, cardOutline, globeOutline, shieldCheckmarkOutline, logOutOutline, calendarOutline } from 'ionicons/icons';

import './SearchCourts.css';

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

  const handleLogout = () => {
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    localStorage.removeItem('userRol');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserName('Usuario');
    setIsSidebarOpen(false);
  };

  const categories = [
    { id: 'futbol-7', name: 'Fútbol 7', image: '/recuadro futbol 7.jpg', desc: 'Canchas de pasto sintético iluminadas' },
    { id: 'futbol-11', name: 'Fútbol 11', image: '/recuadro futbol 11.jpg', desc: 'Canchas oficiales de grass profesional' },
    { id: 'padel', name: 'Pádel', image: '/recuadro padel.jpg', desc: 'Canchas de vidrio con blindex' },
    { id: 'tenis', name: 'Tenis', image: '/recuadro tenis.jpg', desc: 'Superficie de arcilla y rápida' },
    { id: 'bask', name: 'Básquetbol', image: '/recuadro basquetball.jpg', desc: 'Gimnasio techado profesional' },
    { id: 'voley', name: 'Voleibol', image: '/recuadro voleyball.jpg', desc: 'Canchas de arena profesional' },
    { id: 'pingpong', name: 'Mesas de Ping Pong', image: '/recuadro pingpong.jpg', desc: 'Salón indoor climatizado' },
  ];

const handleSelectCategory = (categoryId: string) => {
  if (!isLoggedIn) {
    setShowAuthModal(true);
  } else {
    setIsSidebarOpen(false); 
    router.push(`/cliente/horarios/${categoryId}`, 'forward', 'push');
  }
};

  return (
    <IonPage>
      <IonHeader translucent={true} className="header-custom-grande">
        <IonToolbar className="translucent-toolbar">
          <div className="toolbar-logo-container">
            <img src="/FaltaUno-Inicio.png" alt="FaltaUno Inicio" className="toolbar-logo-img" />
          </div>
          
          <IonButtons slot="end" style={{ marginRight: '16px', gap: '12px' }}>
            {isLoggedIn ? (
              <button className="btn-hamburger" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <IonIcon icon={menuOutline} />
              </button>
            ) : (
              <>
                <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: 'none', color: '#1e4b8f', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  Iniciar Sesion
                </button>
                <button onClick={() => router.push('/registro')} style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '999px', padding: '6px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.35)' }}>
                  REGISTRARSE
                </button>
              </>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding" style={{ '--background': 'url(/FondoMenuPrincipal.jpg) no-repeat center center fixed', backgroundSize: 'cover' } as React.CSSProperties}>
        <div className="welcome-section">
          <h2>¡Hola, {userName}! 👋</h2>
          <p>¿Qué deporte jugamos hoy? Selecciona una categoría para ver los horarios.</p>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <IonCard key={cat.id} className="category-card" onClick={() => handleSelectCategory(cat.id)}>
              <div className="card-image-container">
                <img src={cat.image} alt={cat.name} className="category-bg-image" />
                <div className="card-gradient-overlay"></div>
                <IonCardHeader className="card-header-absolute">
                  <IonCardTitle className="card-title-white">{cat.name}</IonCardTitle>
                </IonCardHeader>
              </div>
              <IonCardContent className="card-content-custom">
                <p>{cat.desc}</p>
                <IonButton fill="solid" color="light" expand="block" size="small" className="ion-margin-top btn-ver-horarios">
                  VER HORARIOS
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        {showAuthModal && (
          <div className="auth-modal-backdrop" onClick={() => setShowAuthModal(false)}>
            <div className="auth-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="auth-modal-icon-wrapper">
                <img src="/Simbolo error FaltaUno.png" alt="Alerta Iniciar Sesión" className="auth-error-icon" />
              </div>
              <h2 className="auth-modal-title">¡Inicia Sesion Para Continuar!</h2>
              <p className="auth-modal-message">Debes iniciar sesión o registrarte para poder reservar tu cancha y asegurar tu horario</p>
              <div className="auth-modal-actions">
                <button className="btn-modal-cancel" onClick={() => setShowAuthModal(false)}>Cancelar</button>
                <button className="btn-modal-login" onClick={() => { setShowAuthModal(false); router.push('/login'); }}>Inicia Sesion</button>
              </div>
            </div>
          </div>
        )}

        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* SIDEBAR */}
        <div className={`custom-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{ padding: '24px' }}>
            <div className="sidebar-menu-list">
              <button
                type="button"
                className="sidebar-item"
                onClick={() => {
                  setIsSidebarOpen(false);
                  router.push('/cliente/perfil?tab=datos');
                }}
              >
                <IonIcon icon={personOutline} />
                Datos Personales
              </button>

              <button
                type="button"
                className="sidebar-item"
                onClick={() => {
                  setIsSidebarOpen(false);
                  router.push('/cliente/perfil?tab=reservas');
                }}
              >
                <IonIcon icon={calendarOutline} />
                Mis Reservas
              </button>

              <button
                type="button"
                className="sidebar-item"
                onClick={() => {
                  setIsSidebarOpen(false);
                  router.push('/cliente/perfil?tab=pagos');
                }}
              >
                <IonIcon icon={cardOutline} />
                Métodos de Pago
              </button>
            </div>

            <hr className="sidebar-divider" />

            <button className="sidebar-btn-logout" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} /> Cerrar Sesión
            </button>
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default SearchCourts;