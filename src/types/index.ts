export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    custom_domain: string | null;
    logo_url: string | null;
    whatsapp_number: string;
    theme_colors?: any;
    global_discount_percent?: number;
}

export interface Category {
    id: string;
    restaurant_id: string;
    name: string;
    sort_order: number;
}

export interface Product {
    id: string;
    restaurant_id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    image_path?: string | null;
    is_available: boolean;
    discount_price?: number;
    discount_percent?: number;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id: string;
    restaurant_id: string;
    customer_name: string;
    customer_phone: string;
    type: 'delivery' | 'pickup';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    total: number;
    note?: string;
    created_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price_at_time: number;
    product?: Product;
}
