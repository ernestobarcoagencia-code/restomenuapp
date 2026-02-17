import React, { useState } from 'react';
import { X, Trash2, MessageCircle } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { supabase } from '../lib/supabase';


interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
    const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const orderTotal = total();

            // 1. Save to Supabase
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_name: name,
                    customer_phone: phone,
                    type: deliveryType,
                    status: 'pending',
                    total: orderTotal
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_time: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 2. Redirect to WhatsApp
            const message = `*Nuevo Pedido #${orderData.id.slice(0, 8)}*
------------------------
*Cliente:* ${name}
*Tipo:* ${deliveryType === 'delivery' ? '🛵 Envío a Domicilio' : '🥡 Retiro por Local'}
------------------------
${items.map(item => `${item.quantity}x ${item.name} ($${item.price})`).join('\n')}
------------------------
*Total: $${orderTotal}*`;

            const whatsappUrl = `https://wa.me/5491171540523?text=${encodeURIComponent(message)}`;

            clearCart();
            onClose();
            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error('Error placing order:', error);
            alert('Hubo un error al procesar tu pedido. Por favor intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md bg-white shadow-xl flex flex-col">
                    <div className="flex items-center justify-between px-4 py-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Tu Pedido</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {items.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                Tu carrito está vacío.
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin foto</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                                        <p className="text-sm text-gray-500">${item.price}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                            >-</button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                            >+</button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 self-start"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                            <form onSubmit={handleCheckout} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2 bg-white border"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2 bg-white border"
                                        placeholder="Tu teléfono (ej. 11...)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Entrega</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryType('delivery')}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border ${deliveryType === 'delivery' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                        >
                                            🛵 Envío
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryType('pickup')}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border ${deliveryType === 'pickup' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                        >
                                            🥡 Retiro
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-semibold text-gray-900">Total</span>
                                        <span className="font-bold text-xl text-gray-900">${total().toFixed(2)}</span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Procesando...' : (
                                            <>
                                                <MessageCircle size={20} />
                                                Enviar Pedido por WhatsApp
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
