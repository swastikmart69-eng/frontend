import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api, formatCurrency } from '../lib/api';
import CheckoutItem from '../components/CheckoutItem';
import './CheckoutPage.css';

const getGuestDeviceId = () => {
  const key = 'swastikmart_guest_device_id';
  const saved = localStorage.getItem(key);
  if (saved) return saved;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
};

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const shippingAddress = formData.address;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.createOrder({
        guestDeviceId: getGuestDeviceId(),
        customerName: formData.name,
        customerPhone: formData.phone,
        shippingAddress,
        items: cart.map((item) => ({
          productId: item.productId,
          variationId: item.variationId,
          variationName: item.variationName,
          quantity: item.quantity,
          priceAtOrder: item.price,
        })),
      });

      clearCart();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '10rem 0', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-accent)' }}>Your cart is empty</h2>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Browse our collections to find your perfect product.</p>
        <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')} type="button">Return to Shop</button>
      </div>
    );
  }

  return (
    <motion.div
      className="checkout-page container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="checkout-container">
        <div className="checkout-summary">
          <h2 className="summary-title">Order Summary</h2>
          <div className="summary-items">
            {cart.map((item) => (
              <CheckoutItem key={`${item.productId}-${item.variationId || 'base'}`} item={item} />
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Complimentary</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>
        </div>

        <div className="checkout-form-section">
          <h2>Customer Details</h2>
          <form onSubmit={handleConfirm}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input required type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Shipping Address</label>
              <input required type="text" name="address" className="form-input" value={formData.address} onChange={handleChange} />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="checkout-action">
              <button type="submit" className="btn-confirm" disabled={isSubmitting}>
                {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutPage;
