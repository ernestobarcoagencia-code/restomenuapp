import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cart';

interface HeaderProps {
    onOpenCart: () => void;
    restaurantName?: string;
    logoUrl?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, restaurantName = 'Restaurante Demo' }) => {
    const items = useCartStore((state) => state.items);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <header className="bg-white sticky top-0 z-50 border-b border-gray-100 backdrop-blur-md bg-opacity-90">
            <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Minimal Header: Show name only small or optional. 
                        For now, keeping name but removing the small logo/avatar since we have the big one.
                    */}
                    <h1 className="font-bold text-gray-900 text-lg">{restaurantName}</h1>
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
