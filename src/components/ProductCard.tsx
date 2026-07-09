import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import { formatCurrency, type Product } from '../lib/api';
import { useCart } from '../context/CartContext';

type Props = { product: Product };

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.mainImage,
    });
  };

  const handleCardClick = () => navigate(`/product/${product.id}`);

  return (
    <div className="product-card" onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleCardClick()}>
      {/* Image area */}
      <div className="product-image-wrap">
        {product.isSignature && <span className="product-badge">NEW</span>}
        <img
          src={product.mainImage}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        {/* Mobile: floating cart badge */}
        <button
          className="mobile-cart-badge"
          onClick={handleAddToCart}
          aria-label="Add to cart"
          type="button"
        >
          <ShoppingBag size={14} />
        </button>
      </div>

      {/* Info area */}
      <div className="product-info">
        {product.category?.name && (
          <span className="product-category-label">{product.category.name}</span>
        )}
        <h3 className="product-name">{product.name}</h3>
        {/* Stars — shown on desktop */}
        <div className="product-stars" aria-label="5 out of 5 stars">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={13} fill="#D4AF37" color="#D4AF37" />
          ))}
        </div>
        <div className="product-bottom-row">
          <span className="product-price">{formatCurrency(product.price)}</span>
          <button
            className="product-add-btn"
            onClick={handleAddToCart}
            type="button"
            aria-label="Add to cart"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
