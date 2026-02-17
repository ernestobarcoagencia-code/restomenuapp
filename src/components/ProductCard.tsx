import React from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { useCartStore } from '../store/cart';
import clsx from 'clsx';

interface ProductCardProps {
    product: Product;
    globalDiscount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, globalDiscount = 0 }) => {
    const addItem = useCartStore((state) => state.addItem);

    // Calculate final price and discount info
    let finalPrice = product.price;
    let hasDiscount = false;
    let discountBadge = '';

    if (product.discount_price) {
        finalPrice = product.discount_price;
        hasDiscount = true;
        const percent = Math.round(((product.price - product.discount_price) / product.price) * 100);
        discountBadge = `${percent}% OFF`;
    } else if (product.discount_percent) {
        finalPrice = product.price * (1 - product.discount_percent / 100);
        hasDiscount = true;
        discountBadge = `${product.discount_percent}% OFF`;
    } else if (globalDiscount > 0) {
        finalPrice = product.price * (1 - globalDiscount / 100);
        hasDiscount = true;
        discountBadge = `${globalDiscount}% OFF`;
    }

    // Ensure we don't show decimal prices if not needed (optional, or standard fixed(2))
    // For ARS usually whole numbers or 2 decimals. Let's keep it simple.

    // Override addItem to add the stored price - wait, cart usually recalculates or stores price snapshot. 
    // The current CartItem interface extends Product.
    // If we want the cart to reflect the discounted price, we might need to update how we add items.
    // However, for now, let's just assume the cart uses the product.price or we need to pass the discounted price.
    // Actually, looking at types, OrderItem has price_at_time.
    // The cart logic (useCartStore) likely just duplicates the product. 
    // We should probably inject the discounted price into the item being added to cart.

    const handleAddToCart = () => {
        addItem({
            ...product, // Original product data
            price: finalPrice // Override price with discounted one for the cart
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-row h-32 md:h-auto md:flex-col group relative">
            {/* Badge */}
            {hasDiscount && (
                <div className="absolute top-0 left-0 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-sm">
                    {discountBadge}
                </div>
            )}

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
                    <div className="flex flex-col">
                        {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">${product.price.toLocaleString('es-AR')}</span>
                        )}
                        <span className={clsx("font-bold text-gray-900", hasDiscount ? "text-red-600 text-lg" : "text-lg")}>
                            ${finalPrice.toLocaleString('es-AR')}
                        </span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
