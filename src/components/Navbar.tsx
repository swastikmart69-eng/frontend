import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import SearchModal from './SearchModal';
import './Navbar.css';

const BrandIcon = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="7" fill="url(#smGold)"/>
    <path d="M16 5L18.9 12.1H26.5L20.3 16.6L22.6 23.5L16 19.3L9.4 23.5L11.7 16.6L5.5 12.1H13.1L16 5Z" fill="#0a0a0a"/>
    <defs>
      <linearGradient id="smGold" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8B6914"/>
        <stop offset="45%" stopColor="#F0D060"/>
        <stop offset="100%" stopColor="#8B6914"/>
      </linearGradient>
    </defs>
  </svg>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState<'home' | 'category' | 'offers'>('home');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const scrollOrNavigate = (target: 'top' | 'category' | 'offers') => {
    const doScroll = () => {
      if (target === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' });
      const id = target === 'category' ? 'category-section' : 'top-items';
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    if (target === 'top') setActiveNav('home');
    else if (target === 'category') setActiveNav('category');
    else setActiveNav('offers');
    setMobileMenuOpen(false);
    if (location.pathname === '/') doScroll();
    else navigate('/', { state: { scrollTo: target } });
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">

        {/* ─── Left: Desktop nav links ─── */}
        <div className="nav-links">
          <button type="button" className={`nav-link${activeNav === 'home' ? ' active' : ''}`} onClick={() => scrollOrNavigate('top')}>Home</button>
          <button type="button" className={`nav-link${activeNav === 'category' ? ' active' : ''}`} onClick={() => scrollOrNavigate('category')}>Category</button>
          <button type="button" className={`nav-link${activeNav === 'offers' ? ' active' : ''}`} onClick={() => scrollOrNavigate('offers')}>Offers</button>
        </div>

        {/* ─── Center: Brand ─── */}
        <Link to="/" className="nav-brand" onClick={() => setActiveNav('home')}>
          <BrandIcon size={30} />
          <span className="brand-name">Swastik Mart</span>
        </Link>

        {/* ─── Right: Action icons ─── */}
        <div className="nav-actions">
          <button className="nav-icon-btn" aria-label="Search" onClick={() => setIsSearchOpen(true)} type="button">
            <Search size={20} />
          </button>
          <button className="nav-icon-btn cart-btn" aria-label="Cart" onClick={() => setIsCartOpen(true)} type="button">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
          </button>
          <Link to="/admin" className="nav-icon-btn" aria-label="Admin">
            <User size={20} />
          </Link>
          {/* Hamburger — mobile only */}
          <button className="nav-icon-btn hamburger-btn" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)} type="button">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* ─── Mobile Slide-out Menu ─── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="mobile-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            >
              <div className="mobile-menu-top">
                <div className="mobile-brand">
                  <BrandIcon size={26} />
                  <span className="brand-name">Swastik Mart</span>
                </div>
                <button className="nav-icon-btn" onClick={() => setMobileMenuOpen(false)} type="button" aria-label="Close menu">
                  <X size={22} />
                </button>
              </div>
              <div className="mobile-links">
                <button type="button" className={`mobile-link${activeNav === 'home' ? ' active' : ''}`} onClick={() => scrollOrNavigate('top')}>🏠 Home</button>
                <button type="button" className={`mobile-link${activeNav === 'category' ? ' active' : ''}`} onClick={() => scrollOrNavigate('category')}>🗂️ Category</button>
                <button type="button" className={`mobile-link${activeNav === 'offers' ? ' active' : ''}`} onClick={() => scrollOrNavigate('offers')}>🏷️ Offers</button>
                <Link to="/admin" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>⚙️ Admin Panel</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;
