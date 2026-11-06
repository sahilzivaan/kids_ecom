'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { fetchPublic, fetchCustomerAuth } from '@/utils/api';
import { toast } from '@/utils/toast';
import { getImageUrl } from '@/utils/image';
import ReviewSection from '@/components/ReviewSection';
import Modal from '@/components/admin/Modal';

function ProductContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Fetch product data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadProductData = async () => {
      try {
        let currentProduct: any = null;

        if (id) {
          const res = await fetchPublic(`/products/${encodeURIComponent(id)}`);
          if (res.ok) {
            currentProduct = await res.json();
          }
        }

        // If no ID provided or product not found, fallback to the latest / first available product
        if (!currentProduct) {
          const listRes = await fetchPublic('/products?limit=1');
          if (listRes.ok) {
            const listData = await listRes.json();
            if (listData?.products && listData.products.length > 0) {
              currentProduct = listData.products[0];
            }
          }
        }

        if (!isMounted) return;

        setProduct(currentProduct);
        setLoading(false);

        if (currentProduct?.id) {
          // Track in recently viewed
          try {
            const stored = localStorage.getItem('recently_viewed');
            const viewed: any[] = stored ? JSON.parse(stored) : [];
            const filtered = viewed.filter((p: any) => String(p.id) !== String(currentProduct.id));
            const primaryImg = (currentProduct.images && currentProduct.images.length > 0)
              ? (currentProduct.images.find((i: any) => i.is_primary)?.image_url || currentProduct.images[0].image_url)
              : (currentProduct.img || '/images/product_placeholder.jpg');

            const updated = [
              {
                id: currentProduct.id,
                name: currentProduct.name,
                img: primaryImg,
                sale: currentProduct.sale,
                mrp: currentProduct.mrp,
                category: currentProduct.category,
              },
              ...filtered,
            ].slice(0, 6);

            localStorage.setItem('recently_viewed', JSON.stringify(updated));
          } catch {}

          // Fetch related products in the same category
          if (currentProduct.category) {
            fetchPublic(`/products?category=${encodeURIComponent(currentProduct.category)}`)
              .then((res) => (res.ok ? res.json() : []))
              .then((relatedData) => {
                if (!isMounted) return;
                const related = Array.isArray(relatedData) ? relatedData : (relatedData.products || []);
                setRelatedProducts(related.filter((p: any) => String(p.id) !== String(currentProduct.id)).slice(0, 4));
              })
              .catch(() => {
                if (isMounted) setRelatedProducts([]);
              });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load product details:', err);
          setLoading(false);
        }
      }
    };

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Gallery images list
  const images: string[] = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((imgObj: any) => imgObj.image_url);
    }
    if (product?.img) {
      return [product.img];
    }
    return ['/images/product_placeholder.jpg'];
  }, [product]);

  // Variants list
  const variants = useMemo(() => product?.variants || [], [product]);

  // Unique colors
  const availableColors = useMemo(() => {
    return Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean)));
  }, [variants]);

  // Auto-initialize color selection and reset states when product changes
  useEffect(() => {
    if (availableColors.length > 0) {
      setSelectedColor(availableColors[0] as string);
    } else {
      setSelectedColor('');
    }
    setSelectedSize('');
    setActiveImg(0);
    setQty(1);
    setDeliveryInfo('');
  }, [availableColors, product?.id]);

  // Available sizes based on selected color
  const availableSizes = useMemo(() => {
    if (availableColors.length > 0 && selectedColor) {
      return variants
        .filter((v: any) => v.color === selectedColor && v.size)
        .map((v: any) => ({ size: v.size, stock: Number(v.stock || 0) }));
    }
    return variants
      .filter((v: any) => v.size)
      .map((v: any) => ({ size: v.size, stock: Number(v.stock || 0) }));
  }, [variants, availableColors, selectedColor]);

  // Fallback to product sizes string if no structured variants exist
  const sizes = useMemo(() => {
    if (availableSizes.length > 0) return availableSizes;
    if (product?.sizes) {
      return product.sizes
        .split(',')
        .map((s: string) => ({ size: s.trim(), stock: Number(product.stock || 0) }));
    }
    return [];
  }, [availableSizes, product]);

  // Current active variant based on selection
  const currentVariant = useMemo(() => {
    if (!selectedSize) return null;
    if (selectedColor) {
      return variants.find((v: any) => v.color === selectedColor && v.size === selectedSize) || null;
    }
    return variants.find((v: any) => v.size === selectedSize) || null;
  }, [variants, selectedSize, selectedColor]);

  // Pricing calculations
  const displayPrice = Number(currentVariant?.sale_price || product?.sale || product?.mrp || 0);
  const displayMrp = Number(currentVariant?.price || product?.mrp || 0);
  const inStock = currentVariant ? currentVariant.stock > 0 : Number(product?.stock || 0) > 0;
  const discountPercent = displayMrp > displayPrice ? Math.round((1 - displayPrice / displayMrp) * 100) : 0;

  const handleColorSelect = (c: string) => {
    setSelectedColor(c);
    setSelectedSize('');
    const v = variants.find((varObj: any) => varObj.color === c && varObj.image_url);
    if (v && v.image_url) {
      const idx = images.findIndex((img: string) => img.includes(v.image_url));
      if (idx !== -1) setActiveImg(idx);
    }
  };

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    let variantId = null;
    let variantImg = '';
    if (currentVariant) {
      variantId = currentVariant.id;
      if (currentVariant.image_url) variantImg = currentVariant.image_url;
    } else {
      const v = variants.find((varObj: any) => varObj.color === selectedColor && varObj.size === selectedSize);
      if (v) {
        variantId = v.id;
        if (v.image_url) variantImg = v.image_url;
      }
    }

    const rawImg = (product?.images && product.images.length > 0)
      ? (product.images.find((i: any) => i.is_primary)?.image_url || product.images[0].image_url)
      : (product?.img || '');
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
        variant_id: variantId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          toast.success(data.message);
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
          window.dispatchEvent(new Event('cart_updated'));
        } else {
          toast.error(data.error || 'Failed to add to cart');
        }
      })
      .catch(() => toast.error('Please login to add to cart'));
  };

  const checkDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim().length >= 6) {
      setDeliveryInfo(`✓ Free delivery to ${pincode} within 3–5 business days`);
    } else {
      setDeliveryInfo('Please enter a valid 6-digit pincode');
    }
  };

  return (
    <main id="main-content">
      <style>{`
        .product-page { padding-top: 40px; padding-bottom: 80px; background: var(--bg); }
        .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 32px; flex-wrap: wrap; }
        .breadcrumb a { color: var(--text-muted); text-decoration: none; transition: color .2s; }
        .breadcrumb a:hover { color: var(--primary); }
        .product-page-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
        .product-gallery { display: grid; grid-template-columns: 80px 1fr; gap: 16px; align-items: start; }
        .gallery-thumbnails { display: flex; flex-direction: column; gap: 10px; max-height: 520px; overflow-y: auto; scrollbar-width: none; }
        .gallery-thumbnails::-webkit-scrollbar { display: none; }
        .thumbnail-btn { width: 80px; height: 100px; border-radius: var(--radius-sm); border: 2px solid var(--border); overflow: hidden; background: #fff; cursor: pointer; padding: 0; transition: border-color .2s; }
        .thumbnail-btn.active { border-color: var(--primary); }
        .gallery-main { position: relative; width: 100%; aspect-ratio: 4/5; background: #fff; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); }
        .gallery-badge { position: absolute; top: 16px; left: 16px; z-index: 2; }
        .product-info { display: flex; flex-direction: column; gap: 20px; }
        .product-brand-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--bg-subtle); border-radius: var(--radius-full); font-size: 12px; font-weight: 600; color: var(--text-heading); text-transform: uppercase; width: fit-content; }
        .product-title { font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--text-heading); margin: 0; line-height: 1.25; }
        .product-rating-row { display: flex; align-items: center; gap: 10px; }
        .product-price-row { display: flex; align-items: baseline; gap: 12px; padding: 16px 20px; background: var(--bg-subtle); border-radius: var(--radius-md); width: fit-content; }
        .product-price-now { font-size: 30px; font-weight: 800; color: var(--primary); }
        .product-price-old { font-size: 18px; color: var(--text-light); text-decoration: line-through; }
        .product-price-save { font-size: 14px; font-weight: 700; color: #27AE60; }
        .tax-note { font-size: 12px; color: var(--text-muted); margin: 4px 0 0 2px; }
        .size-section h4 { font-size: 14px; font-weight: 700; color: var(--text-heading); margin: 0 0 12px; display: flex; justify-content: space-between; align-items: center; }
        .size-guide-link { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }
        .size-options { display: flex; gap: 10px; flex-wrap: wrap; }
        .size-btn { padding: 10px 18px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); background: #fff; color: var(--text-heading); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
        .size-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .size-btn.active { border-color: var(--primary); background: var(--primary); color: #fff; }
        .size-btn.oos { opacity: 0.45; cursor: not-allowed; text-decoration: line-through; background: var(--bg-subtle); }
        .add-to-cart-row { display: flex; gap: 14px; align-items: center; }
        .qty-wrap { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-sm); background: #fff; height: 50px; }
        .qty-btn2 { width: 44px; height: 100%; border: none; background: none; font-size: 18px; font-weight: 700; color: var(--text-heading); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .qty-btn2:hover { background: var(--bg-subtle); }
        .qty-num2 { width: 40px; border: none; text-align: center; font-size: 15px; font-weight: 700; color: var(--text-heading); background: transparent; }
        .btn-atc { flex: 1; height: 50px; border-radius: var(--radius-sm); border: none; background: var(--primary); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all .2s; }
        .btn-atc:hover { opacity: 0.92; transform: translateY(-1px); }
        .btn-atc.added { background: #27AE60; }
        .btn-buy { width: 100%; height: 48px; border-radius: var(--radius-sm); border: 2px solid var(--primary); background: transparent; color: var(--primary); font-size: 15px; font-weight: 700; cursor: pointer; transition: all .2s; }
        .btn-buy:hover { background: var(--primary); color: #fff; }
        .product-meta-pills { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .meta-pill { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: var(--text-heading); background: #fff; border: 1px solid var(--border); padding: 8px 12px; border-radius: var(--radius-sm); }
        .meta-pill svg { width: 16px; height: 16px; color: #27AE60; flex-shrink: 0; }
        .delivery-form { display: flex; gap: 10px; margin-top: 10px; }
        .delivery-input { flex: 1; height: 42px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0 14px; font-size: 14px; outline: none; }
        .delivery-input:focus { border-color: var(--primary); }
        .btn-check { height: 42px; padding: 0 20px; border-radius: var(--radius-sm); border: none; background: var(--text-heading); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
        .delivery-result { font-size: 13px; font-weight: 600; color: #27AE60; margin-top: 8px; }

        @media (max-width: 900px) {
          .product-page-layout { grid-template-columns: 1fr; gap: 32px; }
        }
        @media (max-width: 680px) {
          .product-gallery { grid-template-columns: 1fr; }
          .gallery-thumbnails { flex-direction: row; overflow-x: auto; order: 2; }
          .gallery-main { order: 1; }
          .thumbnail-btn { width: 64px; height: 80px; flex-shrink: 0; }
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
          <div style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--text-heading)', marginBottom: '8px' }}>Product Not Found</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '420px', margin: '0 auto 24px' }}>
              The product you are looking for is currently unavailable or may have been moved.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/shop" className="btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                Browse All Products
              </Link>
              <Link href="/" className="btn-outline" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>›</span>
              <Link href="/shop">Shop</Link>
              {product.category && (
                <>
                  <span>›</span>
                  <Link href={`/shop?cat=${encodeURIComponent(product.category.toLowerCase())}`}>{product.category}</Link>
                </>
              )}
              <span>›</span>
              <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{product.name}</span>
            </nav>

            <div className="product-page-layout">
              {/* Gallery Section */}
              <div className="product-gallery">
                <div className="gallery-thumbnails">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      className={`thumbnail-btn${activeImg === i ? ' active' : ''}`}
                      onClick={() => setActiveImg(i)}
                      aria-label={`View image ${i + 1}`}
                    >
                      <img
                        src={getImageUrl(img, 'thumb')}
                        alt={`${product.name} view ${i + 1}`}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </button>
                  ))}
                </div>
                <div className="gallery-main">
                  <img
                    src={getImageUrl(images[activeImg] || images[0], 'optimized')}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {discountPercent > 0 && (
                    <div className="gallery-badge">
                      <span className="badge badge-sale">-{discountPercent}% OFF</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info Section */}
              <div className="product-info">
                <div>
                  <div className="product-brand-badge">
                    <span>{product.category || 'Kids Collection'}</span>
                  </div>
                  <h1 className="product-title" style={{ marginTop: '10px' }}>
                    {product.name}
                  </h1>
                </div>

                <div className="product-rating-row">
                  <div className="stars stars-lg" style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} viewBox="0 0 24 24" width="17" height="17">
                        <polygon
                          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                          fill="#C9A84C"
                          stroke="#C9A84C"
                          strokeWidth="2"
                        />
                      </svg>
                    ))}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>(Customer verified)</span>
                </div>

                <div>
                  <div className="product-price-row">
                    <span className="product-price-now">₹{displayPrice}</span>
                    {displayPrice < displayMrp && <span className="product-price-old">₹{displayMrp}</span>}
                    {displayPrice < displayMrp && (
                      <span className="product-price-save">Save ₹{displayMrp - displayPrice}</span>
                    )}
                  </div>
                  <p className="tax-note">Inclusive of all taxes</p>
                </div>

                {/* Color Selection */}
                {availableColors.length > 0 && (
                  <div className="size-section">
                    <h4>Color: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedColor}</span></h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {availableColors.map((c: any) => (
                        <button
                          key={c}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-sm)',
                            border: selectedColor === c ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: selectedColor === c ? 'rgba(212,82,42,0.08)' : '#fff',
                            color: selectedColor === c ? 'var(--primary)' : 'var(--text-heading)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            transition: 'all .2s',
                          }}
                          onClick={() => handleColorSelect(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="size-section">
                    <h4>
                      Select Size
                      <button className="size-guide-link" onClick={() => setSizeGuideOpen(true)}>
                        Size Guide
                      </button>
                    </h4>
                    <div className="size-options">
                      {sizes.map((sObj: any) => (
                        <button
                          key={sObj.size}
                          className={`size-btn${selectedSize === sObj.size ? ' active' : ''}${sObj.stock <= 0 ? ' oos' : ''}`}
                          onClick={() => sObj.stock > 0 && setSelectedSize(sObj.size)}
                          disabled={sObj.stock <= 0}
                        >
                          {sObj.size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to Cart & Buy */}
                <div>
                  <div className="add-to-cart-row">
                    <div className="qty-wrap">
                      <button className="qty-btn2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                        −
                      </button>
                      <input className="qty-num2" type="number" value={qty} readOnly />
                      <button className="qty-btn2" onClick={() => setQty((q) => q + 1)}>
                        +
                      </button>
                    </div>
                    <button className={`btn-atc${added ? ' added' : ''}`} onClick={handleAddToCart} disabled={!inStock}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      {added ? 'Added to Cart ✓' : inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                  {inStock && (
                    <button className="btn-buy" style={{ marginTop: '12px' }} onClick={() => (window.location.href = '/checkout')}>
                      Buy Now
                    </button>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="product-meta-pills">
                  {['Free Delivery above ₹499', '7-Day Easy Returns', 'Skin-Safe Certified Fabric', 'Free Gift Wrap Available'].map(
                    (p) => (
                      <span key={p} className="meta-pill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {p}
                      </span>
                    )
                  )}
                </div>

                {/* Pincode Check */}
                <div style={{ padding: '18px 20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>
                    Check Estimated Delivery
                  </h4>
                  <form className="delivery-form" onSubmit={checkDelivery}>
                    <input
                      className="delivery-input"
                      type="text"
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                    />
                    <button type="submit" className="btn-check">
                      Check
                    </button>
                  </form>
                  {deliveryInfo && <p className="delivery-result">{deliveryInfo}</p>}
                </div>

                {/* Description */}
                {product.description && (
                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-heading)' }}>
                      Product Description
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: '1.6' }}>
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Customer Reviews Section */}
                <ReviewSection productId={Number(product.id)} />
              </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                    You May Also Like
                  </h2>
                  <Link
                    href={`/shop?cat=${encodeURIComponent((product.category || '').toLowerCase())}`}
                    style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View All {product.category} →
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {relatedProducts.map((rp: any) => {
                    const rpImg = (rp.images && rp.images.length > 0)
                      ? (rp.images.find((i: any) => i.is_primary)?.image_url || rp.images[0].image_url)
                      : (rp.img || '');
                    const rpSale = Number(rp.sale || rp.mrp || 0);
                    const rpMrp = Number(rp.mrp || 0);
                    const rpDiscount = rpMrp > rpSale ? Math.round((1 - rpSale / rpMrp) * 100) : 0;

                    return (
                      <Link key={rp.id} href={`/product?id=${rp.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div
                          style={{
                            background: '#fff',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            transition: 'all .2s ease',
                            paddingBottom: '14px',
                            height: '100%',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                        >
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: 'var(--bg-subtle)' }}>
                            <img
                              src={getImageUrl(rpImg, 'thumb')}
                              alt={rp.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              loading="lazy"
                            />
                            {rpDiscount > 0 && (
                              <span className="badge badge-sale" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                                -{rpDiscount}%
                              </span>
                            )}
                          </div>
                          <div style={{ padding: '14px 14px 0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                              {rp.category || 'Kids'}
                            </div>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {rp.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>₹{rpSale}</span>
                              {rpMrp > rpSale && (
                                <span style={{ fontSize: '12px', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                                  ₹{rpMrp}
                                </span>
                              )}
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

      {/* Size Guide Modal */}
      <Modal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        title="Size Guide"
        size="md"
        footer={<button className="btn btn-ghost" onClick={() => setSizeGuideOpen(false)}>Close</button>}
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
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>0–6 M</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>XS</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>16</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>16</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>68</td></tr>
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>6–12 M</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>S</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>17</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>17</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>76</td></tr>
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>1–2 Y</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>M</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>20</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>19</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>90</td></tr>
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>3–4 Y</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>L</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>22</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>20.5</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>104</td></tr>
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>5–6 Y</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>XL</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>24</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>22</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>116</td></tr>
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>7–8 Y</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>XXL</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>26</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>23</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>128</td></tr>
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>9–10 Y</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>3XL</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>28</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>24</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>140</td></tr>
              <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>11–12 Y</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>4XL</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>30</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>25.5</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>152</td></tr>
            </tbody>
          </table>
          <p style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
            * Measurements shown above are body measurements. If your child is between sizes, we recommend sizing up.
          </p>
        </div>
      </Modal>
    </main>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content">
          <section className="product-page container" style={{ padding: '40px 0 80px' }}>
            <div className="product-page-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
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
          </section>
        </main>
      }
    >
      <ProductContent />
    </Suspense>
  );
}
