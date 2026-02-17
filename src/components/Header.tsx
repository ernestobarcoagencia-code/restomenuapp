import React from 'react';
import { ShoppingBag, MapPin } from 'lucide-react';
import { useCartStore } from '../store/cart';

interface HeaderProps {
    onOpenCart: () => void;
    restaurantName?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, restaurantName = 'Restaurante Demo' }) => {
    const items = useCartStore((state) => state.items);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {restaurantName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">{restaurantName}</h1>
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <MapPin size={12} />
                            <span>Buenos Aires</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onOpenCart}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ShoppingBag size={24} />
                    {itemCount > 0 && (
                        <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {itemCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};
