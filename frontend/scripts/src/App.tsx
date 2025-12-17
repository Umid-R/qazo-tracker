import { useState } from 'react';
import HomePage from './pages/HomePage';
import LogPage from './pages/LogPage';
import StatsPage from './pages/StatsPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/BottomNav';

type Page = 'home' | 'log' | 'stats' | 'calendar' | 'profile';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'log':
        return <LogPage />;
      case 'stats':
        return <StatsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20">
        {renderPage()}
      </div>
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

export default App;
