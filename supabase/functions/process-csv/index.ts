import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { csv_content } = await req.json();

        if (!csv_content) {
            throw new Error('CSV content is required');
        }

        // Parse CSV
        const result = await parse(csv_content, { skipFirstRow: false });

        if (result.length === 0) {
            throw new Error('El archivo CSV está vacío.');
        }

        // "AI" Smart Column Detection
        // Heuristic: Score headers based on keywords
        const headers = result[0].map((h: string) => h.toLowerCase().trim());

        const columnMap = {
            name: -1,
            price: -1,
            description: -1,
            category: -1,
            image: -1
        };

        const keywords = {
            name: ['nombre', 'name', 'producto', 'product', 'titulo', 'title', 'plato', 'item'],
            price: ['precio', 'price', 'valor', 'costo', 'amount'],
            description: ['descripcion', 'descripción', 'description', 'detalle', 'detail', 'info'],
            category: ['categoria', 'categoría', 'category', 'tipo', 'group', 'seccion'],
            image: ['imagen', 'image', 'img', 'foto', 'url', 'src']
        };

        // Find best matching column info
        headers.forEach((header, index) => {
            if (keywords.name.some(k => header.includes(k)) && columnMap.name === -1) columnMap.name = index;
            else if (keywords.price.some(k => header.includes(k)) && columnMap.price === -1) columnMap.price = index;
            else if (keywords.description.some(k => header.includes(k)) && columnMap.description === -1) columnMap.description = index;
            else if (keywords.category.some(k => header.includes(k)) && columnMap.category === -1) columnMap.category = index;
            else if (keywords.image.some(k => header.includes(k)) && columnMap.image === -1) columnMap.image = index;
        });

        // Fallbacks if not found explicitly but maybe by position?
        // If we found nothing, let's assume Order: Name, Description, Price
        if (columnMap.name === -1 && headers.length > 0) columnMap.name = 0;
        if (columnMap.price === -1 && headers.length > 1) {
            // Try to find a column with numbers
            // This is risky, let's just default to looking for keywords. 
            // If price is missing, user will have to manual entry or fix CSV.
        }

        const items = [];
        const rows = result.slice(1); // Skip header

        for (const row of rows) {
            // Helper to get safe value
            const getVal = (idx: number) => idx !== -1 && row[idx] ? row[idx].trim() : '';

            const name = getVal(columnMap.name);
            const priceStr = getVal(columnMap.price);
            const description = getVal(columnMap.description);
            const category = getVal(columnMap.category) || 'General'; // Default category
            const image = getVal(columnMap.image);

            // Clean price
            const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

            if (name) {
                items.push({
                    name,
                    description,
                    price,
                    category,
                    image_url: image || null
                });
            }
        }

        return new Response(
            JSON.stringify({ success: true, items, count: items.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
    }
})
