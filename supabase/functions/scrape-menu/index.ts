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
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (url.includes('rappi')) {
            // Rappi Strategy: __NEXT_DATA__
            const nextDataScript = doc.getElementById('__NEXT_DATA__');
            if (nextDataScript) {
                const json = JSON.parse(nextDataScript.textContent);
                const props = json.props?.pageProps;
                const fallback = props?.fallback || {};

                // Find the store key in fallback (usually starts with 'store/store-')
                const storeKey = Object.keys(fallback).find(k => k.startsWith('store/store-') || k.includes('store'));
                const storeData = fallback[storeKey];

                if (storeData) {
                    restaurantName = storeData.name;
                    const menuCorridors = storeData.corridors || [];

                    for (const corridor of menuCorridors) {
                        const categoryName = corridor.name;
                        const products = corridor.products || [];

                        for (const product of products) {
                            items.push({
                                category: categoryName,
                                name: product.name,
                                description: product.description,
                                price: product.price,
                                image_url: product.image_url || product.image || null, // Rappi varies
                                rappi_id: product.id
                            });
                        }
                    }
                }
            }
        } else if (url.includes('pedidosya')) {
            // PedidosYa Strategy: __PRELOADED_STATE__
            // They often embed state in a script tag with window.__PRELOADED_STATE__ = ...
            const scripts = doc.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.textContent.includes('__PRELOADED_STATE__')) {
                    const content = script.textContent;
                    // Extract JSON between first { and last } logic is tricky, usually it's an assignment
                    // window.__PRELOADED_STATE__ = { ... };
                    const match = content.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});/s) || content.match(/__PRELOADED_STATE__\s*=\s*(\{.*?\});/s);

                    if (match && match[1]) {
                        try {
                            const json = JSON.parse(match[1]);
                            const restaurant = json.restaurant?.details;
                            const menu = json.restaurant?.menu;

                            if (restaurant) restaurantName = restaurant.name;

                            if (menu && menu.sections) {
                                for (const section of menu.sections) {
                                    const categoryName = section.name;
                                    for (const product of section.products) {
                                        items.push({
                                            category: categoryName,
                                            name: product.name,
                                            description: product.description,
                                            price: product.price,
                                            image_url: product.image?.url || null
                                        });
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing PedidosYa JSON", e);
                        }
                    }
                }
            }
        }

        // Fallback/Mock if scraping fails (for demo reliability if blocked)
        if (items.length === 0) {
            // console.log("Scraping failed or yielded no items. Returning mock data for demonstration.");
            // items = [ ... mock data ... ]
            // For now, let's return what we found, even if empty, so the UI can handle "No items found".
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
