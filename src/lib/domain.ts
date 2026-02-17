export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Handle localhost
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // Allow testing subdomains locally like: admin.localhost or elbaqueano.localhost
        // NOTE: Requires adding "127.0.0.1 admin.localhost" etc. to /etc/hosts
        const parts = hostname.split('.');
        if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
            return parts[0];
        }

        // Fallback: Query Param ?slug=...
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        if (slug) return slug;

        // Default fallback for simple localhost:3000
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
