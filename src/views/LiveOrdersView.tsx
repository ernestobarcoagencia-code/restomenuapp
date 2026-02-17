import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { Bell, Clock, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';

export const LiveOrdersView: React.FC = () => {
    const { selectedRestaurant } = useAdminRestaurant();
    const [orders, setOrders] = useState<Order[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchOrders = async () => {
        if (!selectedRestaurant) return;

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', selectedRestaurant.id)
            .order('created_at', { ascending: false });

        if (!error && data) setOrders(data);
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
    };

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    useEffect(() => {
        if (!selectedRestaurant) return;

        fetchOrders();

        const channel = supabase
            .channel('orders-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${selectedRestaurant.id}`
                },
                (payload) => {
                    console.log('New Order!', payload);
                    setOrders(prev => [payload.new as Order, ...prev]);
                    playNotificationSound();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedRestaurant]);

    const updateStatus = async (id: string, status: Order['status']) => {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id);

        if (!error) {
            setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
        }
    };

    if (!selectedRestaurant) return <div className="p-8">Selecciona un restaurante.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pedidos en Vivo</h1>
                    <p className="text-gray-500 mt-1">Gestiona las órdenes entrantes en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">Conectado</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{order.customer_name}</h3>
                                <p className="text-sm text-gray-500">{order.customer_phone}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                {order.type === 'delivery' ? <Clock size={16} /> : <Package size={16} />}
                                <span className="capitalize">{order.type === 'delivery' ? 'Envío a domicilio' : 'Retiro en local'}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                                <Clock size={12} />
                                <span>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                <span className="font-bold text-xl">${order.total}</span>
                                <div className="flex gap-2">
                                    {order.status === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(order.id, 'confirmed')}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                                        >
                                            Confirmar
                                        </button>
                                    )}
                                    {order.status === 'confirmed' && (
                                        <button
                                            onClick={() => updateStatus(order.id, 'completed')}
                                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700"
                                        >
                                            Completar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No hay pedidos recientes.</p>
                </div>
            )}

            {/* Hidden Audio Element */}
            <button
                onClick={playNotificationSound}
                className="fixed bottom-4 right-4 bg-gray-900 text-white p-2 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                title="Test Sound"
            >
                <Bell size={20} />
            </button>
        </div>
    );
};
