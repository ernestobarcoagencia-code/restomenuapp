import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Smart CSV Parser — "AI-like" heuristic extraction.
 * 
 * Handles two formats:
 * 1. Clean CSVs with headers like "Nombre", "Precio", etc.
 * 2. Messy web-scrape dumps (e.g. from PedidosYa) where data is scattered
 *    across wide rows with CSS class names as headers.
 * 
 * Strategy for messy CSVs:
 *   - Flatten all cells into a stream of values.
 *   - Walk through the stream looking for price patterns ($XX.XXX).
 *   - When a price is found, look backwards for the product name and description.
 *   - Look forward for the image URL.
 *   - Detect category names from known category markers.
 */

// Simple CSV parser that handles quoted fields
function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"';
                i++; // skip escaped quote
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(current.trim());
                current = '';
            } else if (char === '\n' || (char === '\r' && next === '\n')) {
                row.push(current.trim());
                if (row.some(cell => cell !== '')) {
                    rows.push(row);
                }
                row = [];
                current = '';
                if (char === '\r') i++; // skip \n after \r
            } else {
                current += char;
            }
        }
    }
    // Push last row
    row.push(current.trim());
    if (row.some(cell => cell !== '')) {
        rows.push(row);
    }
    return rows;
}

function isPrice(val: string): boolean {
    // Matches: $21.500, $19.000, 21500, 19000.00, etc.
    return /^\$?\s*[\d.,]+$/.test(val) && /\d/.test(val) && val.length >= 3;
}

function cleanPrice(val: string): number {
    // Remove $ and spaces
    let cleaned = val.replace(/[$\s]/g, '');
    // Handle Argentine format: 21.500 (dot as thousands separator)
    // If there's a dot followed by exactly 3 digits at end, it's thousands separator
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        cleaned = cleaned.replace(/\./g, '');
    }
    // Handle comma as decimal separator
    cleaned = cleaned.replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function isImageUrl(val: string): boolean {
    return (val.startsWith('http') && /\.(jpeg|jpg|png|webp|gif)/i.test(val)) ||
        val.includes('pedidosya.dhmedia.io/image') ||
        val.includes('rappi');
}

function isProductName(val: string): boolean {
    // A product name is typically 3-80 chars, contains letters, and is NOT a URL
    if (val.length < 2 || val.length > 120) return false;
    if (val.startsWith('http')) return false;
    if (val.startsWith('data:')) return false;
    if (/^[\d.,\s$]+$/.test(val)) return false; // pure number/price
    if (/^sc-/.test(val)) return false; // CSS class
    if (/^\d+ productos$/.test(val)) return false;
    return /[a-záéíóúñ]/i.test(val);
}

// Known UI/navigation text to skip
const SKIP_TEXTS = new Set([
    'menú', 'cerrar', 'mi pedido', 'tu pedido está vacío', 'entrega',
    'más vendido', 'opiniones', 'abre a las', 'sobre pedidosya',
    'términos y condiciones', 'privacidad', 'top comidas', 'top cadenas',
    'top ciudades', 'registra tu negocio', 'centro de socios',
    'libro de quejas online', 'botón de arrepentimiento',
    'pedidosya para tus colaboradores'
]);

function isUIText(val: string): boolean {
    const lower = val.toLowerCase();
    if (SKIP_TEXTS.has(lower)) return true;
    if (lower.includes('pedidosya ©')) return true;
    if (lower.includes('defensa de')) return true;
    if (lower.includes('ley nº')) return true;
    if (lower.includes('cuit:')) return true;
    if (lower.includes('notificaciones')) return true;
    if (/^\d+(\.\d+)?$/.test(val)) return true; // pure rating number like "4.9"
    if (/^\d+ opiniones$/.test(lower)) return true;
    if (lower.startsWith('abre a las')) return true;
    if (lower === 'entrega') return true;
    if (lower.startsWith('mailto:')) return true;
    return false;
}

// Known category patterns from PedidosYa scrapes
function isCategoryCandidate(val: string): boolean {
    if (val.length < 2 || val.length > 50) return false;
    if (val.startsWith('http')) return false;
    if (val.startsWith('data:')) return false;
    if (isPrice(val)) return false;
    if (isUIText(val)) return false;
    if (/^\d/.test(val) && !val.includes(' ')) return false;
    return /^[A-ZÁÉÍÓÚÑ]/.test(val) || /^[a-záéíóúñ]/.test(val);
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

        const rows = parseCSV(csv_content);

        if (rows.length === 0) {
            throw new Error('El archivo CSV está vacío.');
        }

        // Check if this is a "clean" CSV with recognizable headers
        const headers = rows[0].map(h => h.toLowerCase().trim());
        const hasCleanHeaders = headers.some(h =>
            ['nombre', 'name', 'producto', 'price', 'precio', 'categoria', 'category'].includes(h)
        );

        let items: any[] = [];

        if (hasCleanHeaders) {
            // ===== CLEAN CSV MODE =====
            const colMap = { name: -1, price: -1, description: -1, category: -1, image: -1 };
            const kw = {
                name: ['nombre', 'name', 'producto', 'product', 'titulo', 'title', 'plato', 'item'],
                price: ['precio', 'price', 'valor', 'costo', 'amount'],
                description: ['descripcion', 'descripción', 'description', 'detalle', 'detail', 'info'],
                category: ['categoria', 'categoría', 'category', 'tipo', 'group', 'seccion'],
                image: ['imagen', 'image', 'img', 'foto', 'url_imagen']
            };

            headers.forEach((h, i) => {
                if (colMap.name === -1 && kw.name.some(k => h.includes(k))) colMap.name = i;
                else if (colMap.price === -1 && kw.price.some(k => h.includes(k))) colMap.price = i;
                else if (colMap.description === -1 && kw.description.some(k => h.includes(k))) colMap.description = i;
                else if (colMap.category === -1 && kw.category.some(k => h.includes(k))) colMap.category = i;
                else if (colMap.image === -1 && kw.image.some(k => h.includes(k))) colMap.image = i;
            });

            if (colMap.name === -1 && headers.length > 0) colMap.name = 0;

            for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                const g = (idx: number) => idx !== -1 && row[idx] ? row[idx].trim() : '';
                const name = g(colMap.name);
                if (!name) continue;
                items.push({
                    name,
                    description: g(colMap.description),
                    price: cleanPrice(g(colMap.price)),
                    category: g(colMap.category) || 'General',
                    image_url: g(colMap.image) || null
                });
            }
        } else {
            // ===== MESSY / SCRAPE CSV MODE =====
            // Flatten all non-empty cells into a stream
            const stream: string[] = [];
            for (const row of rows) {
                for (const cell of row) {
                    if (cell && cell.trim()) {
                        stream.push(cell.trim());
                    }
                }
            }

            let currentCategory = 'General';

            // Walk the stream looking for price patterns
            // When a price is found, look backward for name + description
            for (let i = 0; i < stream.length; i++) {
                const val = stream[i];

                if (!isPrice(val)) continue;

                const price = cleanPrice(val);
                if (price <= 0) continue;

                // Look backward for product name and description
                // Pattern: [category?] [badge?] [name] [description] [price] [image?]
                let name = '';
                let description = '';
                let image_url: string | null = null;

                // Look back up to 4 positions for name/description
                const lookback: string[] = [];
                for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
                    const prev = stream[j];
                    if (isPrice(prev) || isImageUrl(prev)) break;
                    if (isUIText(prev)) continue;
                    if (prev.toLowerCase() === 'más vendido') continue;
                    if (isProductName(prev)) {
                        lookback.unshift(prev);
                    }
                }

                if (lookback.length >= 2) {
                    name = lookback[lookback.length - 2];
                    description = lookback[lookback.length - 1];
                } else if (lookback.length === 1) {
                    name = lookback[0];
                }

                // Look forward for image URL
                for (let j = i + 1; j <= Math.min(stream.length - 1, i + 2); j++) {
                    if (isImageUrl(stream[j])) {
                        image_url = stream[j];
                        break;
                    }
                }

                // Try to detect category: find the last "category-like" text before this product
                // that is NOT a product name/description
                for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
                    const prev = stream[j];
                    if (isPrice(prev)) break; // hit previous product
                    if (isCategoryCandidate(prev) && !isUIText(prev)) {
                        // Check if this looks like a category header
                        // Categories usually appear before a series of products
                        // Heuristic: if it's short (< 30 chars) and appears before products
                        if (prev.length <= 40) {
                            // Check it's not actually a product name we're about to use
                            if (prev !== name && prev !== description) {
                                currentCategory = prev;
                                break;
                            }
                        }
                    }
                }

                if (name) {
                    items.push({
                        name,
                        description,
                        price,
                        category: currentCategory,
                        image_url
                    });
                }
            }
        }

        // Deduplicate by name (in case of duplicate entries)
        const seen = new Set<string>();
        items = items.filter(item => {
            const key = item.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return new Response(
            JSON.stringify({ success: true, items, count: items.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
    }
})
