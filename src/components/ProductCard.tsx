import React from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { useCartStore } from '../store/cart';

interface ProductCardProps {
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const addItem = useCartStore((state) => state.addItem);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-row h-32 md:h-auto md:flex-col group">
            {/* Image Section */}
            <div className="w-32 md:w-full md:aspect-video bg-gray-100 relative overflow-hidden flex-shrink-0">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-4xl">🍽️</span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-3 md:p-4 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</h3>
                    {product.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 md:line-clamp-3 leading-relaxed">{product.description}</p>
                    )}
                </div>

                <div className="mt-2 flex items-end justify-between">
                    <span className="font-bold text-lg text-gray-900">${product.price.toLocaleString('es-AR')}</span>
                    <button
                        onClick={() => addItem(product)}
                        className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
