import React from 'react';
import { AdminSidebar } from '../components/admin/Sidebar';
import { Outlet } from 'react-router-dom';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';
import { Loader2 } from 'lucide-react';

export const AdminLayout: React.FC = () => {
    const { loading } = useAdminRestaurant();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen flex">
            <AdminSidebar />
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};
