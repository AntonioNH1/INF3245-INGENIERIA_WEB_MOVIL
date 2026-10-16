
import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import Login from './pages/Login';
import Register from './pages/Register';
import SearchCourts from './pages/SearchCourts';
import AdminCalendar from './pages/AdminCalendar';
import CourtSchedule from './pages/CourtSchedule';
import Profile from './pages/Profile';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/background.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/login" element={<Login />} />
        <Route path="/cliente/inicio" element={<SearchCourts />} />
        <Route path="/cliente/perfil" element={<Profile />} />
        <Route path="/admin/calendario" element={<AdminCalendar />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/cliente/horarios/:id" element={<CourtSchedule />} />

        <Route path="/" element={<Navigate to="/cliente/inicio" replace />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
