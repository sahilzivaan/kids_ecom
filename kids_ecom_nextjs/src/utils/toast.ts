export const toast = {
  show: (message: string, type: 'success' | 'error' = 'success') => {
    // Prevent SSR errors
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Create the container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      
      // Inline styles for the container (bottom right)
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none' // allow clicking through empty space
      });
      document.body.appendChild(container);
    }

    // Create the individual toast element
    const el = document.createElement('div');
    
    // Inline styles for the toast
    Object.assign(el.style, {
      padding: '12px 20px',
      background: type === 'success' ? '#27AE60' : '#E74C3C',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      opacity: '0',
      transform: 'translateY(20px)',
      transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      pointerEvents: 'auto'
    });

    // Icon depending on type
    const icon = type === 'success' 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    el.innerHTML = `${icon} <span>${message}</span>`;

    container.appendChild(el);

    // Trigger animation
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.marginTop = `-${el.offsetHeight + 12}px`; // collapse space
      setTimeout(() => {
        if (el.parentNode === container) {
          container.removeChild(el);
        }
      }, 300);
    }, 3000);
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
};
