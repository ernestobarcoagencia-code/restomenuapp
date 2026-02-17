import React, { useState, useEffect } from 'react';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';
import { supabase } from '../lib/supabase';
import { Save, Loader2, CheckCircle, Upload, X } from 'lucide-react';

export const SettingsView: React.FC = () => {
    const { selectedRestaurant, refreshRestaurants } = useAdminRestaurant();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [globalDiscount, setGlobalDiscount] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (selectedRestaurant) {
            setName(selectedRestaurant.name);
            setSlug(selectedRestaurant.slug);
            setWhatsapp(selectedRestaurant.whatsapp_number || '');
            setGlobalDiscount(selectedRestaurant.global_discount_percent?.toString() || '');
            setBannerUrl(selectedRestaurant.banner_url || '');
            setLogoUrl(selectedRestaurant.logo_url || '');
        }
    }, [selectedRestaurant]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRestaurant) return;

        setLoading(true);
        setSuccess(false);

        const { error } = await supabase
            .from('restaurants')
            .update({
                name,
                slug,
                whatsapp_number: whatsapp,
                global_discount_percent: globalDiscount ? parseInt(globalDiscount) : 0,
                banner_url: bannerUrl,
                logo_url: logoUrl
            })
            .eq('id', selectedRestaurant.id);

        if (!error) {
            setSuccess(true);
            await refreshRestaurants();
            setTimeout(() => setSuccess(false), 3000);
        } else {
            console.error('Error updating restaurant:', error);
            alert('Error al guardar cambios. Verifica que el slug no esté duplicado.');
        }

        setLoading(false);
    };

    const handleLogoUpload = async (file: File) => {
        if (!selectedRestaurant) return;
        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;
            const filePath = `${selectedRestaurant.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

            setLogoUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Error al subir logo. Verifique los permisos.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleBannerUpload = async (file: File) => {
        if (!selectedRestaurant) return;
        setUploadingBanner(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `banner_${Date.now()}.${fileExt}`;
            const filePath = `${selectedRestaurant.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

            setBannerUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading banner:', error);
            alert('Error al subir banner. Verifique los permisos.');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) handleBannerUpload(blob);
            }
        }
    };

    if (!selectedRestaurant) return <div className="p-8">Selecciona un restaurante.</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
            <p className="text-gray-500 mb-8">Administra los datos generales de tu restaurante.</p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Restaurante</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Subdominio)</label>
                        <div className="flex items-center">
                            <span className="text-gray-400 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-sm">
                                https://
                            </span>
                            <input
                                type="text"
                                required
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                            />
                            <span className="text-gray-400 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 text-sm">
                                .barcoagencia.com
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Este es el identificador único de tu tienda.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de WhatsApp</label>
                        <input
                            type="text"
                            required
                            placeholder="54911..."
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">Formato internacional (ej: 5491171540523). Aquí llegarán los pedidos.</p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <label className="block text-sm font-bold text-orange-800 mb-1">Descuento Global (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                        <p className="text-xs text-orange-600 mt-1">Este descuento se aplicará a TODOS los productos que no tengan un descuento específico.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Banner Superior (Opcional)</label>
                        <div
                            onPaste={handlePaste}
                            className="space-y-3"
                        >
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={bannerUrl}
                                    onChange={(e) => setBannerUrl(e.target.value)}
                                    placeholder="URL de imagen externa (https://...)"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                />
                            </div>

                            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleBannerUpload(e.target.files[0]);
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="text-gray-500 flex flex-col items-center gap-2 group-hover:text-gray-700">
                                    {uploadingBanner ? (
                                        <Loader2 className="animate-spin text-orange-500" />
                                    ) : (
                                        <>
                                            <Upload size={32} className="text-gray-300 group-hover:text-gray-400" />
                                            <span className="text-sm font-medium">Click para subir o Arrastrar banner</span>
                                            <span className="text-xs text-orange-600 font-medium">(Ideal: 1920x600px)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {bannerUrl && (
                                <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setBannerUrl('')}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Guardar Cambios
                        </button>

                        {success && (
                            <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-left-2 duration-300">
                                <CheckCircle size={20} />
                                <span className="font-medium">Guardado exitosamente</span>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
