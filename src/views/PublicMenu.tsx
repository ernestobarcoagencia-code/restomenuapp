import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Category, Product, Restaurant } from '../types';
import { Header } from '../components/Header';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductCard } from '../components/ProductCard';
import { CartSidebar } from '../components/CartSidebar';
import { Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { useCartStore } from '../store/cart';

interface PublicMenuProps {
    slug: string;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({ slug }) => {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Store
    const clearCart = useCartStore(state => state.clearCart);

    useEffect(() => {
        fetchRestaurantData();
        // Clear cart when mounting a menu (safety for multi-tenant switching)
        clearCart();
    }, [slug]);

    const fetchRestaurantData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Get Restaurant by Slug
            const { data: resto, error: restoError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('slug', slug)
                .single();

            if (restoError || !resto) {
                console.error('Restaurant not found:', restoError);
                setError('Restaurante no encontrado.');
                return;
            }

            setRestaurant(resto);

            // 2. Get Categories & Products for this Restaurant
            const [categoriesRes, productsRes] = await Promise.all([
                supabase.from('categories').select('*').eq('restaurant_id', resto.id).order('sort_order'),
                supabase.from('products').select('*').eq('restaurant_id', resto.id).eq('is_available', true)
            ]);

            if (categoriesRes.error) throw categoriesRes.error;
            if (productsRes.error) throw productsRes.error;

            setCategories(categoriesRes.data || []);
            setProducts(productsRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Hubo un error al cargar el menú.');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category_id === activeCategory);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h1>
                <p className="text-gray-600">{error || 'No se pudo cargar la información.'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Pass restaurant details to Header if needed, for now using static prop or verify if Header takes props */}
            <Header
                onOpenCart={() => setIsCartOpen(true)}
                restaurantName={restaurant.name}
                logoUrl={restaurant.logo_url}
            />

            {restaurant.banner_url && (
                <div className="w-full h-48 md:h-64 lg:h-80 relative bg-gray-200">
                    <img
                        src={restaurant.banner_url}
                        alt="Restaurante Banner"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>
            )}

            {/* Restaurant Idenitity Overlay */}
            <div className="max-w-md mx-auto px-4 relative -mt-20 mb-6 z-10 flex flex-col items-center text-center">
                {restaurant.logo_url ? (
                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white mb-3">
                        <img
                            src={restaurant.logo_url}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-white shadow-xl overflow-hidden bg-orange-500 mb-3 flex items-center justify-center text-white text-5xl font-bold">
                        {restaurant.name.charAt(0)}
                    </div>
                )}

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 drop-shadow-sm">{restaurant.name}</h1>
                <div className="flex items-center gap-2 mt-2 justify-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Abierto ahora
                    </span>
                </div>
            </div>

            <CategoryFilter
                categories={categories}
                activeId={activeCategory}
                onSelect={setActiveCategory}
            />

            <main className="max-w-md mx-auto px-4 py-6">
                <h2 className="font-bold text-xl text-gray-900 mb-4">
                    {activeCategory === 'all' ? 'Todos los productos' : categories.find(c => c.id === activeCategory)?.name}
                </h2>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500">No hay productos disponibles.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                globalDiscount={restaurant.global_discount_percent}
                            />
                        ))}
                    </div>
                )}
            </main>

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                whatsappNumber={restaurant.whatsapp_number}
                restaurantId={restaurant.id}
            />

            {/* Floating WhatsApp Button */}
            {restaurant.whatsapp_number && (
                <a
                    href={`https://wa.me/${restaurant.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-40 flex items-center justify-center animate-in fade-in zoom-in duration-300"
                    aria-label="Contactar por WhatsApp"
                >
                    <MessageCircle size={28} />
                </a>
            )}
        </div>
    );
};
