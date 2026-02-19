import React, { useState, useEffect } from 'react';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';
import { supabase } from '../lib/supabase';
import type { Category, Product } from '../types';
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X, Loader2, List, Upload, Download } from 'lucide-react';
import clsx from 'clsx';

export const MenuManagerView: React.FC = () => {
    const { selectedRestaurant } = useAdminRestaurant();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        image_path: '',
        is_available: true,
        discount_price: '',
        discount_percent: ''
    });
    const [uploading, setUploading] = useState(false);

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importInstructions, setImportInstructions] = useState(''); // New state
    const [isImporting, setIsImporting] = useState(false);

    const handleImportMenu = async () => {
        if (!importUrl) return;
        setIsImporting(true);
        try {
            const { data, error } = await supabase.functions.invoke('scrape-menu', {
                body: { url: importUrl, instructions: importInstructions }
            });

            if (error) throw error;

            if (data.items && data.items.length > 0) {
                // 1. Ensure categories exist
                // Note: In real usage, we should probably batch this or ask for confirmation.
                const uniqueCategories = [...new Set(data.items.map((i: any) => i.category))];
                for (const catName of uniqueCategories) {
                    if (!catName) continue;
                    let cat = categories.find(c => c.name === catName);
                    if (!cat) {
                        await supabase.from('categories').insert({
                            restaurant_id: selectedRestaurant?.id,
                            name: catName,
                            sort_order: categories.length * 10
                        });
                        // Optimistic update or just rely on refreshData at end
                    }
                }

                // Refresh categories to get new IDs
                const { data: currentCats } = await supabase.from('categories').select('*').eq('restaurant_id', selectedRestaurant?.id);

                const productsToInsert = data.items.map((item: any) => {
                    const catId = currentCats?.find((c: any) => c.name === item.category)?.id;
                    if (!catId) return null;

                    return {
                        restaurant_id: selectedRestaurant?.id,
                        category_id: catId,
                        name: item.name,
                        description: item.description,
                        price: item.price,
                        image_url: item.image_url,
                        is_available: true
                    };
                }).filter((p: any) => p !== null);

                if (productsToInsert.length > 0) {
                    await supabase.from('products').insert(productsToInsert);
                    alert(`¡Importación exitosa! Se agregaron ${productsToInsert.length} productos.`);
                    setIsImportModalOpen(false);
                    setImportUrl('');
                    await fetchData();
                } else {
                    alert('No se pudieron procesar los productos (verifique categorías).');
                }
            } else {
                alert('No se encontraron productos en esa URL.');
            }

        } catch (error: any) {
            console.error('Error importing menu:', error);
            // Try to extract a meaningful message
            let msg = 'Error desconocido';
            if (error instanceof Error) msg = error.message;
            if (error && typeof error === 'object' && 'message' in error) msg = (error as any).message;

            alert(`Error al importar: ${msg}. \n\nVerifica que la URL sea de un RESTAURANTE específico y no de un listado.`);
        } finally {
            setIsImporting(false);
        }
    };

    const fetchData = async () => {
        if (!selectedRestaurant) return;
        setLoading(true);

        const [catRes, prodRes] = await Promise.all([
            supabase.from('categories').select('*').eq('restaurant_id', selectedRestaurant.id).order('sort_order'),
            supabase.from('products').select('*').eq('restaurant_id', selectedRestaurant.id).order('name')
        ]);

        if (catRes.data) setCategories(catRes.data);
        if (prodRes.data) setProducts(prodRes.data);

        // Set default category for form if exists
        if (catRes.data && catRes.data.length > 0 && !productForm.category_id) {
            setProductForm(prev => ({ ...prev, category_id: catRes.data[0].id }));
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [selectedRestaurant]);

    // Product Handlers
    const handleOpenProductModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setProductForm({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                category_id: product.category_id,
                image_url: product.image_url || '',
                image_path: product.image_path || '',
                is_available: product.is_available,
                discount_price: product.discount_price?.toString() || '',
                discount_percent: product.discount_percent?.toString() || ''
            });
        } else {
            setEditingProduct(null);
            setProductForm({
                name: '',
                description: '',
                price: '',
                category_id: categories.length > 0 ? categories[0].id : '',
                image_url: '',
                image_path: '',
                is_available: true,
                discount_price: '',
                discount_percent: ''
            });
        }
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRestaurant) return;

        setLoading(true);
        const payload = {
            restaurant_id: selectedRestaurant.id,
            name: productForm.name,
            description: productForm.description,
            price: parseFloat(productForm.price),
            category_id: productForm.category_id,
            image_url: productForm.image_url,
            image_path: productForm.image_path,
            is_available: productForm.is_available,
            discount_price: productForm.discount_price ? parseFloat(productForm.discount_price) : null,
            discount_percent: productForm.discount_percent ? parseInt(productForm.discount_percent) : null
        };

        const { error } = editingProduct
            ? await supabase.from('products').update(payload).eq('id', editingProduct.id)
            : await supabase.from('products').insert(payload);

        if (!error) {
            await fetchData();
            setIsProductModalOpen(false);
        } else {
            alert('Error al guardar producto');
            console.error(error);
        }
        setLoading(false);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleImageUpload = async (file: File) => {
        if (!selectedRestaurant) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${selectedRestaurant.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

            setProductForm(prev => ({
                ...prev,
                image_url: publicUrl,
                image_path: filePath
            }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir imagen. Verifique los permisos del bucket.');
        } finally {
            setUploading(false);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) handleImageUpload(blob);
            }
        }
    };

    // Category Handlers
    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRestaurant || !categoryName.trim()) return;

        const payload = {
            restaurant_id: selectedRestaurant.id,
            name: categoryName,
            sort_order: categories.length * 10
        };

        const { error } = editingCategory
            ? await supabase.from('categories').update({ name: categoryName }).eq('id', editingCategory.id)
            : await supabase.from('categories').insert(payload);

        if (!error) {
            await fetchData();
            setCategoryName('');
            setEditingCategory(null);
        } else {
            alert('Error al guardar categoría');
        }
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryName(cat.name);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Eliminar categoría? Se eliminarán también sus productos.')) return;
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) fetchData();
    };


    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category_id === activeCategory);

    if (!selectedRestaurant) return <div className="p-8">Selecciona un restaurante.</div>;

    return (
        <div onPaste={isProductModalOpen ? handlePaste : undefined}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Menú</h1>
                    <p className="text-gray-500 mt-1">Administra categorías y productos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={20} />
                        Importar
                    </button>
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <List size={20} />
                        Categorías
                    </button>
                    <button
                        onClick={() => handleOpenProductModal()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
                    >
                        <Plus size={20} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        activeCategory === 'all' ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    )}
                >
                    Todos
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            activeCategory === cat.id ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Product List */}
            {loading && !isProductModalOpen && !isCategoryModalOpen ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative group-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                                )}
                                {product.discount_percent && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-bl-lg">
                                        {product.discount_percent}% OFF
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                                    {!product.is_available && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">No disponible</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{product.description || 'Sin descripción'}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    {product.discount_price ? (
                                        <>
                                            <span className="text-sm font-bold text-red-600">${product.discount_price}</span>
                                            <span className="text-xs text-gray-400 line-through">${product.price}</span>
                                        </>
                                    ) : (
                                        <p className="text-sm font-bold text-gray-900">${product.price}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenProductModal(product)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            No hay productos en esta categoría.
                        </div>
                    )}
                </div>
            )}

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    required
                                    value={productForm.name}
                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={productForm.description}
                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            required
                                            value={productForm.price}
                                            onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                                            className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        required
                                        value={productForm.category_id}
                                        onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                    >
                                        <option value="" disabled>Seleccionar</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Image Upload Handlers */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={productForm.image_url}
                                            onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
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
                                                    handleImageUpload(e.target.files[0]);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="text-gray-500 flex flex-col items-center gap-2 group-hover:text-gray-700">
                                            {uploading ? (
                                                <Loader2 className="animate-spin text-orange-500" />
                                            ) : (
                                                <>
                                                    <Upload size={32} className="text-gray-300 group-hover:text-gray-400" />
                                                    <span className="text-sm font-medium">Click para subir o Arrastrar imagen</span>
                                                    <span className="text-xs text-gray-400">(También puedes pegar una imagen con Ctrl+V)</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {productForm.image_url && (
                                        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setProductForm({ ...productForm, image_url: '', image_path: '' })}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Discounts Section */}
                            <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <div>
                                    <label className="block text-xs font-extra-bold uppercase text-orange-800 mb-1 tracking-wide">Precio Oferta ($)</label>
                                    <input
                                        type="number"
                                        value={productForm.discount_price}
                                        onChange={e => setProductForm({ ...productForm, discount_price: e.target.value, discount_percent: '' })}
                                        placeholder="Opcional"
                                        className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extra-bold uppercase text-orange-800 mb-1 tracking-wide">Descuento (%)</label>
                                    <input
                                        type="number"
                                        value={productForm.discount_percent}
                                        onChange={e => setProductForm({ ...productForm, discount_percent: e.target.value, discount_price: '' })}
                                        placeholder="Opcional"
                                        className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="available"
                                    checked={productForm.is_available}
                                    onChange={e => setProductForm({ ...productForm, is_available: e.target.checked })}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <label htmlFor="available" className="text-sm font-medium text-gray-700">Producto Disponible</label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-medium flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold">Gestionar Categorías</h2>
                            <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setCategoryName(''); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Create/Edit Form */}
                            <form onSubmit={handleSaveCategory} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    placeholder="Nueva Categoría"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black font-medium"
                                >
                                    {editingCategory ? <Check size={20} /> : <Plus size={20} />}
                                </button>
                            </form>

                            {/* List */}
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                        <span className="font-medium text-gray-700">{cat.name}</span>
                                        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditCategory(cat)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Importar Menú</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Pega la URL de tu restaurante en <strong>Rappi</strong> o <strong>PedidosYa</strong>.
                            Intentaremos extraer categorías y productos automáticamente.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL del Menú</label>
                            <input
                                type="url"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                                placeholder="https://www.rappi.com.ar/restaurantes/..."
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones IA (Opcional)</label>
                            <textarea
                                value={importInstructions}
                                onChange={(e) => setImportInstructions(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border h-20 text-sm"
                                placeholder="Ej: Ignorar descuentos, usar precio normal..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Escribe instrucciones especiales para mejorar la extracción.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleImportMenu}
                                disabled={isImporting || !importUrl}
                                className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                {isImporting ? 'Analizando URL...' : 'Importar desde URL'}
                            </button>

                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setIsImporting(true);
                                        try {
                                            const formData = new FormData();
                                            formData.append('image', file);

                                            const { data, error } = await supabase.functions.invoke('process-image', {
                                                body: formData,
                                            });

                                            if (error) throw error;
                                            if (data.error) throw new Error(data.error);

                                            if (data.items && data.items.length > 0) {
                                                const newCategories = [...categories];
                                                let addedCount = 0;

                                                for (const item of data.items) {
                                                    // Find or create category
                                                    let category = newCategories.find(c => c.name.toLowerCase() === item.category.toLowerCase());

                                                    if (!category) {
                                                        const { data: catData, error: catError } = await supabase
                                                            .from('categories')
                                                            .insert({
                                                                restaurant_id: selectedRestaurant.id,
                                                                name: item.category,
                                                                sort_order: newCategories.length
                                                            })
                                                            .select()
                                                            .single();

                                                        if (catError) throw catError;
                                                        if (!catData) throw new Error('Failed to create category');

                                                        category = catData as Category;
                                                        newCategories.push(category);
                                                    }

                                                    // Add product
                                                    const { error: prodError } = await supabase
                                                        .from('products')
                                                        .insert({
                                                            restaurant_id: selectedRestaurant.id,
                                                            category_id: category.id,
                                                            name: item.name,
                                                            description: item.description,
                                                            price: item.price,
                                                            image_url: item.image_url,
                                                            is_available: true
                                                        });

                                                    if (prodError) throw prodError;
                                                    addedCount++;
                                                }

                                                await fetchData();
                                                setIsImportModalOpen(false);
                                                alert(`¡Importación de Imagen exitosa! Se encontraron ${addedCount} productos.`);
                                            } else {
                                                alert('No se pudieron detectar productos en la imagen. Intenta con una foto más clara.');
                                            }
                                        } catch (error: any) {
                                            console.error('Error processing Image:', error);
                                            alert(`Error al procesar imagen: ${error.message || 'Desconocido'}`);
                                        } finally {
                                            setIsImporting(false);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-orange-50 hover:border-orange-300 transition-colors flex flex-col items-center gap-2 text-gray-600 h-full justify-center">
                                    <ImageIcon size={24} className="group-hover:text-orange-500" />
                                    <span className="font-medium group-hover:text-orange-700 text-sm">Subir Imagen</span>
                                </div>
                            </label>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
