'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ContactClient() {
  const [activeSubject, setActiveSubject] = useState('Order Issue');
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const subjects = ['Order Issue', 'Returns & Exchange', 'Product Query', 'Delivery Status', 'Partnership', 'Other'];
  const faqs = [
    { q: 'How do I track my order?', a: "Once your order is shipped, you'll receive an SMS and email with your tracking number. You can track it anytime on our website under 'Track Order' or click the link in your email." },
    { q: 'What is your return policy?', a: 'We offer a 7-day hassle-free return policy. Simply raise a return request on our website, pack the item in its original packaging, and our logistics partner will pick it up from your doorstep.' },
    { q: 'Are your fabrics safe for children?', a: 'Absolutely! All our fabrics are OEKO-TEX certified, hypoallergenic, and free from harmful chemicals. We use only skin-friendly dyes and materials tested to be safe for children\'s sensitive skin.' },
    { q: 'Do you offer Cash on Delivery (COD)?', a: 'Yes! We offer Cash on Delivery across 25,000+ pin codes in India. COD is available on orders up to ₹10,000. You can also pay via UPI, credit/debit cards, net banking, and EMI.' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main id="main-content">
      <style>{`
        .contact-hero { background: var(--accent); padding: 80px 0 100px; text-align: center; position: relative; overflow: hidden; }
        .contact-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 20% 60%, rgba(212,82,42,0.13), transparent 50%), radial-gradient(circle at 80% 40%, rgba(201,168,76,0.12), transparent 50%); }
        .contact-hero-inner { position: relative; z-index: 1; }
        .contact-eyebrow { display: inline-block; padding: 7px 20px; border-radius: var(--radius-full); background: rgba(212,82,42,0.15); border: 1px solid rgba(212,82,42,.3); font-size: 11px; font-weight: 700; color: var(--primary); margin-bottom: 24px; letter-spacing: 1px; text-transform: uppercase; }
        .contact-hero h1 { font-family: var(--font-serif); font-size: clamp(34px,5vw,56px); font-weight: 700; color: #fff; margin-bottom: 16px; line-height: 1.1; }
        .contact-hero h1 em { font-style: italic; color: var(--gold); }
        .contact-hero p { font-size: 16px; color: rgba(255,255,255,.7); max-width: 560px; margin: 0 auto; line-height: 1.7; }
        .contact-cards-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; margin: -60px 0 80px; position: relative; z-index: 5; }
        .contact-card { background: #fff; border-radius: var(--radius-md); padding: 32px 24px; text-align: center; box-shadow: var(--shadow-md); border: 1px solid var(--border); transition: var(--transition); cursor: pointer; }
        .contact-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-xl); border-color: transparent; }
        .cc-icon { width: 56px; height: 56px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; background: var(--bg-subtle); color: var(--primary); margin: 0 auto 20px; }
        .cc-icon svg { width: 24px; height: 24px; }
        .contact-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--text-heading); }
        .contact-card p { font-size: 13px; color: var(--text-body); line-height: 1.6; }
        .cc-link { display: inline-block; margin-top: 16px; font-size: 13px; font-weight: 600; color: var(--primary); border-bottom: 1.5px solid transparent; padding-bottom: 2px; }
        .contact-card:hover .cc-link { border-bottom-color: var(--primary); }
        .contact-main { padding: 0 0 100px; }
        .contact-layout { display: grid; grid-template-columns: 1fr 420px; gap: 48px; align-items: start; }
        .contact-form-box { background: #fff; border-radius: var(--radius-lg); padding: 48px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        .form-header { margin-bottom: 40px; }
        .form-header h2 { font-family: var(--font-serif); font-size: 32px; font-weight: 700; margin-bottom: 12px; color: var(--text-heading); }
        .form-header p { font-size: 15px; color: var(--text-body); line-height: 1.6; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { margin-bottom: 24px; }
        .form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--text-heading); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 14px 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-family: var(--font-sans); font-size: 14px; color: var(--text-heading); background: var(--bg); outline: none; transition: var(--transition); }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(212,82,42,0.1); }
        .form-group textarea { resize: vertical; min-height: 140px; }
        .form-subject-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
        .subject-tag { padding: 10px 18px; border-radius: var(--radius-full); border: 1.5px solid var(--border); background: var(--bg); font-size: 13px; font-weight: 600; color: var(--text-body); cursor: pointer; transition: var(--transition); }
        .subject-tag.active { border-color: var(--primary); background: rgba(212,82,42,0.05); color: var(--primary); }
        .form-checkbox { display: flex; align-items: flex-start; gap: 12px; font-size: 13.5px; color: var(--text-body); margin-bottom: 32px; cursor: pointer; }
        .form-checkbox input { accent-color: var(--primary); width: 18px; height: 18px; margin-top: 2px; flex-shrink: 0; }
        .btn-submit { width: 100%; padding: 18px; border-radius: var(--radius-sm); background: var(--accent); color: #fff; font-weight: 600; font-size: 15px; border: none; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-submit:hover { background: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .form-success { text-align: center; padding: 60px 20px; }
        .success-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(39,174,96,0.1); color: #27AE60; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .success-icon svg { width: 40px; height: 40px; }
        .form-success h3 { font-family: var(--font-serif); font-size: 28px; font-weight: 700; margin-bottom: 12px; color: var(--text-heading); }
        .form-success p { font-size: 15px; color: var(--text-body); line-height: 1.6; }
        .contact-info-sidebar { display: flex; flex-direction: column; gap: 24px; }
        .info-box { background: #fff; border-radius: var(--radius-md); padding: 32px; border: 1px solid var(--border); box-shadow: var(--shadow-xs); }
        .info-box h3 { font-size: 16px; font-weight: 700; margin-bottom: 24px; color: var(--text-heading); text-transform: uppercase; letter-spacing: 1px; }
        .info-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--border); }
        .info-item:last-child { border-bottom: none; padding-bottom: 0; }
        .info-icon { width: 40px; height: 40px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; background: var(--bg-subtle); color: var(--text-muted); flex-shrink: 0; }
        .info-icon svg { width: 18px; height: 18px; }
        .info-item-text .label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        .info-item-text .value { font-size: 14px; font-weight: 600; color: var(--text-heading); margin-top: 4px; }
        .hours-grid { display: flex; flex-direction: column; gap: 12px; }
        .hour-row { display: flex; justify-content: space-between; font-size: 13.5px; padding: 8px 0; border-bottom: 1px solid var(--border); }
        .hour-row:last-child { border: none; }
        .hour-row .day { font-weight: 600; color: var(--text-heading); }
        .open-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: var(--radius-full); background: rgba(39,174,96,0.1); color: #27AE60; font-size: 11px; font-weight: 700; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .open-dot { width: 8px; height: 8px; border-radius: 50%; background: #27AE60; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .faq-section { padding: 100px 0; background: var(--bg-white); }
        .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 56px; }
        .faq-item { background: #fff; border-radius: var(--radius-sm); border: 1px solid var(--border); overflow: hidden; }
        .faq-question { display: flex; align-items: center; justify-content: space-between; padding: 24px; cursor: pointer; font-size: 15px; font-weight: 600; color: var(--text-heading); background: none; border: none; width: 100%; text-align: left; }
        .faq-toggle { font-size: 24px; font-weight: 300; color: var(--text-muted); transition: transform .3s; line-height: 1; }
        .faq-toggle.open { transform: rotate(45deg); color: var(--primary); }
        .faq-answer { padding: 0 24px; max-height: 0; overflow: hidden; font-size: 14px; color: var(--text-body); line-height: 1.7; transition: max-height .4s, padding .4s; }
        .faq-answer.open { max-height: 200px; padding: 0 24px 24px; }
        @media (max-width: 1024px) {
          .contact-layout { grid-template-columns: 1fr; }
          .contact-cards-row { grid-template-columns: 1fr 1fr; }
          .contact-info-sidebar { flex-direction: row; flex-wrap: wrap; }
          .contact-info-sidebar .info-box { flex: 1 1 calc(50% - 12px); min-width: 240px; }
        }
        @media (max-width: 768px) {
          .contact-cards-row { grid-template-columns: 1fr 1fr; gap: 16px; margin: -40px 0 56px; }
          .contact-hero { padding: 60px 0 80px; }
          .faq-grid { grid-template-columns: 1fr; }
          .faq-section { padding: 64px 0; }
          .contact-main { padding: 0 0 64px; }
          .contact-form-box { padding: 36px 28px; }
        }
        @media (max-width: 600px) {
          .contact-cards-row { grid-template-columns: 1fr; gap: 12px; margin: -32px 0 48px; }
          .form-row { grid-template-columns: 1fr; }
          .faq-grid { grid-template-columns: 1fr; }
          .contact-form-box { padding: 28px 18px; }
          .contact-hero h1 { font-size: clamp(28px, 8vw, 48px); }
          .contact-info-sidebar { flex-direction: column; }
          .contact-info-sidebar .info-box { flex: 1 1 100%; }
        }
        @media (max-width: 480px) {
          .form-subject-tags { gap: 8px; }
          .subject-tag { padding: 8px 14px; font-size: 12px; }
          .contact-hero { padding: 48px 0 72px; }
          .contact-cards-row { margin: -28px 0 40px; }
        }
      `}</style>

      <section className="contact-hero" aria-labelledby="contact-title">
        <div className="container"><div className="contact-hero-inner">
          <div className="contact-eyebrow">We&apos;re Here to Help</div>
          <h1 id="contact-title">Get in <em>Touch</em></h1>
          <p>Have a question about your order, need fashion advice, or want to partner with us? Our team is always ready to assist you.</p>
        </div></div>
      </section>

      <div className="container">
        <div className="contact-cards-row" role="list">
          {[
            { icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>, title: 'Call Us', sub: 'Mon–Sat, 9 AM – 8 PM IST', link: '+91 800-123-4567' },
            { icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>, title: 'WhatsApp', sub: 'Quick replies within 5 mins', link: 'Chat on WhatsApp' },
            { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, title: 'Email Us', sub: 'We respond within 24 hours', link: 'hello@chhotufashion.in' },
            { icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>, title: 'Visit a Store', sub: '50+ stores across India', link: 'Find Nearest Store' },
          ].map((c) => (
            <div key={c.title} className="contact-card" role="listitem">
              <div className="cc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg></div>
              <h3>{c.title}</h3><p>{c.sub}</p>
              <span className="cc-link">{c.link}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="contact-main container" aria-label="Contact form and information">
        <div className="contact-layout">
          <div className="contact-form-box">
            {submitted ? (
              <div className="form-success">
                <div className="success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg></div>
                <h3>Message Sent Successfully</h3>
                <p>Our team will get back to you within 24 hours.<br />Thank you for reaching out to Chhotu Fashion!</p>
              </div>
            ) : (
              <>
                <div className="form-header"><h2>Send Us a Message</h2><p>Fill in the details below and we&apos;ll get back to you within 24 hours.</p></div>
                <form id="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="contact-fname">First Name *</label><input type="text" id="contact-fname" placeholder="E.g. Rahul" required /></div>
                    <div className="form-group"><label htmlFor="contact-lname">Last Name *</label><input type="text" id="contact-lname" placeholder="E.g. Sharma" required /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="contact-email">Email Address *</label><input type="email" id="contact-email" placeholder="name@domain.com" required /></div>
                    <div className="form-group"><label htmlFor="contact-phone">Phone Number</label><input type="tel" id="contact-phone" placeholder="+91 98765 43210" /></div>
                  </div>
                  <div className="form-group"><label htmlFor="contact-order">Order ID (if applicable)</label><input type="text" id="contact-order" placeholder="e.g. CF-2026-123456" /></div>
                  <div className="form-group">
                    <label>How can we help you?</label>
                    <div className="form-subject-tags">
                      {subjects.map(s => <button key={s} type="button" className={`subject-tag${activeSubject===s?' active':''}`} onClick={() => setActiveSubject(s)}>{s}</button>)}
                    </div>
                  </div>
                  <div className="form-group"><label htmlFor="contact-message">Your Message *</label><textarea id="contact-message" placeholder="Please provide details so we can assist you better..." required /></div>
                  <label className="form-checkbox"><input type="checkbox" name="newsletter" defaultChecked /><span>Subscribe to our newsletter for exclusive deals and new collection alerts</span></label>
                  <button type="submit" className="btn-submit">Send Message <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
                </form>
              </>
            )}
          </div>
          <div className="contact-info-sidebar">
            <div className="info-box">
              <h3>Contact Information</h3>
              {[
                { icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>, label: 'Customer Care', value: '+91 800-123-4567' },
                { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, label: 'Email Address', value: 'hello@chhotufashion.in' },
                { icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>, label: 'Head Office', value: '42 Fashion District, Jaipur – 302001, India' },
              ].map((item) => (
                <div key={item.label} className="info-item">
                  <div className="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg></div>
                  <div className="info-item-text"><div className="label">{item.label}</div><div className="value">{item.value}</div></div>
                </div>
              ))}
            </div>
            <div className="info-box">
              <div className="open-badge"><span className="open-dot"></span> We&apos;re Open Now</div>
              <h3>Working Hours</h3>
              <div className="hours-grid">
                {[['Monday – Friday','9:00 AM – 8:00 PM'],['Saturday','10:00 AM – 7:00 PM'],['Sunday','11:00 AM – 5:00 PM'],['Public Holidays','Closed']].map(([d,t])=>(
                  <div key={d} className="hour-row"><span className="day">{d}</span><span className="time" style={d==='Public Holidays'?{color:'var(--primary)',fontWeight:600}:{}}>{t}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">Frequently Asked</span>
            <h2 className="section-title" id="faq-title">Quick Answers</h2>
            <p className="section-sub">Most common questions from our customers</p>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-question" aria-expanded={openFaq===i} onClick={() => setOpenFaq(openFaq===i?null:i)}>
                  <span>{faq.q}</span>
                  <span className={`faq-toggle${openFaq===i?' open':''}`}>+</span>
                </button>
                <div className={`faq-answer${openFaq===i?' open':''}`}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
