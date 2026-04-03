import { 
  Search, 
  Bell, 
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { getStoredUser } from '@/src/lib/auth';

function getInitials(name, username) {
  const source = String(name || username || '').trim();
  if (!source) return 'U';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function Navbar({ darkMode, setDarkMode, onLogout }) {
  const user = getStoredUser();
  const fullName = user?.fullName || user?.username || 'User';
  const role = user?.role || 'Logged In User';
  const initials = getInitials(user?.fullName, user?.username);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-40 sticky top-0">
      <div className="flex items-center flex-1">
        <div className="relative w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search dashboard, users, settings..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-[border-color,box-shadow,background-color] duration-200 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <button
          onClick={onLogout}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-none">{fullName}</p>
            <p className="text-xs text-gray-500 mt-1">{role}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm group-hover:shadow-md transition-all">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
