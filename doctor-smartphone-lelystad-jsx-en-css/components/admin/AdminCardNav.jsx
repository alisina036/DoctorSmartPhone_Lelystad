import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { LogOut } from 'lucide-react';
import './AdminCardNav.css';

const AdminCardNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const navItems = [
    {
      label: 'Beheer',
      bgColor: '#3ca0de',
      textColor: '#fff',
      links: [
        { label: 'Merken', href: '/admin/merken' },
        { label: 'Toestellen', href: '/admin/toestellen' },
        { label: 'Reparaties', href: '/admin/reparaties' }
      ]
    },
    {
      label: 'Verkoop',
      bgColor: '#2d8bc7',
      textColor: '#fff',
      links: [
        { label: 'Kassa', href: '/admin/kassa' },
        { label: 'Vitrine', href: '/admin/vitrine' },
        { label: 'Hero Carousel', href: '/admin/carousel' }
      ]
    },
    {
      label: 'Admin',
      bgColor: '#1e6ba8',
      textColor: '#fff',
      links: [
        { label: 'Facturen', href: '/admin/facturen' },
        { label: 'Voorraad', href: '/admin/voorraad' },
        { label: 'Waarschuwingen', href: '/admin/alerts' },
        { label: 'Afspraken', href: '/admin/afspraken' }
      ]
    }
  ];

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }

    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease: 'power3.out'
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadAlertsCount = async () => {
      try {
        const res = await fetch('/api/inventory/alerts?isResolved=false');
        const data = await res.json();
        if (!isActive) return;
        const count = Array.isArray(data) ? data.filter(a => !a.isResolved).length : 0;
        setAlertCount(count);
      } catch (error) {
        if (isActive) setAlertCount(0);
      }
    };

    loadAlertsCount();
    const interval = setInterval(loadAlertsCount, 60000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i) => (el) => {
    if (el) cardsRef.current[i] = el;
  };

  const handleLogout = () => {
    window.location.href = '/api/admin/logout';
  };

  return (
    <div className="admin-card-nav-container">
      <nav ref={navRef} className={`admin-card-nav ${isExpanded ? 'open' : ''}`}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Menu sluiten' : 'Menu openen'}
            tabIndex={0}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
            {!isExpanded && alertCount > 0 && (
              <span className="hamburger-alert-badge" aria-label={`${alertCount} waarschuwingen`}>
                {alertCount}
              </span>
            )}
          </div>

          <div className="logo-container">
            <span className="admin-logo">Admin Panel</span>
          </div>

          <button
            type="button"
            className="card-nav-logout-button"
            onClick={handleLogout}
            title="Uitloggen"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(navItems || []).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className={`nav-card-link ${mounted && pathname === lnk.href ? 'active' : ''}`}
                    href={lnk.href}
                    aria-label={lnk.label}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                    {isExpanded && lnk.label === 'Waarschuwingen' && alertCount > 0 && (
                      <span className="nav-alert-badge" aria-label={`${alertCount} waarschuwingen`}>
                        {alertCount}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminCardNav;
