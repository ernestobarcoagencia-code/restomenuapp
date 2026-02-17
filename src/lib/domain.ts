export const getSubdomain = () => {
    // 1. Prioritize Query Param (allows testing/overriding anywhere)
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    if (slug) return slug;

    const hostname = window.location.hostname;

    // Handle localhost
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // Allow testing subdomains locally like: admin.localhost or elbaqueano.localhost
        // NOTE: Requires adding "127.0.0.1 admin.localhost" etc. to /etc/hosts
        const parts = hostname.split('.');
        if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
            return parts[0];
        }

        // Default fallback for simple localhost:3000
        return 'elbaqueanomartinez';
    }

    // Handle Production / Vercel
    // If hostname is "restomenuapp.vercel.app" -> parts[0] is "restomenuapp"
    // If hostname is "admin.restomenuapp.com" -> parts[0] is "admin"
    const parts = hostname.split('.');

    // Logic: Return the first part as the subdomain/slug
    if (parts.length >= 2) {
        // Exclude common prefixes if necessary, or just return first part
        if (parts[0] === 'www') return parts[1];
        return parts[0];
    }

    return null; // Root domain or unrecognized
};

export const ADMIN_SUBDOMAIN = 'appmenuresto';
