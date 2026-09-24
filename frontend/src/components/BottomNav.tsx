import { Home, Plus, Calendar, User } from 'lucide-react';

type Page = 'home' | 'log' | 'calendar' | 'profile';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems: { id: Page; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <Home size={22} />, label: 'Home' },
    { id: 'log', icon: <Plus size={22} />, label: 'Log' },
    { id: 'calendar', icon: <Calendar size={22} />, label: 'Calendar' },
    { id: 'profile', icon: <User size={22} />, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-900/95 backdrop-blur-md border-t border-surface-800">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 ${
              currentPage === item.id ? 'text-primary-500 scale-110' : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
