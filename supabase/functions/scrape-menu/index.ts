import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json();

        if (!url) {
            throw new Error('URL is required');
        }

        let items = [];
        let restaurantName = '';

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.statusText}`);
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (url.includes('rappi')) {
            // Rappi Strategy
            try {
                const nextDataScript = doc.getElementById('__NEXT_DATA__');
                if (nextDataScript) {
                    const json = JSON.parse(nextDataScript.textContent);
                    const props = json.props?.pageProps;
                    const fallback = props?.fallback || {};
                    const storeKey = Object.keys(fallback).find(k => k.startsWith('store/store-') || k.includes('store'));
                    const storeData = fallback[storeKey];

                    if (storeData) {
                        restaurantName = storeData.name;
                        const menuCorridors = storeData.corridors || [];
                        for (const corridor of menuCorridors) {
                            for (const product of (corridor.products || [])) {
                                items.push({
                                    category: corridor.name,
                                    name: product.name,
                                    description: product.description,
                                    price: product.price,
                                    image_url: product.image_url || product.image || null
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Rappi parsing error:", e);
            }
        } else if (url.includes('pedidosya')) {
            // PedidosYa Strategy
            try {
                const scripts = doc.getElementsByTagName('script');
                for (let script of scripts) {
                    if (script.textContent.includes('__PRELOADED_STATE__')) {
                        const content = script.textContent;
                        const match = content.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});/s) || content.match(/__PRELOADED_STATE__\s*=\s*(\{.*?\});/s);
                        if (match && match[1]) {
                            const json = JSON.parse(match[1]);
                            const restaurant = json.restaurant?.details;
                            const menu = json.restaurant?.menu;

                            if (restaurant) restaurantName = restaurant.name;
                            if (menu && menu.sections) {
                                for (const section of menu.sections) {
                                    for (const product of section.products) {
                                        items.push({
                                            category: section.name,
                                            name: product.name,
                                            description: product.description,
                                            price: product.price,
                                            image_url: product.image?.url || null
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("PedidosYa parsing error:", e);
            }
        }

        return new Response(
            JSON.stringify({ success: true, restaurantName, items, count: items.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
    }
})
