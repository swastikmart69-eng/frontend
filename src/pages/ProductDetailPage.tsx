import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api, formatCurrency } from '../lib/api';
import type { Product, ProductVariation } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductVariation | null>>({});
  const [activeImage, setActiveImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError('');
    setSimilarProducts([]);
    setSelectedOptions({});

    api.getProduct(id)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        setActiveImage(data.mainImage);
        // Load similar products from same category
        if (data.categoryId) {
          api.getProducts({ categoryId: data.categoryId })
            .then(prods => {
              if (isMounted) setSimilarProducts(prods.filter(p => p.id !== data.id));
            })
            .catch(() => {});
        }
      })
      .catch((err: Error) => { if (isMounted) setError(err.message); })
      .finally(() => { if (isMounted) setIsLoading(false); });

    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const firstOpt = Object.values(selectedOptions).find(Boolean);
    if (firstOpt?.imageUrl) setActiveImage(firstOpt.imageUrl);
    else setActiveImage(product.mainImage);
  }, [product, selectedOptions]);

  const variationGroups = useMemo(() => {
    if (!product) return [] as Array<{ name: string; options: ProductVariation[] }>;
    const groups: Record<string, ProductVariation[]> = {};
    (product.variations ?? []).forEach((v) => {
      groups[v.name] = groups[v.name] ?? [];
      groups[v.name].push(v);
    });
    return Object.keys(groups).map((name) => ({ name, options: groups[name] }));
  }, [product]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [product.mainImage];
    if (product.images?.length) imgs.push(...product.images.map((img) => img.url));
    if (product.variations?.length) {
      product.variations.forEach((v) => { if (v.imageUrl) imgs.push(v.imageUrl); });
    }
    return Array.from(new Set(imgs));
  }, [product]);

  const finalPrice = product
    ? product.price + Object.values(selectedOptions).reduce((sum, opt) => sum + (opt?.priceAdded ?? 0), 0)
    : 0;
  const cartName = product
    ? `${product.name}${Object.values(selectedOptions).filter(Boolean).map((opt) => ` - ${opt!.name}: ${opt!.value}`).join('')}`
    : '';

  const addCurrentProductToCart = () => {
    if (!product) return;
    const primaryOpt = Object.values(selectedOptions).find(Boolean) ?? null;
    addToCart({
      productId: product.id,
      variationId: primaryOpt?.id,
      variationName: Object.values(selectedOptions).filter(Boolean).map((opt) => `${opt!.name}: ${opt!.value}`).join(', '),
      name: cartName,
      price: finalPrice,
      quantity: 1,
      image: primaryOpt?.imageUrl ?? product.mainImage,
    });
  };

  const handleBuyNow = () => {
    addCurrentProductToCart();
    navigate('/checkout');
  };

  if (isLoading) {
    return <div className="container page-state"><p>Loading product...</p></div>;
  }

  if (error || !product) {
    return (
      <div className="container page-state">
        <h2>Product not found</h2>
        <p>{error || 'This product is not available.'}</p>
        <button className="btn-primary" onClick={() => navigate('/')} type="button">Return to Shop</button>
      </div>
    );
  }

  return (
    <motion.div
      className="product-detail-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        {/* ── Product Main ── */}
        <div className="product-detail-container">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="gallery-thumbnails">
              {galleryImages.map((img, idx) => (
                <img
                  key={`${product.id}-thumb-${idx}`}
                  src={img}
                  alt={product.name}
                  className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                  onMouseEnter={() => setActiveImage(img)}
                  onClick={() => setActiveImage(img)}
                />
              ))}
            </div>
            <div className="gallery-main">
              <motion.img
                key={activeImage}
                src={activeImage}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="product-info-section">
            <span className="product-collection">{product.category?.name ?? 'Swastik Mart'}</span>
            <h1 className="product-title-large">{product.name}</h1>
            <p className="product-desc-large">{product.description || product.shortDescription}</p>

            <div className="price-section">
              <span className="current-price">{formatCurrency(finalPrice)}</span>
            </div>

            {variationGroups.length > 0 && (
              <div className="variation-selector">
                <span className="var-label">Variation</span>
                <div className="variation-groups">
                  {variationGroups.map((group) => (
                    <div key={group.name} className="variation-group-block">
                      <div className="variation-group-label">{group.name}</div>
                      <div className="variation-options">
                        {group.options.map((opt) => (
                          <button
                            key={opt.id}
                            className={`variation-choice ${selectedOptions[opt.name]?.id === opt.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedOptions((curr) => ({ ...curr, [opt.name]: opt }));
                              if (opt.imageUrl) setActiveImage(opt.imageUrl);
                            }}
                            type="button"
                          >
                            {opt.value}
                            {opt.priceAdded > 0 ? ` +${formatCurrency(opt.priceAdded)}` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="actions-row">
              <button className="btn-primary btn-large" onClick={handleBuyNow} type="button">Buy Now</button>
              <button className="btn-secondary btn-large" onClick={addCurrentProductToCart} type="button">Add to Cart</button>
            </div>
          </div>
        </div>

        {/* ── Similar Products ── */}
        {similarProducts.length > 0 && (
          <section className="similar-section">
            <div className="section-header">
              <span className="section-label">You May Also Like</span>
              <h2 className="section-heading">Similar Products</h2>
              <div className="section-divider left" />
            </div>
            <div className="similar-grid">
              {similarProducts.slice(0, 8).map((p, idx) => (
                <motion.div
                  key={p.id}
                  className={idx >= 4 ? 'hide-on-mobile' : ''}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (idx % 4) * 0.08 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
            {product.categoryId && (
              <div className="similar-footer">
                <button
                  className="btn-outline"
                  onClick={() => navigate(`/category/${product.categoryId}`)}
                  type="button"
                >
                  Show All Similar Products <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </motion.div>
  );
};

export default ProductDetailPage;
