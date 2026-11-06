'use client';

import { useState, useEffect } from 'react';
import AdminTable, { Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth } from '@/utils/api';
import ExportDropdown from '@/components/admin/ExportDropdown';
import { formatDate } from '@/utils/date';

export default function CategoriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    name: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchWithAuth('/categories');
        if (res.ok) {
          const json = await res.json();
          setData(json.categories || []);
        }
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const columns: Column[] = [
    { key: 'checkbox', label: '', sortable: false, className: 'no-sort' },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Category Name', sortable: true },
    { key: 'created_at', label: 'Created At', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false, className: 'no-sort' }
  ];

  const handleEdit = (category: any) => {
    setFormData({
      id: category.id,
      name: category.name
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      showToast('⚠️ Category name is required', 'warning');
      return;
    }
    
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/categories/${formData.id}` : '/categories';
      
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const savedData = await res.json();
        if (formData.id) {
          setData(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } : c));
          showToast('✏️ Category updated successfully!', 'info');
        } else {
          const newCategory = savedData.category ? savedData.category : { ...formData, id: savedData.id || Date.now() };
          setData(prev => [newCategory, ...prev]);
          showToast('✅ Category added successfully!', 'success');
        }
        setModalOpen(false);
      } else {
        const errJson = await res.json();
        showToast(`❌ Failed to save: ${JSON.stringify(errJson.error || 'Unknown error')}`, 'error');
      }
    } catch (err) {
      showToast('❌ Error saving category.', 'error');
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        const res = await fetchWithAuth(`/categories/${deleteTarget.id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          setData(prev => prev.filter(c => c.id !== deleteTarget.id));
          showToast('🗑 Category deleted.', 'warning');
          setDeleteModalOpen(false);
        } else {
          showToast('❌ Failed to delete category.', 'error');
        }
      } catch (err) {
        showToast('❌ Error deleting category.', 'error');
      }
    }
  };

  const filteredData = data.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderRow = (row: any, i: number) => {
    return (
      <tr key={row.id}>
        <td><input type="checkbox" className="row-cb" value={row.id} /></td>
        <td>#{row.id}</td>
        <td><div className="cell-name">{row.name}</div></td>
        <td><span className="badge b-info">{new Date(row.created_at || Date.now()).toLocaleDateString()}</span></td>
        <td>
          <div className="row-actions">
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
        <div style={{ marginTop: '16px' }}>Loading categories...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">🏷️</div>
            <span className="card-title">All Categories</span>
            <span className="card-count" id="cat-count">{filteredData.length}</span>
          </div>
          <div className="card-header-right tbl-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <ExportDropdown 
              data={filteredData}
              filenamePrefix="categories"
              title="Product Categories Directory"
              buttonLabel="Export"
              className="btn btn-outline"
              columns={[
                { key: 'id', label: 'Category ID' },
                { key: 'name', label: 'Category Name' },
                { key: (row: any) => row.created_at ? formatDate(row.created_at) : 'N/A', label: 'Date Created' }
              ]}
            />
            <button className="btn btn-gold" onClick={() => {
              setFormData({ id: 0, name: '' });
              setModalOpen(true);
            }}>
              ＋ Add Category
            </button>
          </div>
        </div>

        <div className="card-body">
          {data.length > 0 ? (
            <AdminTable 
              id="cat"
              columns={columns}
              data={filteredData}
              searchFields={['name']}
              searchQuery={search}
              perPage={10}
              renderRow={renderRow}
            />
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>
              <h3>No Categories Found</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>Start by adding your first product category.</p>
              <button className="btn btn-gold" onClick={() => {
                setFormData({ id: 0, name: '' });
                setModalOpen(true);
              }}>
                ＋ Add Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={<><span id="modalIcon">{formData.id ? '✏️' : '＋'}</span> <span id="modalHeading">{formData.id ? 'Edit Category' : 'Add Category'}</span></>}
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleSave}>💾 Save Category</button>
          </>
        }
      >
        <div className="form-grid" style={{ marginBottom: '14px' }}>
          <div className="form-group full">
            <label className="form-label">Category Name</label>
            <input type="text" className="form-control" placeholder="e.g. Newborn" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        title="🗑 Delete Category"
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
    </>
  );
}
