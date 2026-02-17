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
        <header className="bg-white sticky top-0 z-50 border-b border-gray-100 backdrop-blur-md bg-opacity-90">
            <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {restaurantName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-none text-lg">{restaurantName}</h1>
                        <div className="flex items-center text-xs text-green-600 gap-1 mt-1 font-medium bg-green-50 px-2 py-0.5 rounded-full self-start w-fit">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Abierto ahora</span>
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
