import React from 'react';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';
import { TrendingUp, DollarSign, Users, ShoppingBag } from 'lucide-react';

export const DashboardHome: React.FC = () => {
    const { selectedRestaurant } = useAdminRestaurant();

    if (!selectedRestaurant) return null;

    // Stat Card Component
    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                    <Icon className={color.replace('bg-', 'text-')} size={24} />
                </div>
                {trend && (
                    <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
                        <TrendingUp size={14} className="mr-1" />
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Hola, Administrador</h1>
                <p className="text-gray-500 mt-2">Bienvenido al panel de control de <span className="font-semibold text-gray-900">{selectedRestaurant.name}</span>.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Ventas de Hoy"
                    value="$154,200"
                    icon={DollarSign}
                    color="bg-green-500 text-green-600"
                    trend="+12%"
                />
                <StatCard
                    title="Pedidos Activos"
                    value="8"
                    icon={ShoppingBag}
                    color="bg-orange-500 text-orange-600"
                />
                <StatCard
                    title="Clientes Nuevos"
                    value="12"
                    icon={Users}
                    color="bg-blue-500 text-blue-600"
                    trend="+4%"
                />
                <StatCard
                    title="Ticket Promedio"
                    value="$12,850"
                    icon={TrendingUp}
                    color="bg-purple-500 text-purple-600"
                />
            </div>

            {/* Placeholder for Revenue Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex items-center justify-center text-gray-400">
                <p>Gráfico de Ventas Mensuales (Próximamente)</p>
            </div>
        </div>
    );
};
