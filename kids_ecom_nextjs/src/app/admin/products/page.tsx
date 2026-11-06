'use client';

import { useState, useEffect } from 'react';
import AdminTable, { Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth, API_BASE_URL } from '@/utils/api';
import { getImageUrl } from '@/utils/image';
import { Product, Category } from '@/types';
import ExportDropdown from '@/components/admin/ExportDropdown';

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Media Source Choice & Picker State
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [mediaLibraryItems, setMediaLibraryItems] = useState<any[]>([]);
  const [tempSelectedMedia, setTempSelectedMedia] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');

  const fetchMediaLibrary = async () => {
    try {
      const res = await fetchWithAuth('/media');
      if (res.ok) {
        const json = await res.json();
        setMediaLibraryItems(json.data || []);
      }
    } catch (err) {
      setMediaLibraryItems([]);
    }
  };

  const openLibraryPicker = () => {
    setChoiceModalOpen(false);
    setTempSelectedMedia([]);
    fetchMediaLibrary();
    setLibraryPickerOpen(true);
  };

  const toggleMediaSelection = (item: any) => {
    setTempSelectedMedia(prev => {
      const exists = prev.some(m => m.id === item.id || m.file_url === item.file_url);
      if (exists) {
        return prev.filter(m => m.id !== item.id && m.file_url !== item.file_url);
      } else {
        return [...prev, item];
      }
    });
  };

  const confirmLibrarySelection = () => {
    setFormData(prev => {
      const existing = prev.images || [];
      const newImgs = tempSelectedMedia
        .filter(m => !existing.some((e: any) => (e.url || e.image_url) === m.file_url))
        .map(m => ({
          url: m.file_url,
          image_url: m.file_url,
          media_id: m.id,
          is_primary: existing.length === 0
        }));
      return { ...prev, images: [...existing, ...newImgs] };
    });
    setLibraryPickerOpen(false);
    showToast(`Added ${tempSelectedMedia.length} image(s) from Library`, 'success');
  };

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const fd = new FormData();
    files.forEach(f => fd.append('files[]', f));

    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = API_BASE_URL;
      const res = await fetch(`${baseUrl}/admin/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        showToast('Uploaded to Media Library!', 'success');
        fetchMediaLibrary();
      }
    } catch (err) {
      showToast('Upload failed', 'error');
    }
  };

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    category: 'Girls',
    status: 'Active',
    mrp: 0,
    sale: 0,
    stock: 0,
    sizes: '',
    description: '',
    images: [] as any[],
    variants: [] as any[]
  });

  const [generateColors, setGenerateColors] = useState('');
  const [generateSizes, setGenerateSizes] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetchWithAuth('/products');
        if (res.ok) {
          const json = await res.json();
          setData(json.products || []);
        }
      } catch (err) {
        setData([]);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await fetchWithAuth('/categories');
        if (res.ok) {
          const json = await res.json();
          setCategories(json.categories || []);
        }
      } catch (err) {
        setCategories([]);
      }
    };
    
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setLoading(false));
  }, []);

  const columns: Column[] = [
    { key: 'checkbox', label: '', sortable: false, className: 'no-sort' },
    { key: 'image', label: 'Image', sortable: false, className: 'no-sort' },
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'sale', label: 'Price', sortable: true },
    { key: 'stock', label: 'Stock', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false, className: 'no-sort' }
  ];

  const handleEdit = (product: any) => {
    setFormData({
      id: product.id,
      name: product.name,
      category: product.category,
      status: product.status,
      mrp: product.mrp,
      sale: product.sale,
      stock: product.stock,
      sizes: product.sizes || '',
      description: product.description || '',
      images: product.images || [],
      variants: product.variants || []
    });
    setGenerateColors('');
    setGenerateSizes('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/products/${formData.id}` : '/products';
      
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const savedProduct = await res.json();
        if (formData.id) {
          setData(prev => prev.map(p => p.id === formData.id ? { ...p, ...formData } : p));
          showToast('Product updated successfully!', 'info');
        } else {
          // If the backend doesn't return the full object, at least add it locally
          const newProduct = savedProduct.product ? savedProduct.product : { ...formData, id: savedProduct.id || Date.now() };
          setData(prev => [...prev, newProduct]);
          showToast('Product added successfully!', 'success');
        }
        setModalOpen(false);
      } else {
        showToast('Failed to save product.', 'error');
      }
    } catch (err) {
      showToast('Error saving product.', 'error');
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        const res = await fetchWithAuth(`/products/${deleteTarget.id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          setData(prev => prev.filter(p => p.id !== deleteTarget.id));
          showToast('Product deleted.', 'warning');
          setDeleteModalOpen(false);
        } else {
          showToast('Failed to delete product.', 'error');
        }
      } catch (err) {
        showToast('Error deleting product.', 'error');
      }
    }
  };

  const handleBulkAction = async (action: 'delete' | 'Active' | 'Draft') => {
    if (selectedIds.size === 0) return;
    
    try {
      const promises = Array.from(selectedIds).map(id => {
        if (action === 'delete') {
          return fetchWithAuth(`/products/${id}`, { method: 'DELETE' });
        } else {
          const product = data.find(p => p.id === id);
          return fetchWithAuth(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...product, status: action })
          });
        }
      });
      
      await Promise.all(promises);
      
      if (action === 'delete') {
        setData(prev => prev.filter(p => !selectedIds.has(p.id)));
        showToast(`Deleted ${selectedIds.size} products.`, 'warning');
      } else {
        setData(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, status: action } : p));
        showToast(`Marked ${selectedIds.size} products as ${action}.`, 'success');
      }
      setSelectedIds(new Set());
    } catch (err) {
      showToast('Error performing bulk action.', 'error');
    }
  };

  const handleGenerateVariants = () => {
    const colors = generateColors.split(',').map(c => c.trim()).filter(Boolean);
    const sizes = generateSizes.split(',').map(s => s.trim()).filter(Boolean);
    if (!colors.length && !sizes.length) return;

    let newVariants: any[] = [];
    if (colors.length && sizes.length) {
      colors.forEach(c => {
        sizes.forEach(s => {
          newVariants.push({ color: c, size: s, sku: `VAR-${c}-${s}`.toUpperCase(), stock: 0, price: formData.mrp, sale_price: formData.sale });
        });
      });
    } else if (colors.length) {
      colors.forEach(c => newVariants.push({ color: c, size: '', sku: `VAR-${c}`.toUpperCase(), stock: 0, price: formData.mrp, sale_price: formData.sale }));
    } else if (sizes.length) {
      sizes.forEach(s => newVariants.push({ color: '', size: s, sku: `VAR-${s}`.toUpperCase(), stock: 0, price: formData.mrp, sale_price: formData.sale }));
    }

    setFormData(prev => {
      // Append only unique variants
      const existing = prev.variants || [];
      const toAdd = newVariants.filter(nv => !existing.some((ev:any) => ev.color === nv.color && ev.size === nv.size));
      return { ...prev, variants: [...existing, ...toAdd] };
    });
  };

  const handleVariantChange = (idx: number, field: string, value: any) => {
    setFormData(prev => {
      const v = [...prev.variants];
      v[idx][field] = value;
      return { ...prev, variants: v };
    });
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { sku: `VAR-NEW-${Date.now().toString().slice(-4)}`, color: '', size: '', stock: 0, price: prev.mrp || 0, sale_price: prev.sale || 0, image_url: '' }]
    }));
  };

  const handleVariantImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('image', file);
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = API_BASE_URL;
      const res = await fetch(`${baseUrl}/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        const result = await res.json();
        if (result.url) {
          handleVariantChange(idx, 'image_url', result.url);
          showToast(`🖼️ Variant image uploaded!`, 'success');
        }
      } else {
        showToast(`❌ Failed to upload image.`, 'error');
      }
    } catch (err) {
      showToast(`❌ Error uploading image.`, 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const fd = new FormData();
      fd.append('image', file);

      try {
        const token = localStorage.getItem('adminToken');
        const baseUrl = API_BASE_URL;
        const res = await fetch(`${baseUrl}/admin/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd
        });
        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            setFormData(prev => ({ 
              ...prev, 
              images: [...(prev.images || []), { url: result.url, image_url: result.url, is_primary: (!prev.images || prev.images.length === 0) }] 
            }));
            showToast(`🖼️ Image ${file.name} uploaded!`, 'success');
          }
        } else {
          showToast(`❌ Failed to upload ${file.name}.`, 'error');
        }
      } catch (err) {
        showToast(`❌ Error uploading ${file.name}.`, 'error');
      }
    }
  };

  const setPrimaryImage = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img: any, i: number) => ({
        ...img,
        is_primary: i === idx ? 1 : 0
      }))
    }));
  };

  const filteredData = data.filter(r => 
    (!catFilter || r.category === catFilter) && (!statusFilter || r.status === statusFilter)
  );

  const stockBadge = (stock: number) => {
    if (stock === 0) return <span className="badge b-danger">Out of Stock</span>;
    if (stock <= 10) return <span className="badge b-warning">Low ({stock})</span>;
    return <span className="badge b-success">{stock} in stock</span>;
  };

  const renderRow = (row: any, i: number) => {
    const statusCls = row.status === 'Active' ? 'b-success' : 'b-muted';
    return (
      <tr key={row.id}>
        <td>
          <input 
            type="checkbox" 
            className="row-cb" 
            checked={selectedIds.has(row.id)} 
            onChange={(e) => {
              const newSet = new Set(selectedIds);
              if (e.target.checked) newSet.add(row.id);
              else newSet.delete(row.id);
              setSelectedIds(newSet);
            }} 
          />
        </td>
        <td>
          <div className="prod-thumb">
            {(() => {
              const img = (row.images && row.images.length > 0) ? (row.images.find((i:any) => i.is_primary)?.image_url || row.images[0].image_url) : '';
              return <img src={getImageUrl(img, 'thumb')} alt="Product" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />;
            })()}
          </div>
        </td>
        <td><div className="cell-name">{row.name}</div></td>
        <td><span className="badge b-info">{row.category}</span></td>
        <td>
          <div style={{ fontWeight: 600, color: 'var(--gold)' }}>₹{row.sale}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'line-through' }}>₹{row.mrp}</div>
        </td>
        <td>{stockBadge(row.stock)}</td>
        <td><span className={`badge ${statusCls}`}>{row.status}</span></td>
        <td>
          <div className="row-actions">
            <button className="act-btn act-view" title="View" onClick={() => { setSelectedProduct(row); setViewModalOpen(true); }}>👁</button>
            <button className="act-btn act-edit" title="Edit" onClick={() => handleEdit(row)}>✏️</button>
            <button className="act-btn act-delete" title="Delete" onClick={() => { setDeleteTarget(row); setDeleteModalOpen(true); }}>🗑</button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading products...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">👗</div>
            <span className="card-title">All Products</span>
            <span className="card-count" id="prod-count">{filteredData.length}</span>
          </div>
          <div className="card-header-right tbl-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-sel" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select className="filter-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
            <ExportDropdown 
              data={filteredData}
              filenamePrefix="products"
              title="Products Catalog Report"
              buttonLabel="Export"
              className="btn btn-outline"
              columns={[
                { key: 'name', label: 'Product Name' },
                { key: 'category', label: 'Category' },
                { key: (row: any) => `₹${Number(row.sale_price || row.sale || 0).toLocaleString('en-IN')}`, label: 'Price' },
                { key: (row: any) => `₹${Number(row.mrp || 0).toLocaleString('en-IN')}`, label: 'MRP' },
                { key: 'stock', label: 'Stock' },
                { key: 'status', label: 'Status' }
              ]}
            />
            <button className="btn btn-gold" onClick={() => {
              setFormData({ id: 0, name: '', category: 'Girls', status: 'Active', mrp: 0, sale: 0, stock: 0, sizes: '', description: '', images: [], variants: [] });
              setGenerateColors('');
              setGenerateSizes('');
              setModalOpen(true);
            }}>
              ＋ Add Product
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div style={{ padding: '10px 20px', background: 'rgba(212,175,55,0.1)', borderBottom: '1px solid var(--glass-b)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginRight: '10px' }}>{selectedIds.size} selected</span>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Active')}>Mark Active</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Draft')}>Mark Draft</button>
            <button className="btn btn-danger btn-sm" onClick={() => {
               if (confirm('Are you sure you want to delete selected products?')) handleBulkAction('delete');
            }}>Delete Selected</button>
          </div>
        )}

        <div className="card-body">
          {data.length > 0 ? (
            <AdminTable 
              id="prod"
              columns={columns}
              data={filteredData}
              searchFields={['name', 'category', 'status']}
              searchQuery={search}
              perPage={10}
              renderRow={renderRow}
              selectAllId="sa-prod"
              onSelectAll={(checked) => {
                if (checked) setSelectedIds(new Set(filteredData.map(d => d.id)));
                else setSelectedIds(new Set());
              }}
            />
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>👗</div>
              <h3>No Products Found</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>There are no products available. Start by adding a new one.</p>
              <button className="btn btn-gold" onClick={() => {
                setFormData({ id: 0, name: '', category: 'Girls', status: 'Active', mrp: 0, sale: 0, stock: 0, sizes: '', description: '', images: [], variants: [] });
                setGenerateColors('');
                setGenerateSizes('');
                setModalOpen(true);
              }}>
                ＋ Add Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={<><span id="modalIcon">{formData.id ? '✏️' : '＋'}</span> <span id="modalHeading">{formData.id ? 'Edit Product' : 'Add Product'}</span></>}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleSave}>💾 Save Product</button>
          </>
        }
      >
        <div className="form-grid" style={{ marginBottom: '14px' }}>
          <div className="form-group full">
            <label className="form-label">Product Images</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <button type="button" className="btn btn-gold" onClick={() => setChoiceModalOpen(true)}>
                ➕ Choose Images
              </button>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Select from platform media library or upload from computer
              </span>
              <input
                id="hiddenNextProductFileInput"
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              {formData.images?.map((img: any, idx: number) => (
                <div key={idx} style={{ position: 'relative', border: img.is_primary ? '2px solid var(--gold)' : '1px solid var(--glass-b)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
                  <img src={getImageUrl(img.url || img.image_url, 'thumb')} alt="Preview" style={{ height: '80px', display: 'block' }} />
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--error, red)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }} onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}>✕</span>
                  
                  {img.is_primary ? (
                    <span style={{ display: 'block', textAlign: 'center', background: 'var(--gold)', color: '#000', fontSize: '10px', padding: '2px 0', marginTop: '4px', fontWeight: 'bold' }}>Primary</span>
                  ) : (
                    <button style={{ width: '100%', background: 'var(--glass)', border: 'none', fontSize: '10px', padding: '2px 0', marginTop: '4px', cursor: 'pointer', color: 'var(--platinum)' }} onClick={() => setPrimaryImage(idx)}>Make Primary</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group full">
            <label className="form-label">Product Name</label>
            <input type="text" className="form-control" placeholder="e.g. Girls Lehenga Choli — Festive Red" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="">Select Category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Active">Active</option><option value="Draft">Draft</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">MRP (₹)</label>
            <input type="number" className="form-control" placeholder="999" min="0" value={formData.mrp || ''} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Sale Price (₹)</label>
            <input type="number" className="form-control" placeholder="799" min="0" value={formData.sale || ''} onChange={e => setFormData({...formData, sale: Number(e.target.value)})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input type="number" className="form-control" placeholder="50" min="0" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Sizes Available</label>
            <input type="text" className="form-control" placeholder="XS, S, M, L, XL" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} />
          </div>
          <div className="form-group full">
            <label className="form-label">Description</label>
            <textarea className="form-control" placeholder="Product description…" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>

          <div className="form-group full" style={{ borderTop: '1px solid var(--glass-b)', paddingTop: '20px', marginTop: '10px' }}>
            <h4 style={{ fontSize: '15px', color: 'var(--platinum)', marginBottom: '12px' }}>Product Variants (Colors & Sizes)</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
              <div>
                <label className="form-label">Colors (comma separated)</label>
                <input type="text" className="form-control" placeholder="Red, Blue, Green" value={generateColors} onChange={e => setGenerateColors(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Sizes (comma separated)</label>
                <input type="text" className="form-control" placeholder="S, M, L, XL" value={generateSizes} onChange={e => setGenerateSizes(e.target.value)} />
              </div>
              <button className="btn btn-outline" onClick={handleGenerateVariants}>Generate</button>
              <button className="btn btn-primary" onClick={handleAddVariant}>+ Add Variant</button>
            </div>

            {formData.variants && formData.variants.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--glass)', borderBottom: '1px solid var(--glass-b)' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Image</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Color</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Size</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Stock</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Price (₹)</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--glass-b)' }}>
                        <td style={{ padding: '8px' }}><input type="text" className="form-control" style={{ padding: '4px 8px', height: '30px' }} value={v.sku || ''} onChange={e => handleVariantChange(idx, 'sku', e.target.value)} /></td>
                        <td style={{ padding: '8px' }}>
                          {v.image_url ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <img src={getImageUrl(v.image_url, 'thumb')} alt="Variant" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                              <button className="act-btn act-delete" style={{ padding: '4px' }} onClick={() => handleVariantChange(idx, 'image_url', '')}>✕</button>
                            </div>
                          ) : (
                            <label style={{ cursor: 'pointer', display: 'inline-block', padding: '4px 8px', background: 'var(--glass-b)', borderRadius: '4px', fontSize: '11px', color: 'var(--primary)' }}>
                              Upload
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleVariantImageUpload(idx, e)} />
                            </label>
                          )}
                        </td>
                        <td style={{ padding: '8px' }}><input type="text" className="form-control" style={{ padding: '4px 8px', height: '30px' }} value={v.color || ''} onChange={e => handleVariantChange(idx, 'color', e.target.value)} /></td>
                        <td style={{ padding: '8px' }}><input type="text" className="form-control" style={{ padding: '4px 8px', height: '30px' }} value={v.size || ''} onChange={e => handleVariantChange(idx, 'size', e.target.value)} /></td>
                        <td style={{ padding: '8px' }}><input type="number" className="form-control" style={{ padding: '4px 8px', height: '30px', width: '70px' }} value={v.stock || 0} onChange={e => handleVariantChange(idx, 'stock', Number(e.target.value))} /></td>
                        <td style={{ padding: '8px' }}><input type="number" className="form-control" style={{ padding: '4px 8px', height: '30px', width: '80px' }} value={v.sale_price || 0} onChange={e => handleVariantChange(idx, 'sale_price', Number(e.target.value))} /></td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button className="act-btn act-delete" onClick={() => setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        title="🗑 Delete Product"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>🗑 Delete</button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '30px 22px' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: 'var(--platinum)', fontSize: '15px', marginBottom: '6px' }}>Are you sure you want to delete</p>
          <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '15px' }}>"{deleteTarget?.name}"</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>This action cannot be undone.</p>
        </div>
      </Modal>

      {/* View Product Modal */}
      {selectedProduct && (
        <Modal 
          isOpen={viewModalOpen} 
          onClose={() => setViewModalOpen(false)} 
          title="👁 Product Details"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setViewModalOpen(false)}>Close</button>
              <button className="btn btn-gold" onClick={() => { setViewModalOpen(false); handleEdit(selectedProduct); }}>✏️ Edit</button>
            </>
          }
        >
          <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--glass-b)', marginBottom: '18px' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>
              {selectedProduct.images && selectedProduct.images.length > 0 ? 
                <img src={getImageUrl(selectedProduct.images.find((i:any)=>i.is_primary)?.image_url || selectedProduct.images[0].image_url, 'thumb')} alt={selectedProduct.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} /> : 
                '📦'}
            </div>
            <h3 style={{ color: 'var(--platinum)', fontSize: '16px' }}>{selectedProduct.name}</h3>
            <span className="badge b-info" style={{ marginTop: '6px' }}>{selectedProduct.category}</span>
          </div>
          <div className="form-grid" style={{ marginBottom: 0 }}>
            <div className="od-block"><div className="od-label">Sale Price</div><div className="od-val" style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 700 }}>₹{selectedProduct.sale}</div></div>
            <div className="od-block"><div className="od-label">MRP</div><div className="od-val" style={{ textDecoration: 'line-through' }}>₹{selectedProduct.mrp}</div></div>
            <div className="od-block"><div className="od-label">Stock</div><div className="od-val">{selectedProduct.stock} units</div></div>
            <div className="od-block"><div className="od-label">Discount</div><div className="od-val" style={{ color: 'var(--emerald)' }}>{Math.round((1 - selectedProduct.sale / selectedProduct.mrp) * 100)}% OFF</div></div>
            <div className="od-block"><div className="od-label">Status</div><div className="od-val">{selectedProduct.status}</div></div>
            <div className="od-block"><div className="od-label">Product ID</div><div className="od-val">#{selectedProduct.id}</div></div>
          </div>
        </Modal>
      )}

      {/* 1. Media Source Choice Modal */}
      <Modal
        isOpen={choiceModalOpen}
        onClose={() => setChoiceModalOpen(false)}
        title="🖼️ Select Image Source"
        footer={
          <button className="btn btn-ghost" onClick={() => setChoiceModalOpen(false)}>Cancel</button>
        }
      >
        <div style={{ padding: '16px 8px' }}>
          <p style={{ color: 'var(--platinum)', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
            Where would you like to select images from?
          </p>
          <div className="media-choice-grid">
            <div
              className="media-choice-card"
              onClick={() => {
                setChoiceModalOpen(false);
                document.getElementById('hiddenNextProductFileInput')?.click();
              }}
            >
              <div className="choice-icon">📁</div>
              <div className="choice-title">Upload from Computer</div>
              <div className="choice-desc">Pick image files directly from your computer or device</div>
            </div>

            <div className="media-choice-card" onClick={openLibraryPicker}>
              <div className="choice-icon">🖼️</div>
              <div className="choice-title">Platform Media Library</div>
              <div className="choice-desc">Select existing images previously uploaded to platform</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 2. Platform Media Library Picker Modal */}
      <Modal
        isOpen={libraryPickerOpen}
        onClose={() => setLibraryPickerOpen(false)}
        title="🖼️ Choose Images from Media Library"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 600 }}>
              {tempSelectedMedia.length} image(s) selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost" onClick={() => setLibraryPickerOpen(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={confirmLibrarySelection}>✅ Add Selected Images</button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-box" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search media library..."
                value={librarySearch}
                onChange={e => setLibrarySearch(e.target.value)}
              />
            </div>
            <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0 }}>
              ☁️ Upload New
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLibraryUpload} />
            </label>
          </div>

          <div className="media-picker-grid" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '4px' }}>
            {mediaLibraryItems
              .filter(m => !librarySearch || (m.original_name || m.filename || '').toLowerCase().includes(librarySearch.toLowerCase()))
              .map((item: any) => {
                const isSelected = tempSelectedMedia.some(m => m.id === item.id || m.file_url === item.file_url);
                return (
                  <div
                    key={item.id || item.file_url}
                    className={`media-picker-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleMediaSelection(item)}
                  >
                    <img src={getImageUrl(item.file_url || item.url, 'thumb')} alt={item.original_name || 'Media'} />
                    <div className="check-badge">✓</div>
                  </div>
                );
              })}

            {mediaLibraryItems.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                No media found in library. Upload images using "Upload New" above.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
