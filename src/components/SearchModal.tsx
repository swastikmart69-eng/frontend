import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ShoppingBag } from 'lucide-react';
import { api, formatCurrency } from '../lib/api';
import type { Product } from '../lib/api';
import { useCart } from '../context/CartContext';
import './SearchModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Load products once modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (allProducts.length > 0) return;
    setIsLoading(true);
    api.getProducts()
      .then(prods => setAllProducts(prods))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen, allProducts.length]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Filter products
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase().trim();
    setResults(
      allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
      ).slice(0, 12)
    );
  }, [query, allProducts]);

  const handleProductClick = (id: string) => {
    onClose();
    navigate(`/product/${id}`);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart({ productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.mainImage });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="search-modal"
            initial={{ opacity: 0, y: -30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Search Input */}
            <div className="search-input-row">
              <Search size={20} className="search-icon-lead" />
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder="Search for face wash, shampoo, skincare..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button className="search-clear-btn" onClick={() => setQuery('')} type="button" aria-label="Clear">
                  <X size={18} />
                </button>
              )}
              <button className="search-close-btn" onClick={onClose} type="button" aria-label="Close search">
                <X size={20} />
              </button>
            </div>

            {/* Results / States */}
            <div className="search-results-area">
              {!query && !isLoading && (
                <div className="search-placeholder">
                  <Search size={40} className="search-placeholder-icon" />
                  <p>Start typing to search products</p>
                  <span>Try "face wash", "shampoo", "skincare"</span>
                </div>
              )}

              {isLoading && (
                <div className="search-loading">
                  <div className="search-spinner" />
                  <span>Loading products...</span>
                </div>
              )}

              {query && !isLoading && results.length === 0 && (
                <div className="search-no-results">
                  <p>No products found for "<strong>{query}</strong>"</p>
                  <span>Try different keywords</span>
                </div>
              )}

              {results.length > 0 && (
                <div className="search-results-list">
                  <p className="search-results-count">{results.length} result{results.length !== 1 ? 's' : ''} for "<strong>{query}</strong>"</p>
                  {results.map(product => (
                    <div
                      key={product.id}
                      className="search-result-item"
                      onClick={() => handleProductClick(product.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <img src={product.mainImage} alt={product.name} className="search-result-img" />
                      <div className="search-result-info">
                        {product.category?.name && (
                          <span className="search-result-category">{product.category.name}</span>
                        )}
                        <h4 className="search-result-name">{product.name}</h4>
                        <span className="search-result-price">{formatCurrency(product.price)}</span>
                      </div>
                      <button
                        className="search-result-cart-btn"
                        onClick={e => handleAddToCart(e, product)}
                        aria-label="Add to cart"
                        type="button"
                      >
                        <ShoppingBag size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
