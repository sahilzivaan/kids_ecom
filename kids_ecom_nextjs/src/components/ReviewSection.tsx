import React, { useState, useEffect } from 'react';
import { fetchPublic, fetchCustomerAuth } from '@/utils/api';
import { toast } from '@/utils/toast';
import { formatDate } from '@/utils/date';

export default function ReviewSection({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetchPublic(`/reviews?product_id=${productId}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchCustomerAuth('/reviews', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, rating, comment })
      });
      if (res.ok) {
        toast.success('Review submitted successfully!');
        setShowForm(false);
        setComment('');
        setRating(5);
        let userName = 'Anonymous';
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u.first_name || u.last_name) {
              userName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            } else if (u.name) {
              userName = u.name;
            }
          }
        } catch {}
        setReviews(prev => [{ id: Date.now(), user_name: userName, rating, comment, created_at: new Date().toISOString() }, ...prev]);
      } else {
        toast.error('Failed to submit review. Are you logged in?');
      }
    } catch (err) {
      toast.error('Error submitting review');
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0';
  
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (ratingCounts[r.rating as keyof typeof ratingCounts] !== undefined) {
      ratingCounts[r.rating as keyof typeof ratingCounts]++;
    }
  });
  const totalReviews = reviews.length;

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading reviews...</div>;

  return (
    <div className="review-section" style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
      <style>{`
        .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .review-title { font-family: var(--font-serif); font-size: clamp(24px, 4vw, 32px); font-weight: 700; color: var(--text-heading); }
        .btn-write-review { padding: 12px 24px; border-radius: var(--radius-full); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(212,82,42,0.2); }
        .btn-write-review:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(212,82,42,0.3); }
        
        .review-form-container { background: #fff; padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm); margin-bottom: 40px; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .review-form-container h3 { font-size: 18px; font-weight: 700; margin-bottom: 24px; color: var(--text-heading); }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-body); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .star-rating-input { display: flex; gap: 4px; margin-bottom: 24px; }
        .star-rating-input span { font-size: 28px; cursor: pointer; transition: transform 0.2s; color: var(--muted); }
        .star-rating-input span:hover { transform: scale(1.1); }
        .star-rating-input span.active { color: #F59E0B; }
        
        .review-textarea { width: 100%; padding: 16px; border-radius: var(--radius-md); border: 1.5px solid var(--border); font-family: inherit; font-size: 15px; color: var(--text-heading); background: var(--bg-subtle); transition: all 0.3s ease; resize: vertical; min-height: 120px; }
        .review-textarea:focus { outline: none; border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(212,82,42,0.1); }
        
        .btn-submit-review { padding: 14px 32px; border-radius: var(--radius-md); background: var(--text-heading); color: #fff; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; }
        .btn-submit-review:hover { background: var(--primary); }
        
        .review-layout { display: grid; grid-template-columns: 280px 1fr; gap: 32px; }
        @media (max-width: 900px) { .review-layout { grid-template-columns: 1fr; gap: 32px; } }
        
        .review-summary-block { text-align: left; position: sticky; top: 20px; }
        .amazon-summary-header { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
        .avg-rating-stars { color: #DE7921; font-size: 20px; letter-spacing: 1px; }
        .avg-rating-text-amazon { font-size: 16px; color: var(--text-heading); font-weight: 500; }
        .amazon-total-ratings { color: var(--text-body); font-size: 13px; margin-bottom: 12px; }
        
        .rating-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 13px; }
        .rating-bar-label { min-width: 40px; color: #007185; cursor: pointer; }
        .rating-bar-label:hover { color: #C45500; text-decoration: underline; }
        .rating-bar-track { flex: 1; height: 10px; background: #F0F2F2; border: 1px solid #D5D9D9; border-radius: 4px; overflow: hidden; }
        .rating-bar-fill { height: 100%; background: #DE7921; border-radius: 3px 0 0 3px; }
        .rating-bar-pct { min-width: 35px; text-align: right; color: #007185; cursor: pointer; }
        .rating-bar-pct:hover { color: #C45500; text-decoration: underline; }
        
        .review-list { max-height: 500px; overflow-y: auto; padding-right: 12px; }
        .review-list::-webkit-scrollbar { width: 6px; }
        .review-list::-webkit-scrollbar-track { background: var(--bg-subtle); border-radius: 4px; }
        .review-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .review-list::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        
        .review-card { background: #fff; padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 12px; transition: all 0.3s ease; }
        .review-card:hover { border-color: rgba(212,82,42,0.3); box-shadow: var(--shadow-sm); }
        .review-card-header { display: flex; align-items: flex-start; margin-bottom: 12px; gap: 16px; }
        .reviewer-avatar { width: 44px; height: 44px; flex-shrink: 0; background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; text-transform: uppercase; margin-top: 2px; }
        .reviewer-text-wrap { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 0px; }
        .reviewer-name { font-weight: 800; color: var(--text-heading); font-size: 16px; word-break: break-word; text-transform: capitalize; line-height: 1.2; margin-bottom: 2px; }
        .review-date { color: var(--text-muted); font-size: 12px; white-space: nowrap; line-height: 1; margin-bottom: 2px; }
        .review-card-stars { color: #F59E0B; font-size: 13px; letter-spacing: 2px; line-height: 1; margin-top: 0; }
        .review-card-comment { color: var(--text-body); line-height: 1.5; font-size: 14px; margin-top: 12px; }
      `}</style>

      <div className="review-header">
        <h2 className="review-title">Customer Reviews</h2>
        <button className="btn-write-review" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel Review' : 'Write a Review'}
        </button>
      </div>

      {showForm && (
        <div className="review-form-container">
          <h3>Leave your review</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label className="form-label">Rating</label>
              <div className="star-rating-input">
                {[1,2,3,4,5].map(num => (
                  <span 
                    key={num} 
                    className={num <= rating ? 'active' : ''}
                    onClick={() => setRating(num)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Comment</label>
              <textarea 
                className="review-textarea" 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Tell us what you think about this product..." 
                required
              />
            </div>
            <button type="submit" className="btn-submit-review">Submit Review</button>
          </form>
        </div>
      )}

      <div className="review-layout">
        <div>
          <div className="review-summary-block">
            <div className="amazon-summary-header">
              <div className="avg-rating-stars">
                {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
              </div>
              <div className="avg-rating-text-amazon">{avgRating} out of 5</div>
            </div>
            <div className="amazon-total-ratings">{totalReviews} global rating{totalReviews !== 1 && 's'}</div>

            <div className="rating-bars-container">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingCounts[star as keyof typeof ratingCounts];
                const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="rating-bar-row">
                    <span className="rating-bar-label">{star} star</span>
                    <div className="rating-bar-track">
                      <div className="rating-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="rating-bar-pct">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="review-list">
          {reviews.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-card-header">
                  <div className="reviewer-avatar">
                    {r.user_name ? r.user_name.charAt(0) : 'U'}
                  </div>
                  <div className="reviewer-text-wrap">
                    <div className="reviewer-name">{r.user_name || 'Anonymous User'}</div>
                    <div className="review-date">{formatDate(r.created_at)}</div>
                    <div className="review-card-stars">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                </div>
                <p className="review-card-comment">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
