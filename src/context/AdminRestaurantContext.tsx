import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Restaurant } from '../types';

interface AdminRestaurantContextType {
    restaurants: Restaurant[];
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: (restaurant: Restaurant) => void;
    loading: boolean;
    refreshRestaurants: () => Promise<void>;
}

const AdminRestaurantContext = createContext<AdminRestaurantContextType | undefined>(undefined);

export const AdminRestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRestaurants = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching restaurants:', error);
        } else {
            setRestaurants(data || []);

            // If we have a selected restaurant, update it with fresh data
            if (selectedRestaurant) {
                const updated = data?.find(r => r.id === selectedRestaurant.id);
                if (updated) setSelectedRestaurant(updated);
            }
            // Default to first one if none selected
            else if (data && data.length > 0) {
                setSelectedRestaurant(data[0]);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    return (
        <AdminRestaurantContext.Provider value={{
            restaurants,
            selectedRestaurant,
            setSelectedRestaurant,
            loading,
            refreshRestaurants: fetchRestaurants
        }}>
            {children}
        </AdminRestaurantContext.Provider>
    );
};

export const useAdminRestaurant = () => {
    const context = useContext(AdminRestaurantContext);
    if (!context) {
        throw new Error('useAdminRestaurant must be used within an AdminRestaurantProvider');
    }
    return context;
};
