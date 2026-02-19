import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createWorker } from "https://esm.sh/tesseract.js@5.0.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Image Menu Parser (OCR + Smart Extraction)
 * 
 * 1. Receives an image (multipart/form-data).
 * 2. Uses Tesseract.js (WASM) to extract text.
 * 3. Reuses the "Smart CSV" logic to parse that text identifying products.
 */

// --- Smart Parser Logic (Copied/Shared from process-csv) ---

function isPrice(val: string): boolean {
    // Matches: $21.500, $19.000, 21500, 19000.00, etc.
    return /^\$?\s*[\d.,]+$/.test(val) && /\d/.test(val) && val.length >= 3;
}

function cleanPrice(val: string): number {
    let cleaned = val.replace(/[$\s]/g, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        cleaned = cleaned.replace(/\./g, '');
    }
    cleaned = cleaned.replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function isProductName(val: string): boolean {
    if (val.length < 3 || val.length > 120) return false;
    if (val.startsWith('http')) return false;
    if (/^[\d.,\s$]+$/.test(val)) return false;
    return /[a-záéíóúñ]/i.test(val);
}

// Known category patterns
function isCategoryCandidate(val: string): boolean {
    if (val.length < 3 || val.length > 40) return false;
    if (isPrice(val)) return false;
    return /^[A-ZÁÉÍÓÚÑ]/.test(val);
}

function parseExtractedText(text: string) {
    // Split by newlines, then flatten into a token stream for context analysis
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Simplistic stream approach:
    // Tesseract often outputs text in layout order.
    // Price usually follows or precedes description/name.

    let items: any[] = [];
    let currentCategory = 'General';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // If line looks like a category (standalone, uppercase-ish, short)
        if (isCategoryCandidate(line) && !isPrice(line) && !line.includes('$')) {
            // Heuristic: Check if next line is a product or price
            if (i + 1 < lines.length) {
                currentCategory = line;
                continue;
            }
        }

        // Try to find price in the line
        // Regex to find price at end or start
        const priceMatch = line.match(/(\$\s?[\d.,]+)|([\d.,]+\s?\$)/);

        if (priceMatch) {
            const priceStr = priceMatch[0];
            const price = cleanPrice(priceStr);

            // Remove price from line to get potential name/desc
            let content = line.replace(priceStr, '').trim();

            // If content is too short, maybe name was on previous line
            let name = content;
            let description = '';

            if (content.length < 3 && i > 0) {
                const prev = lines[i - 1];
                if (!isPrice(prev)) {
                    name = prev;
                }
            }

            // If we have a decent name
            if (isProductName(name)) {
                items.push({
                    name,
                    description,
                    price,
                    category: currentCategory,
                    image_url: null
                });
            }
        }
    }

    return items;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const formData = await req.formData();
        const imageFile = formData.get('image');

        if (!imageFile || !(imageFile instanceof File)) {
            throw new Error('No valid image file uploaded');
        }

        // Tesseract.js Worker
        const worker = await createWorker('spa'); // Spanish language

        // Convert File to ArrayBuffer for Tesseract
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const ret = await worker.recognize(buffer);
        const text = ret.data.text;

        await worker.terminate();

        console.log("OCR Text:", text);

        const items = parseExtractedText(text);

        return new Response(
            JSON.stringify({ success: true, items, text_debug: text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error: any) {
        console.error("OCR Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
    }
})
