'use client';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublic, fetchCustomerAuth } from '@/utils/api';
import { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import { getImageUrl } from '@/utils/image';
import ReviewSection from '@/components/ReviewSection';
import Modal from '@/components/admin/Modal';

export default function ProductPage() {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      fetchPublic(`/products/${id}`).then(res => {
        if(res.ok) return res.json();
        return null;
      }).then(data => {
        setProduct(data);
        setLoading(false);
        // Track recently viewed
        if (data?.id) {
          try {
            const stored = localStorage.getItem('recently_viewed');
            const viewed: any[] = stored ? JSON.parse(stored) : [];
            const filtered = viewed.filter(p => p.id !== data.id);
            const updated = [{ id: data.id, name: data.name, img: data.img, sale: data.sale, mrp: data.mrp, category: data.category }, ...filtered].slice(0, 6);
            localStorage.setItem('recently_viewed', JSON.stringify(updated));
          } catch {}
          
          // Fetch related products
          if (data.category) {
            fetchPublic(`/products?category=${encodeURIComponent(data.category)}`)
              .then(res => res.ok ? res.json() : [])
              .then(relatedData => {
                const related = Array.isArray(relatedData) ? relatedData : (relatedData.products || []);
                setRelatedProducts(related.filter((p:any) => p.id !== data.id).slice(0, 4));
              });
          }
        }
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const images = (product?.images && product.images.length > 0) ? product.images.map((imgObj: any) => imgObj.image_url) : [];
  
  // Variants Logic
  const variants = product?.variants || [];
  
  // Extract unique colors that are not empty
  const availableColors = Array.from(new Set(variants.map((v:any) => v.color).filter(Boolean)));
  
  // Auto-select first color on load if none selected
  useEffect(() => {
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0] as string);
    }
  }, [availableColors, selectedColor]);

  // Filter available sizes based on selected color (or show all if no colors)
  const availableSizes = availableColors.length > 0 
    ? variants.filter((v:any) => v.color === selectedColor && v.size).map((v:any) => ({ size: v.size, stock: v.stock }))
    : variants.filter((v:any) => v.size).map((v:any) => ({ size: v.size, stock: v.stock }));
    
  // Fallback to legacy string if no variants exist
  const sizes = availableSizes.length > 0 
    ? availableSizes 
    : (product?.sizes ? product.sizes.split(',').map((s:string) => ({ size: s.trim(), stock: product.stock })) : []);

  // Determine current variant to grab dynamic price and stock
  let currentVariant = null;
  if (selectedSize) {
    if (selectedColor) {
      currentVariant = variants.find((v:any) => v.color === selectedColor && v.size === selectedSize);
    } else {
      currentVariant = variants.find((v:any) => v.size === selectedSize);
    }
  }

  const displayPrice = currentVariant?.sale_price || product?.sale || product?.mrp;
  const displayMrp = currentVariant?.price || product?.mrp;
  const inStock = currentVariant ? currentVariant.stock > 0 : (product?.stock > 0);

  const handleColorSelect = (c: string) => {
    setSelectedColor(c);
    setSelectedSize(''); // reset size when color changes
    const v = variants.find((varObj:any) => varObj.color === c && varObj.image_url);
    if (v && v.image_url) {
      const idx = images.findIndex((img:string) => img.includes(v.image_url));
      if (idx !== -1) setActiveImg(idx);
    }
  };

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) { toast.error('Please select a size'); return; }
    
    let variantId = null;
    let variantImg = '';
    if (currentVariant) {
      variantId = currentVariant.id;
      if (currentVariant.image_url) variantImg = currentVariant.image_url;
    } else {
      const v = variants.find((varObj:any) => varObj.color === selectedColor && varObj.size === selectedSize);
      if (v) {
        variantId = v.id;
        if (v.image_url) variantImg = v.image_url;
      }
    }

    const rawImg = (product?.images && product.images.length > 0) ? (product.images.find((i:any) => i.is_primary)?.image_url || product.images[0].image_url) : '';
    const finalImg = variantImg || rawImg;

    fetchCustomerAuth('/cart', {
      method: 'POST',
      body: JSON.stringify({
        product_id: product.id,
        name: product.name,
        meta: selectedColor && selectedSize ? `${selectedColor} / ${selectedSize}` : (selectedSize || selectedColor || 'One Size'),
        price: String(displayPrice),
        img: getImageUrl(finalImg, 'thumb'),
        quantity: qty,
        variant_id: variantId
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        toast.success(data.message);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        toast.error(data.error || 'Failed to add to cart');
      }
    })
    .catch(() => toast.error('Please login to add to cart'));
  };

  const checkDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length >= 6) setDeliveryInfo('✓ Free delivery to ' + pincode + ' by Jun 26, 2026');
    else setDeliveryInfo('Please enter a valid 6-digit pincode');
  };

  return (
    <main id="main-content">
      <style>{`
        .product-page { padding-top: 40px; padding-bottom: 80px; background: var(--bg); }
        .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); margin-bottom: 32px; flex-wrap: wrap; }
        .breadcrumb a { color: var(--text-muted); transition: color .2s; }
        .breadcrumb a:hover { color: var(--primary); }
        .product-page-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
        .product-gallery { display: grid; grid-template-columns: 80px 1fr; gap: 12px; position: sticky; top: 100px; }
        .gallery-thumbnails { display: flex; flex-direction: column; gap: 10px; }
        .thumbnail-btn { width: 80px; height: 96px; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid var(--border); cursor: pointer; transition: var(--transition); flex-shrink: 0; background: none; padding: 0; }
        .thumbnail-btn.active { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(212,82,42,0.2); }
        .thumbnail-btn img { width: 100%; height: 100%; object-fit: cover; }
        .gallery-main { border-radius: var(--radius-md); overflow: hidden; background: var(--bg-subtle); aspect-ratio: 3/4; position: relative; }
        .gallery-main img { width: 100%; height: 100%; object-fit: contain; }
        .gallery-badge { position: absolute; top: 16px; left: 16px; }
        .product-info { display: flex; flex-direction: column; gap: 24px; }
        .product-brand-badge { display: flex; align-items: center; gap: 8px; }
        .product-brand-badge .brand { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); }
        .product-title { font-family: var(--font-serif); font-size: clamp(24px,3.5vw,34px); font-weight: 700; color: var(--text-heading); line-height: 1.2; }
        .product-rating-row { display: flex; align-items: center; gap: 16px; }
        .stars-lg svg { width: 17px; height: 17px; fill: var(--gold); color: var(--gold); }
        .rating-badge { font-size: 13px; color: var(--text-muted); }
        .product-price-row { display: flex; align-items: baseline; gap: 12px; padding: 20px; background: var(--bg-subtle); border-radius: var(--radius-md); }
        .product-price-now { font-family: var(--font-serif); font-size: 36px; font-weight: 700; color: var(--text-heading); }
        .product-price-old { font-size: 20px; color: var(--text-light); text-decoration: line-through; }
        .product-price-save { background: rgba(39,174,96,0.1); color: #27AE60; padding: 4px 12px; border-radius: var(--radius-full); font-size: 13px; font-weight: 700; }
        .tax-note { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
        .size-section h4 { font-size: 13px; font-weight: 600; color: var(--text-heading); margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
        .size-guide-link { font-size: 12px; color: var(--primary); font-weight: 600; border-bottom: 1px solid var(--primary); cursor: pointer; background: none; border-top: none; border-left: none; border-right: none; padding: 0; font-family: inherit; }
        .size-options { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
        .size-btn { padding: 10px 6px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; color: var(--text-body); background: #fff; cursor: pointer; transition: var(--transition); text-align: center; }
        .size-btn:hover { border-color: var(--accent); color: var(--accent); }
        .size-btn.active { border-color: var(--primary); background: rgba(212,82,42,0.05); color: var(--primary); }
        .size-btn.oos { color: var(--text-light); cursor: not-allowed; position: relative; }
        .size-btn.oos::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 6px); }
        .add-to-cart-row { display: flex; gap: 12px; }
        .qty-wrap { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
        .qty-btn2 { width: 42px; height: 48px; background: var(--bg-subtle); border: none; cursor: pointer; font-size: 20px; color: var(--text-body); transition: var(--transition); display: flex; align-items: center; justify-content: center; }
        .qty-btn2:hover { background: var(--accent); color: #fff; }
        .qty-num2 { width: 48px; height: 48px; text-align: center; border: none; outline: none; font-size: 16px; font-weight: 700; color: var(--text-heading); background: #fff; }
        .btn-atc { flex: 1; height: 48px; border-radius: var(--radius-sm); background: var(--accent); color: #fff; font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-atc:hover { background: #2C2C42; }
        .btn-atc.added { background: #27AE60; }
        .btn-buy { width: 100%; height: 48px; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: var(--transition); }
        .btn-buy:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .product-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .meta-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); background: var(--bg-subtle); font-size: 12px; font-weight: 600; color: var(--text-body); }
        .meta-pill svg { width: 14px; height: 14px; color: #27AE60; }
        .delivery-form { display: flex; gap: 8px; margin-top: 10px; }
        .delivery-input { flex: 1; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; outline: none; }
        .delivery-input:focus { border-color: var(--primary); }
        .btn-check { padding: 10px 20px; border-radius: var(--radius-sm); background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
        .delivery-result { font-size: 13px; color: #27AE60; font-weight: 600; margin-top: 8px; }
        @media (max-width: 900px) {
          .product-page-layout { grid-template-columns: 1fr; gap: 32px; }
          .product-gallery { position: static; }
          .product-page { padding-top: 24px; padding-bottom: 60px; }
        }
        @media (max-width: 768px) {
          .product-page-layout { gap: 24px; }
          .product-title { font-size: clamp(20px, 5vw, 30px) !important; }
          .product-price-now { font-size: 28px; }
          .product-price-old { font-size: 16px; }
          .size-options { grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .add-to-cart-row { gap: 10px; }
        }
        @media (max-width: 680px) {
          .product-gallery { grid-template-columns: 1fr; grid-template-rows: auto auto; }
          .gallery-thumbnails { flex-direction: row !important; overflow-x: auto; gap: 8px; order: 2; scrollbar-width: none; }
          .gallery-main { order: 1; }
          .thumbnail-btn { width: 64px; height: 80px; flex-shrink: 0; }
          .size-options { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 480px) {
          .product-price-row { padding: 14px; gap: 8px; }
          .product-price-now { font-size: 24px; }
          .add-to-cart-row { flex-wrap: wrap; }
          .btn-atc { min-width: 0; flex: 1; font-size: 13.5px; }
          .size-options { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .size-btn { padding: 8px 4px; font-size: 12px; }
          .delivery-form { flex-direction: column; gap: 8px; }
          .delivery-input { width: 100%; }
          .btn-check { border-radius: var(--radius-sm); }
          .meta-pill { font-size: 11px; padding: 6px 12px; }
          .product-meta-pills { gap: 6px; }
        }
      `}</style>

      <section className="product-page container">
        {loading ? (
          <div className="product-page-layout">
            <div className="product-gallery" style={{ display: 'block' }}>
              <div className="gallery-main skeleton" style={{ width: '100%', height: '500px', borderRadius: 'var(--radius-md)' }}></div>
            </div>
            <div className="product-info" style={{ paddingTop: '20px' }}>
              <div className="skeleton skeleton-text" style={{ width: '30%', height: '14px', marginBottom: '20px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '80%', height: '40px', marginBottom: '16px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '40%', height: '30px', marginBottom: '30px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '20%', height: '16px', marginBottom: '12px' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '60px', marginBottom: '30px', borderRadius: 'var(--radius-sm)' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '54px', borderRadius: 'var(--radius-full)' }}></div>
            </div>
          </div>
        ) : !product ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>Product not found.</div>
        ) : (
        <>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>›</span>
          <Link href="/shop">Shop</Link><span>›</span>
          <Link href={`/shop?cat=${product.category}`}>{product.category}</Link><span>›</span>
          <span style={{ color: 'var(--text-heading)' }}>{product.name}</span>
        </nav>

        <div className="product-page-layout">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="gallery-thumbnails">
              {images.map((img: string, i: number) => (
                <button key={i} className={`thumbnail-btn${activeImg===i?' active':''}`} onClick={() => setActiveImg(i)} aria-label={`View image ${i+1}`}>
                  <img src={getImageUrl(img, 'thumb')} alt={`Product view ${i+1}`} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                </button>
              ))}
            </div>
            <div className="gallery-main">
              <img src={getImageUrl(images[activeImg], 'optimized')} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              {product.sale && product.mrp && product.sale < product.mrp && <div className="gallery-badge"><span className="badge badge-sale">-{Math.round((1 - product.sale / product.mrp) * 100)}% OFF</span></div>}
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <div>
              <div className="product-brand-badge">
                <span className="brand">{product.category}</span>
              </div>
              <h1 className="product-title" style={{ marginTop: '8px' }}>{product.name}</h1>
            </div>

            <div className="product-rating-row">
              <div className="stars stars-lg" style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i=><svg key={i} viewBox="0 0 24 24" width="17" height="17"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#C9A84C" stroke="#C9A84C" strokeWidth="2"/></svg>)}
              </div>
              <span className="rating-badge">0 reviews</span>
            </div>

            <div>
              <div className="product-price-row">
                <span className="product-price-now">₹{displayPrice}</span>
                {displayPrice < displayMrp && <span className="product-price-old">₹{displayMrp}</span>}
                {displayPrice < displayMrp && <span className="product-price-save">Save ₹{displayMrp - displayPrice}</span>}
              </div>
              <p className="tax-note">Inclusive of all taxes</p>
            </div>

            {availableColors.length > 0 && (
              <div className="size-section">
                <h4>Select Color: {selectedColor}</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {availableColors.map((c: any) => (
                    <button key={c} style={{ 
                      padding: '8px 16px', 
                      borderRadius: 'var(--radius-sm)',
                      border: selectedColor === c ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedColor === c ? 'rgba(212,82,42,0.1)' : '#fff',
                      cursor: 'pointer',
                      fontWeight: 600
                    }} onClick={() => handleColorSelect(c)}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="size-section" style={{ marginTop: '16px' }}>
              <h4>Select Size <button className="size-guide-link" onClick={() => setSizeGuideOpen(true)}>Size Guide</button></h4>
              <div className="size-options">
                {sizes.map((sObj: any) => (
                  <button 
                    key={sObj.size} 
                    className={`size-btn${selectedSize===sObj.size?' active':''}${sObj.stock <= 0 ?' oos':''}`} 
                    onClick={() => sObj.stock > 0 && setSelectedSize(sObj.size)} 
                    disabled={sObj.stock <= 0}
                  >
                    {sObj.size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="add-to-cart-row">
                <div className="qty-wrap">
                  <button className="qty-btn2" onClick={() => setQty(q=>Math.max(1,q-1))}>−</button>
                  <input className="qty-num2" type="number" value={qty} readOnly />
                  <button className="qty-btn2" onClick={() => setQty(q=>q+1)}>+</button>
                </div>
                <button className={`btn-atc${added?' added':''}`} onClick={handleAddToCart}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  {added ? 'Added to Cart ✓' : 'Add to Cart'}
                </button>
              </div>
              <button className="btn-buy" style={{ marginTop: '12px' }} onClick={() => window.location.href='/checkout'}>Buy Now</button>
            </div>

            <div className="product-meta-pills">
              {['Free Delivery above ₹499','7-Day Returns','OEKO-TEX Certified Fabric','Gift Wrap Available'].map(p=>(
                <span key={p} className="meta-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>{p}
                </span>
              ))}
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>Check Delivery Date</h4>
              <form className="delivery-form" onSubmit={checkDelivery}>
                <input className="delivery-input" type="text" placeholder="Enter your pincode" maxLength={6} value={pincode} onChange={e=>setPincode(e.target.value)} />
                <button type="submit" className="btn-check">Check</button>
              </form>
              {deliveryInfo && <p className="delivery-result">{deliveryInfo}</p>}
            </div>
            
            {product.description && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-heading)' }}>Product Description</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: '1.6' }}>{product.description}</p>
              </div>
            )}
            
            <ReviewSection productId={product.id} />
          </div>
        </div>
        
        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--text-heading)' }}>You May Also Like</h2>
              <Link href={`/shop?cat=${product.category}`} style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View All {product.category}</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
              {relatedProducts.map(rp => {
                const rpImg = rp.images?.[0]?.image_url || rp.img;
                return (
                  <Link key={rp.id} href={`/product?id=${rp.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', transition: 'var(--transition)', paddingBottom: '16px', height: '100%' }}
                         onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                         onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: 'var(--bg-subtle)' }}>
                        {rpImg ? (
                          <img src={getImageUrl(rpImg, 'thumb')} alt={rp.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No Image</div>
                        )}
                        {rp.sale && rp.mrp && rp.sale < rp.mrp && (
                          <span className="badge badge-sale" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                            -{Math.round((1 - rp.sale / rp.mrp) * 100)}%
                          </span>
                        )}
                      </div>
                      <div style={{ padding: '16px 16px 0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{rp.category}</div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rp.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>₹{rp.sale || rp.mrp}</span>
                          {rp.sale && rp.sale < rp.mrp && <span style={{ fontSize: '13px', color: 'var(--text-light)', textDecoration: 'line-through' }}>₹{rp.mrp}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        </>
        )}
      </section>

      <Modal 
        isOpen={sizeGuideOpen} 
        onClose={() => setSizeGuideOpen(false)} 
        title="Size Guide" 
        size="md"
        footer={
          <button className="btn btn-ghost" onClick={() => setSizeGuideOpen(false)}>Close</button>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-heading)' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Age</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Size</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Chest (in)</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Waist (in)</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Height (cm)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>0-6M</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>XS</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>16</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>16</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>68</td></tr>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>6-12M</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>S</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>17</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>17</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>76</td></tr>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>1-2Y</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>M</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>20</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>19</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>90</td></tr>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>3-4Y</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>L</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>22</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>20.5</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>104</td></tr>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>5-6Y</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>XL</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>24</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>22</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>116</td></tr>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>7-8Y</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>XXL</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>26</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>23</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>128</td></tr>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>9-10Y</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>3XL</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>28</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>24</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>140</td></tr>
              <tr><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>11-12Y</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>4XL</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>30</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>25.5</td><td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>152</td></tr>
            </tbody>
          </table>
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>* Measurements shown above are body measurements. If your child is between sizes, we recommend sizing up for a comfortable fit.</p>
        </div>
      </Modal>
    </main>
  );
}
