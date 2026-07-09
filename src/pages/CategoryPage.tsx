import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Category } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!id) { setError('Category not specified'); setIsLoading(false); return; }

    Promise.all([api.getCategories(), api.getProducts({ categoryId: id })])
      .then(([cats, prods]) => {
        if (!mounted) return;
        setCategory(cats.find((c) => c.id === id) ?? null);
        setProducts(prods);
      })
      .catch((err: Error) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setIsLoading(false); });

    return () => { mounted = false; };
  }, [id]);

  return (
    <motion.div
      className="category-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="category-page-header">
        <div className="container category-page-header-inner">
          <button className="back-btn" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="category-page-title-wrap">
            <span className="section-label">Browse</span>
            <h1 className="section-heading">{category?.name ?? 'Category'}</h1>
            <div className="section-divider left" />
          </div>
        </div>
      </div>

      {/* Products */}
      <section className="category-products-section">
        <div className="container">
          {isLoading && <p className="state-message">Loading products...</p>}
          {!isLoading && error && <p className="state-message" style={{ color: '#ff6b6b' }}>{error}</p>}

          <div className="category-products-grid">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (idx % 4) * 0.06 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {!isLoading && products.length === 0 && !error && (
            <p className="state-message">No products found in this category.</p>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default CategoryPage;
