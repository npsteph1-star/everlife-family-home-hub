import React, { useState } from 'react';
import { DataProvider } from './utils/DataContext.jsx';
import Navigation from './components/Navigation.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Family from './pages/Family.jsx';
import Chores from './pages/Chores.jsx';
import Rewards from './pages/Rewards.jsx';
import Economy from './pages/Economy.jsx';
import Routines from './pages/Routines.jsx';
import Calendar from './pages/Calendar.jsx';
import Meals from './pages/Meals.jsx';
import Education from './pages/Education.jsx';
import Communication from './pages/Communication.jsx';
import Settings from './pages/Settings.jsx';
import Audit from './pages/Audit.jsx';

export default function App() {
  const [active, setActive] = useState('dashboard');

  const renderPage = () => {
    switch (active) {
      case 'dashboard':     return <Dashboard setActive={setActive} />;
      case 'family':        return <Family />;
      case 'chores':        return <Chores />;
      case 'rewards':       return <Rewards />;
      case 'economy':       return <Economy />;
      case 'routines':      return <Routines />;
      case 'calendar':      return <Calendar />;
      case 'meals':         return <Meals />;
      case 'education':     return <Education />;
      case 'communication': return <Communication />;
      case 'settings':      return <Settings setActive={setActive} />;
      case 'audit':         return <Audit />;
      default:              return <Dashboard setActive={setActive} />;
    }
  };

  return (
    <DataProvider>
      <Navigation active={active} setActive={setActive} />
      <main className="content" id="main-content">
        {renderPage()}
      </main>
    </DataProvider>
  );
}
