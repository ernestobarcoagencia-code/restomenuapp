import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, LogOut, Store, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminRestaurant } from '../../context/AdminRestaurantContext';
import type { Restaurant } from '../../types';

export const AdminSidebar: React.FC = () => {
    const { restaurants, selectedRestaurant, setSelectedRestaurant } = useAdminRestaurant();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold">
                        B
                    </div>
                    <span className="font-bold text-lg">Barco Admin</span>
                </div>

                {/* Restaurant Selector */}
                <div className="relative">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Restaurante</label>
                    <div className="relative">
                        <select
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 appearance-none focus:ring-1 focus:ring-orange-500 outline-none text-sm"
                            value={selectedRestaurant?.id || ''}
                            onChange={(e) => {
                                const resto = restaurants.find((r: Restaurant) => r.id === e.target.value);
                                if (resto) setSelectedRestaurant(resto);
                            }}
                        >
                            {restaurants.map((r: Restaurant) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <Store className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                    }
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/orders"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                    }
                >
                    <ShoppingBag size={20} />
                    <div className="flex justify-between flex-1 items-center">
                        <span>Pedidos</span>
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">Live</span>
                    </div>
                </NavLink>

                <NavLink
                    to="/menu"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                    }
                >
                    <UtensilsCrossed size={20} />
                    <span>Menú</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                    }
                >
                    <Settings size={20} />
                    <span>Configuración</span>
                </NavLink>

                <div className="pt-4 mt-auto">
                    <a
                        href={`/?slug=${selectedRestaurant?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 rounded-lg transition-colors border border-blue-900/30"
                    >
                        <ExternalLink size={20} />
                        <span>Ver Menú Online</span>
                    </a>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg w-full transition-colors"
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};
