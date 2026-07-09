import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, ShoppingBag, Shield, Truck, Award } from 'lucide-react';
import { api } from '../lib/api';
import type { Category, Product } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<string>('all');
  const [catalogVisible, setCatalogVisible] = useState(8);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getCategories(),
      api.getProducts({ isSignature: true }),
      api.getProducts(),
    ]).then(([cats, topProds, allProds]) => {
      if (!isMounted) return;
      setCategories(cats);
      setTopProducts(topProds.slice(0, 8));
      setAllProducts(allProds);
    }).catch((err: Error) => {
      if (isMounted) setError(err.message);
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Handle scroll navigation from Navbar
  useEffect(() => {
    const state = (location as any).state as { scrollTo?: string } | null;
    if (!state?.scrollTo) return;
    const target = state.scrollTo;
    setTimeout(() => {
      if (target === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' });
      const id = target === 'category' ? 'category-section' : 'top-items';
      scrollToSection(id);
    }, 200);
    // Clear the state to avoid repeated scrolling
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const filteredCatalog = catalogFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.categoryId === catalogFilter);
  const visibleCatalog = filteredCatalog.slice(0, catalogVisible);
  const hasMore = visibleCatalog.length < filteredCatalog.length;

  const handleFilterChange = (id: string) => {
    setCatalogFilter(id);
    setCatalogVisible(8);
  };

  return (
    <motion.div className="homepage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

      {/* ════════════════════════════════════════
          SECTION 1: HERO BANNER
      ════════════════════════════════════════ */}
      <section className="hero-banner">
        <div className="hero-bg-decoration" />
        <div className="container hero-container">

          {/* Left: Text Content */}
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="hero-label">✦ Premium Cosmetics Store</span>
            <h1 className="hero-title">
              Your Daily<br />
              Beauty <span className="hero-title-gold">Routine,</span><br />
              Elevated.
            </h1>
            <p className="hero-desc">
              Discover face wash, shampoo, toothpaste, serums, and skincare essentials — all crafted for your best self.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => scrollToSection('top-items')} type="button">
                Shop Now <ShoppingBag size={18} />
              </button>
              <button className="btn-outline" onClick={() => scrollToSection('category-section')} type="button">
                Browse Categories
              </button>
            </div>
            <div className="hero-features">
              <div className="hero-feature-item">
                <Shield size={16} className="feature-icon" />
                <span>100% Certified</span>
              </div>
              <div className="hero-feature-item">
                <Truck size={16} className="feature-icon" />
                <span>Fast Delivery</span>
              </div>
              <div className="hero-feature-item">
                <Award size={16} className="feature-icon" />
                <span>Best Quality</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="hero-img-container">
              <div className="hero-glow" />
              <img
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=800"
                alt="Premium cosmetics collection"
                className="hero-main-img"
              />
              <div className="hero-badge-1">
                <span className="badge-icon">✦</span>
                <div>
                  <div className="badge-title">Premium Quality</div>
                  <div className="badge-sub">Dermatologist Tested</div>
                </div>
              </div>
              <div className="hero-badge-2">
                <div className="badge-title">500+</div>
                <div className="badge-sub">Happy Customers</div>
              </div>
            </div>

            {/* Product Tags */}
            <div className="hero-tags">
              {['Face Wash', 'Shampoo', 'Toothpaste', 'Moisturizer', 'Serum'].map((tag, i) => (
                <motion.span
                  key={tag}
                  className="hero-tag-pill"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2: CATEGORIES
      ════════════════════════════════════════ */}
      <section className="category-section" id="category-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Shop By</span>
            <h2 className="section-heading">Categories</h2>
            <div className="section-divider" />
          </div>

          {isLoading && <p className="state-message">Loading categories...</p>}
          {!isLoading && error && <p className="state-message" style={{ color: '#ff6b6b' }}>{error}</p>}

          <div className="category-grid">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                className="category-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                onClick={() => navigate(`/category/${cat.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/category/${cat.id}`)}
              >
                <div className="category-img-wrap">
                  <img
                    src={cat.imageUrl || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=600'}
                    alt={cat.name}
                    className="category-img"
                    loading="lazy"
                  />
                </div>
                <div className="category-overlay">
                  <h3 className="category-name">{cat.name}</h3>
                  <div className="category-meta">
                    <span className="category-count">{cat._count?.products ?? 0} Products</span>
                    <span className="category-arrow"><ArrowRight size={16} /></span>
                  </div>
                </div>
              </motion.div>
            ))}
            {!isLoading && categories.length === 0 && !error && (
              <p className="state-message" style={{ gridColumn: '1/-1' }}>No categories yet — add them from the Admin panel.</p>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3: TOP ITEMS
      ════════════════════════════════════════ */}
      <section className="top-items-section" id="top-items">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Featured</span>
            <h2 className="section-heading">Top Items</h2>
            <div className="section-divider" />
          </div>

          {!isLoading && topProducts.length === 0 && (
            <p className="state-message">No featured products yet.</p>
          )}

          <div className="top-products-grid">
            {topProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                className={idx >= 6 ? 'hide-on-mobile' : ''}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (idx % 4) * 0.08 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4: FULL CATALOGUE
      ════════════════════════════════════════ */}
      <section className="catalogue-section" id="full-catalogue">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Complete Range</span>
            <h2 className="section-heading">Full Product Catalog</h2>
            <p className="section-desc">
              Explore our complete collection of premium cosmetics — from cleansers and hair care to oral care and skincare essentials.
            </p>
            <div className="section-divider" />
          </div>

          {/* Category Filter Tabs */}
          <div className="catalogue-filters">
            <button
              className={`filter-tab${catalogFilter === 'all' ? ' active' : ''}`}
              onClick={() => handleFilterChange('all')}
              type="button"
            >All</button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-tab${catalogFilter === cat.id ? ' active' : ''}`}
                onClick={() => handleFilterChange(cat.id)}
                type="button"
              >{cat.name}</button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="catalogue-grid">
            {visibleCatalog.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (idx % 4) * 0.06 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
            {!isLoading && filteredCatalog.length === 0 && (
              <p className="state-message" style={{ gridColumn: '1/-1' }}>
                No products in this category yet.
              </p>
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <motion.div
              className="catalogue-more"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <button
                className="btn-outline load-more-btn"
                onClick={() => setCatalogVisible(prev => prev + 8)}
                type="button"
              >
                Load More Products <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </section>

    </motion.div>
  );
};

export default HomePage;
