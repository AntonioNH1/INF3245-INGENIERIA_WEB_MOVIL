import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, useIonRouter } from '@ionic/react';
import './SearchCourts.css';

const SearchCourts: React.FC = () => {
  const [userName, setUserName] = useState('Usuario');
  const router = useIonRouter();

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

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
    router.push(`/cliente/horarios/${categoryId}`);
  };

  return (
    <IonPage>
    <IonHeader translucent={true} className="header-custom-grande">
        <IonToolbar className="translucent-toolbar">
          <div className="toolbar-logo-container">
            <img src="/FaltaUno-Inicio.png" alt="FaltaUno Inicio" className="toolbar-logo-img" />
          </div>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding" style={{ '--background': 'url(/FondoMenuPrincipal.jpg) no-repeat center center fixed', 'backgroundSize': 'cover' }}>
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
      </IonContent>
    </IonPage>
  );
};

export default SearchCourts;