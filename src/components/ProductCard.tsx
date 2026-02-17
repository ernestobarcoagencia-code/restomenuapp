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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="relative aspect-video bg-gray-200">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    {product.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                    )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-lg text-gray-900">${product.price.toFixed(2)}</span>
                    <button
                        onClick={() => addItem(product)}
                        className="bg-orange-100 text-orange-600 p-2 rounded-full hover:bg-orange-200 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
