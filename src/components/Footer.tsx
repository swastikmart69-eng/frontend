import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

const Facebook = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-facebook"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-instagram"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Twitter = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-twitter"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const BrandIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="7" fill="url(#footGold)"/>
    <path d="M16 5L18.9 12.1H26.5L20.3 16.6L22.6 23.5L16 19.3L9.4 23.5L11.7 16.6L5.5 12.1H13.1L16 5Z" fill="#0a0a0a"/>
    <defs>
      <linearGradient id="footGold" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8B6914"/>
        <stop offset="45%" stopColor="#F0D060"/>
        <stop offset="100%" stopColor="#8B6914"/>
      </linearGradient>
    </defs>
  </svg>
);

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">

            {/* Brand Column */}
            <div className="footer-brand-col">
              <Link to="/" className="footer-brand-link">
                <BrandIcon />
                <span className="footer-brand-name">Swastik Mart</span>
              </Link>
              <p className="footer-brand-desc">
                Your trusted destination for premium cosmetics. Quality face wash, shampoo, toothpaste, skincare and more — delivered to your door.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Instagram" className="social-link"><Instagram size={18} /></a>
                <a href="#" aria-label="Facebook" className="social-link"><Facebook size={18} /></a>
                <a href="#" aria-label="Twitter" className="social-link"><Twitter size={18} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Quick Links</h4>
              <ul className="footer-links-list">
                <li><Link to="/">Home</Link></li>
                <li><a href="#category-section">Categories</a></li>
                <li><a href="#top-items">Top Items</a></li>
                <li><a href="#full-catalogue">Full Catalog</a></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div className="footer-col">
              <h4 className="footer-col-title">Customer Care</h4>
              <ul className="footer-links-list">
                <li><Link to="/checkout">Place Order</Link></li>
                <li><a href="#">Shipping Policy</a></li>
                <li><a href="#">Return & Refund</a></li>
                <li><a href="#">Track Your Order</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-col footer-contact-col">
              <h4 className="footer-col-title">Contact Us</h4>
              <ul className="footer-contact-list">
                <li>
                  <Phone size={15} className="contact-icon" />
                  <span>+880 1800-000000</span>
                </li>
                <li>
                  <Mail size={15} className="contact-icon" />
                  <span>support@swastikmart.com</span>
                </li>
                <li>
                  <MapPin size={15} className="contact-icon" />
                  <span>House 40, Road 21, Sector 14, Uttara, Dhaka</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2026 <span className="footer-brand-inline">Swastik Mart</span>. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
