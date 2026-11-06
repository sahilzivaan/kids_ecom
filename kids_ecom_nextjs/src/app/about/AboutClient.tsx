'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';

export default function AboutClient() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) {
        (e.target as HTMLElement).style.opacity = '1';
        (e.target as HTMLElement).style.transform = 'translateY(0)';
        io.unobserve(e.target);
      }
    }), { threshold: 0.08 });
    document.querySelectorAll('.value-card, .team-card, .timeline-item-about').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(20px)';
      (el as HTMLElement).style.transition = 'opacity .5s ease, transform .5s ease';
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <main id="main-content">
      <style>{`
        .about-hero { background: var(--accent); padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
        .about-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 30% 50%, rgba(212,82,42,0.15), transparent 55%), radial-gradient(circle at 70% 50%, rgba(201,168,76,0.12), transparent 55%); pointer-events: none; }
        .about-hero-inner { position: relative; z-index: 1; }
        .eyebrow-about { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--primary); margin-bottom: 24px; }
        .eyebrow-about::before, .eyebrow-about::after { content: ''; width: 24px; height: 1px; background: var(--primary); }
        .about-hero h1 { font-family: var(--font-serif); font-size: clamp(38px,5vw,62px); font-weight: 700; color: #fff; margin-bottom: 24px; line-height: 1.1; }
        .about-hero h1 em { font-style: italic; color: var(--gold); }
        .about-hero p { font-size: 17px; color: rgba(255,255,255,0.7); max-width: 640px; margin: 0 auto 48px; line-height: 1.7; }
        .hero-stats-row { display: flex; justify-content: center; gap: 64px; flex-wrap: wrap; margin-top: 40px; }
        .hero-stat .val { font-family: var(--font-serif); font-size: 42px; font-weight: 700; color: #fff; line-height: 1; margin-bottom: 8px; }
        .hero-stat .lbl { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
        .about-section { padding: 100px 0; }
        .about-section.alt { background: var(--bg-white); }
        .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .story-grid h2 { font-family: var(--font-serif); font-size: clamp(32px,4vw,44px); font-weight: 700; line-height: 1.1; margin-bottom: 24px; color: var(--text-heading); }
        .story-grid p { font-size: 16px; color: var(--text-body); line-height: 1.8; margin-bottom: 20px; }
        .story-visual { border-radius: var(--radius-lg); overflow: hidden; position: relative; }
        .story-visual img { width: 100%; height: 500px; object-fit: cover; }
        .story-visual-badge { position: absolute; bottom: 32px; left: -24px; background: #fff; border-radius: var(--radius-md); padding: 24px 32px; box-shadow: var(--shadow-xl); }
        .story-visual-badge .big-num { font-family: var(--font-serif); font-size: 42px; font-weight: 700; color: var(--primary); line-height: 1; margin-bottom: 4px; }
        .story-visual-badge .desc { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .values-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 56px; }
        .value-card { background: #fff; border-radius: var(--radius-md); padding: 40px 32px; border: 1px solid var(--border); text-align: center; transition: var(--transition); }
        .value-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); border-color: transparent; }
        .value-icon { width: 64px; height: 64px; border-radius: var(--radius-full); background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: var(--primary); }
        .value-icon svg { width: 28px; height: 28px; }
        .value-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: var(--text-heading); }
        .value-card p { font-size: 14px; color: var(--text-body); line-height: 1.7; }
        .team-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; margin-top: 56px; }
        .team-card { background: #fff; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); text-align: center; transition: var(--transition); }
        .team-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); border-color: transparent; }
        .team-avatar { height: 200px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; }
        .team-info { padding: 24px; }
        .team-info h3 { font-size: 18px; font-weight: 600; margin-bottom: 4px; color: var(--text-heading); }
        .team-info .role { font-size: 12px; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: block; }
        .team-info p { font-size: 13px; color: var(--text-body); line-height: 1.6; }
        .about-cta { background: var(--bg-subtle); border-radius: var(--radius-lg); padding: 72px 48px; text-align: center; margin: 0 0 100px; }
        .about-cta h2 { font-family: var(--font-serif); font-size: 40px; font-weight: 700; color: var(--text-heading); margin-bottom: 16px; }
        .about-cta p { font-size: 17px; color: var(--text-body); margin-bottom: 32px; max-width: 500px; margin-left: auto; margin-right: auto; }
        @media (max-width: 900px) {
          .story-grid { grid-template-columns: 1fr; gap: 40px; }
          .story-visual-badge { left: 16px; bottom: 16px; padding: 18px 24px; }
          .story-visual-badge .big-num { font-size: 32px; }
          .values-grid { grid-template-columns: 1fr 1fr; }
          .team-grid { grid-template-columns: 1fr 1fr; }
          .hero-stats-row { gap: 32px; }
          .about-section { padding: 64px 0; }
          .about-hero { padding: 72px 0; }
        }
        @media (max-width: 768px) {
          .hero-stat .val { font-size: 32px; }
          .hero-stats-row { gap: 24px; }
          .about-hero h1 { font-size: clamp(30px, 7vw, 50px); }
          .about-hero p { font-size: 15px; }
          .story-grid h2 { font-size: clamp(26px, 5vw, 38px); }
          .story-visual img { height: 380px; }
          .about-cta h2 { font-size: 30px; }
        }
        @media (max-width: 600px) {
          .values-grid { grid-template-columns: 1fr; }
          .team-grid { grid-template-columns: 1fr 1fr; }
          .about-cta { padding: 40px 20px; }
          .about-section { padding: 48px 0; }
          .about-hero { padding: 56px 0; }
        }
        @media (max-width: 480px) {
          .team-grid { grid-template-columns: 1fr; }
          .hero-stats-row { flex-direction: row; flex-wrap: wrap; gap: 20px; justify-content: center; }
          .hero-stat { flex: 0 1 calc(50% - 20px); text-align: center; }
          .value-card { padding: 28px 20px; }
          .about-cta h2 { font-size: 24px; }
          .about-cta p { font-size: 15px; }
        }
      `}</style>

      {/* Hero */}
      <section className="about-hero" aria-labelledby="about-title">
        <div className="container">
          <div className="about-hero-inner">
            <div className="eyebrow-about">Proudly Made in India</div>
            <h1 id="about-title">Dressing India&apos;s Little Stars<br /><em>Since 2010</em></h1>
            <p>We believe every child deserves to wear clothes that make them smile. From festive lehengas to everyday casuals — we craft clothing that&apos;s as joyful as the kids who wear them.</p>
            <div className="hero-stats-row">
              {[['1 Cr+','Happy Kids'],['50K+','Styles'],['100+','Brands'],['500+','Cities']].map(([v,l])=>(
                <div key={l} className="hero-stat"><div className="val">{v}</div><div className="lbl">{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="about-section alt" aria-labelledby="story-title">
        <div className="container">
          <div className="story-grid">
            <div>
              <span className="section-label">Our Story</span>
              <h2 id="story-title">Born from a Mother&apos;s Love for Her Children</h2>
              <p>In 2010, Priya Mehta — a mother of two from Jaipur — noticed a gap in the Indian market: beautiful, affordable kids clothing that blended Indian traditions with modern comfort. She started Chhotu Fashion from her small apartment with just ₹50,000 and a sewing machine.</p>
              <p>Today, Chhotu Fashion is India&apos;s most trusted kids fashion destination — reaching over 500 cities, delivering 1 crore+ orders, and partnering with 100+ brands across the country. Yet our heart remains the same: making every Indian child feel special.</p>
              <div style={{ marginTop: '40px' }}>
                <Link href="/shop" className="btn-primary">Explore Collection</Link>
              </div>
            </div>
            <div className="story-visual">
              <Image src="/images/hero_banner.jpg" alt="Happy Indian children wearing Chhotu Fashion clothing" loading="lazy" width={600} height={500} style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
              <div className="story-visual-badge">
                <div className="big-num">2010</div>
                <div className="desc">Founded in Jaipur</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section" aria-labelledby="values-title">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">What We Stand For</span>
            <h2 className="section-title" id="values-title">Our Core Values</h2>
            <p className="section-sub">The principles that guide every stitch we make</p>
          </div>
          <div className="values-grid">
            {[
              { icon: <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M7 13s1.5 2 5 2 5-2 5-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>, title: 'Safe Fabrics', desc: 'Every fabric we use is tested for skin safety. We only use hypoallergenic, chemical-free materials gentle on delicate skin.' },
              { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, title: 'Ethical Sourcing', desc: 'We partner with certified manufacturers who ensure fair wages, safe working conditions, and sustainable practices.' },
              { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, title: 'Quality First', desc: 'Every garment passes through 12-point quality checks before reaching your doorstep. We never compromise on quality.' },
            ].map((v, i) => (
              <div key={i} className="value-card">
                <div className="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{v.icon}</svg></div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="about-section alt" aria-labelledby="team-title">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">The People</span>
            <h2 className="section-title" id="team-title">Meet Our Team</h2>
            <p className="section-sub">The passionate people behind Chhotu Fashion</p>
          </div>
          <div className="team-grid">
            {[
              { name: 'Priya Mehta', role: 'Founder & CEO', desc: 'A mother of two who started it all with a vision to make kids fashion accessible to every Indian family.', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop' },
              { name: 'Arjun Kapoor', role: 'Head of Design', desc: 'With 15 years in kids fashion, Arjun blends tradition with modern trends to create stunning collections.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
              { name: 'Sunita Rao', role: 'Customer Experience', desc: 'Sunita ensures every customer interaction is delightful and every issue is resolved with a smile.', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop' },
              { name: 'Rohit Shah', role: 'Technology Lead', desc: 'Rohit leads our digital innovation, making shopping seamless across our app and website.', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop' },
            ].map((m) => (
              <div key={m.name} className="team-card">
                <div className="team-avatar" style={{ padding: 0 }}>
                  <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="team-info">
                  <h3>{m.name}</h3>
                  <span className="role">{m.role}</span>
                  <p>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="container">
        <div className="about-cta">
          <h2>Ready to Dress Your Little Star?</h2>
          <p>Explore over 50,000 styles for kids aged 0–14 years. Free delivery above ₹499.</p>
          <Link href="/shop" className="btn-primary accent-btn">Shop Now</Link>
        </div>
      </div>
    </main>
  );
}
