import React from 'react';

export default function SizePicker({
  product,
  onClose,
  onConfirm
}: {
  product: any,
  onClose: () => void,
  onConfirm: (size: string) => void
}) {
  const [selected, setSelected] = React.useState('');
  
  const sizes = product.sizes ? product.sizes.split(',').map((s: string) => s.trim()) : [];

  if (sizes.length <= 1) {
    // If no sizes or 1 size, it should be handled before opening the picker
    return null; 
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '360px', padding: '24px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--text-heading)' }}>Select Size</h3>
        <p style={{ marginBottom: '20px', color: 'var(--text-body)', fontSize: '14px' }}>{product.name}</p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          {sizes.map((s: string) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              style={{
                padding: '8px 16px',
                border: `1.5px solid ${selected === s ? 'var(--primary)' : 'var(--border)'}`,
                background: selected === s ? 'rgba(212, 82, 42, 0.1)' : 'var(--bg)',
                color: selected === s ? 'var(--primary)' : 'var(--text-body)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: selected === s ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              {s}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }} 
            disabled={!selected}
            onClick={() => onConfirm(selected)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
