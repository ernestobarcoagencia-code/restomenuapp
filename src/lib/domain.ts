export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Handle localhost
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // For testing, we can use a query param or a hardcoded fallback
        // Try to get from query param ?slug=...
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        if (slug) return slug;

        // Default fallback for dev (change this to test different tenants)
        return 'elbaqueanomartinez';
    }

    // Handle Vercel preview URLs (simplify to main or detect subdomain if complex)
    if (hostname.endsWith('.vercel.app')) {
        // If it's the main deployment, maybe act as admin or specific tenant?
        // For now, treat restomenuapp.vercel.app as Admin? Or let's say:
        const parts = hostname.split('.');
        if (parts.length >= 3) return parts[0];
        return null; // resolving to main app probably
    }

    // Handle Production Domains (e.g., elbaqueanomartinez.barcoagencia.com)
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0]; // Returns 'elbaqueanomartinez' from 'elbaqueanomartinez.barcoagencia.com'
    }

    return null; // Root domain or unrecognized
};

export const ADMIN_SUBDOMAIN = 'appmenuresto';
