import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types';
import { Header } from '../components/Header';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductCard } from '../components/ProductCard';
import { CartSidebar } from '../components/CartSidebar';
import { Loader2 } from 'lucide-react';

export const PublicMenu: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [categoriesRes, productsRes] = await Promise.all([
                supabase.from('categories').select('*').order('sort_order'),
                supabase.from('products').select('*').eq('is_available', true)
            ]);

            if (categoriesRes.error) throw categoriesRes.error;
            if (productsRes.error) throw productsRes.error;

            setCategories(categoriesRes.data || []);
            setProducts(productsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header onOpenCart={() => setIsCartOpen(true)} />

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
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </main>

            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};
