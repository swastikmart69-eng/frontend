import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, formatCurrency } from '../../lib/api';
import supabase from '../../lib/supabaseClient';
import type { Category, Order, OrderStatus, Product } from '../../lib/api';
import './Admin.css';
import { AdminLogin } from './AdminLogin';
 
const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? 'uploads';

import { AdminSummary } from './AdminSummary';

type AdminTab = 'summary' | 'orders' | 'products' | 'categories' | 'settings';
type OptionDraft = {
  id: string;
  value: string;
  priceAdded: string;
  image: File | null;
  imageUrl?: string | null;
};

type VariationGroupDraft = {
  id: string;
  name: string;
  options: OptionDraft[];
};

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'APPROVED', 'DELIVERED', 'CANCELLED'];

const createOptionDraft = (): OptionDraft => ({
  id: crypto.randomUUID(),
  value: '',
  priceAdded: '',
  image: null,
  imageUrl: null,
});

const createGroupDraft = (): VariationGroupDraft => ({
  id: crypto.randomUUID(),
  name: '',
  options: [createOptionDraft()],
});

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('admin_token') === 'swastikmart_authenticated';
  });
  const [activeTab, setActiveTab] = useState<AdminTab>('summary');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [productCache, setProductCache] = useState<Record<string, Product | null>>({});

  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState<File | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    categoryId: '',
    isSignature: true,
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string | null>(null);
  const [variationGroups, setVariationGroups] = useState<VariationGroupDraft[]>([createGroupDraft()]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<FileList | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [categoryData, productData, orderData] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getOrders(),
      ]);
      setCategories(categoryData);
      setProducts(productData);
      setOrders(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const flashMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(''), 2500);
  };

  const handleCreateCategory = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      // If an image file is selected, upload directly to Supabase Storage
      let imageUrl: string | null = null;
      if (categoryImage) {
        const file = categoryImage;
        const ext = file.name.split('.').pop();
        const fileName = `categories/${Date.now()}_${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadErr) {
          console.error('Supabase storage upload error', uploadErr);
          throw new Error('Failed to upload image');
        }
        const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
        imageUrl = publicData.publicUrl;
      }

      await api.createCategory({ name: categoryName, image_url: imageUrl });
      setCategoryName('');
      setCategoryImage(null);
      flashMessage('Category saved');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save category');
    }
  };

  const handleCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!editingProductId && !mainImage) {
      setError('Main image is required');
      return;
    }
    try {
      // helper to upload a file and return its public URL
      const uploadFile = async (file: File, folder = 'products') => {
        const ext = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
        return publicData.publicUrl as string;
      };

      const mainImageUrl = mainImage ? await uploadFile(mainImage, 'products/main') : existingMainImageUrl;

      const secondaryUrls: string[] = [];
      if (secondaryImages && secondaryImages.length > 0) {
        for (let i = 0; i < secondaryImages.length; i++) {
          const f = secondaryImages[i] as File;
          try {
            const url = await uploadFile(f, 'products/secondary');
            secondaryUrls.push(url);
          } catch (uploadErr) {
            console.error('Secondary image upload failed', uploadErr);
          }
        }
      }

      const variationPayload = [] as any[];
      for (const group of variationGroups) {
        if (!group.name.trim()) continue;
        for (const opt of group.options) {
          if (!opt.value.trim()) continue;
          let imageUrl: string | null = opt.imageUrl ?? null;
          if (opt.image) {
            try {
              imageUrl = await uploadFile(opt.image as File, `products/variations`);
            } catch (uploadErr) {
              console.error('Variation option image upload failed', uploadErr);
            }
          }
          variationPayload.push({ name: group.name.trim(), value: opt.value.trim(), priceAdded: Number(opt.priceAdded || 0), imageUrl });
        }
      }

      const payload = {
        name: productForm.name,
        short_description: productForm.shortDescription,
        description: productForm.description,
        price: Number(productForm.price),
        is_signature: Boolean(productForm.isSignature),
        category_id: productForm.categoryId || null,
        main_image: mainImageUrl,
        images: secondaryUrls,
        variations: variationPayload,
        stock: 0,
        metadata: {},
      };

      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        flashMessage('Product updated');
      } else {
        await api.createProduct(payload);
        flashMessage('Product saved');
      }

      setProductForm({ name: '', shortDescription: '', description: '', price: '', categoryId: '', isSignature: true });
      setVariationGroups([createGroupDraft()]);
      setMainImage(null);
      setSecondaryImages(null);
      setEditingProductId(null);
      setExistingMainImageUrl(null);
      await loadData();
    } catch (err) {
      console.error('Create product error', err);
      setError(err instanceof Error ? err.message : 'Could not save product');
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description ?? '',
      price: String(product.price),
      categoryId: product.categoryId ?? '',
      isSignature: product.isSignature,
    });
    // build variation groups from flat variations
    const groupsMap: Record<string, any[]> = {};
    (product.variations || []).forEach((v) => {
      groupsMap[v.name] = groupsMap[v.name] || [];
      groupsMap[v.name].push({ id: v.id, value: v.value, priceAdded: String(v.priceAdded ?? 0), image: null, imageUrl: v.imageUrl ?? null });
    });
    const groups = Object.keys(groupsMap).length > 0 ? Object.keys(groupsMap).map((name) => ({ id: crypto.randomUUID(), name, options: groupsMap[name] })) : [createGroupDraft()];
    setVariationGroups(groups);
    setExistingMainImageUrl(product.mainImage);
    setMainImage(null);
    setSecondaryImages(null);
    // scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (id: string) => {
    setError('');
    try {
      await api.deleteProduct(id);
      flashMessage('Product deleted');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete product');
    }
  };

  const deleteCategory = async (id: string) => {
    setError('');
    try {
      await api.deleteCategory(id);
      flashMessage('Category deleted');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category');
    }
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    setError('');
    try {
      await api.updateOrderStatus(id, status);
      flashMessage('Order updated');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order');
    }
  };

  const toggleExpand = async (orderId: string) => {
    setExpandedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    for (const it of order.items || []) {
      if (it.variationId && !productCache[it.productId]) {
        try {
          const p = await api.getProduct(it.productId);
          setProductCache((prev) => ({ ...prev, [p.id]: p }));
        } catch (err) {
          // ignore
        }
      }
    }
  };

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <h3>Admin Panel</h3>
        <div className="admin-nav">
          {(['summary', 'orders', 'products', 'categories', 'settings'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              className={`admin-nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === 'settings' ? 'Site Settings' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button
            className="admin-nav-item"
            onClick={() => {
              localStorage.removeItem('admin_token');
              setIsLoggedIn(false);
            }}
            type="button"
            style={{ marginTop: 'auto', color: '#ffb4a8', borderLeftColor: 'transparent' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h2>
          <button className="action-btn" onClick={loadData} type="button">Refresh</button>
        </div>

        {message && <p className="admin-message">{message}</p>}
        {error && <p className="admin-error">{error}</p>}
        {isLoading && <p className="admin-muted">Loading admin data...</p>}

        {!isLoading && activeTab === 'summary' && (
          <AdminSummary orders={orders} />
        )}

        {!isLoading && activeTab === 'orders' && (() => {
          const pendingOrders = orders.filter(o => o.status === 'PENDING');
          const approvedOrders = orders.filter(o => o.status === 'APPROVED');
          const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
          const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

          const filteredOrders = orderFilter === 'ALL' ? orders : orders.filter(o => o.status === orderFilter);

          return (
          <div>
            <div className="order-status-boxes">
              <div
                className={`order-status-box status-box-pending ${orderFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setOrderFilter(orderFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                role="button"
                tabIndex={0}
              >
                <div className="status-box-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="status-box-info">
                  <span className="status-box-count">{pendingOrders.length}</span>
                  <span className="status-box-label">Pending</span>
                </div>
              </div>
              <div
                className={`order-status-box status-box-approved ${orderFilter === 'APPROVED' ? 'active' : ''}`}
                onClick={() => setOrderFilter(orderFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
                role="button"
                tabIndex={0}
              >
                <div className="status-box-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div className="status-box-info">
                  <span className="status-box-count">{approvedOrders.length}</span>
                  <span className="status-box-label">Approved</span>
                </div>
              </div>
              <div
                className={`order-status-box status-box-delivered ${orderFilter === 'DELIVERED' ? 'active' : ''}`}
                onClick={() => setOrderFilter(orderFilter === 'DELIVERED' ? 'ALL' : 'DELIVERED')}
                role="button"
                tabIndex={0}
              >
                <div className="status-box-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <div className="status-box-info">
                  <span className="status-box-count">{deliveredOrders.length}</span>
                  <span className="status-box-label">Delivered</span>
                </div>
              </div>
              <div
                className={`order-status-box status-box-cancelled ${orderFilter === 'CANCELLED' ? 'active' : ''}`}
                onClick={() => setOrderFilter(orderFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
                role="button"
                tabIndex={0}
              >
                <div className="status-box-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </div>
                <div className="status-box-info">
                  <span className="status-box-count">{cancelledOrders.length}</span>
                  <span className="status-box-label">Cancelled</span>
                </div>
              </div>
            </div>

            {orderFilter !== 'ALL' && (
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`status-badge status-${orderFilter.toLowerCase()}`}>{orderFilter}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
                <button className="action-btn" type="button" onClick={() => setOrderFilter('ALL')} style={{ marginLeft: 'auto' }}>Show All</button>
              </div>
            )}

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr>
                        <td>
                          <button className="action-btn" type="button" onClick={() => toggleExpand(order.id)}>
                            {expandedOrders.includes(order.id) ? '−' : '+'}
                          </button>
                          <span style={{ marginLeft: 8 }}>#{order.id.slice(0, 8)}</span>
                        </td>
                        <td>{order.customerName}<br /><span>{order.customerPhone}</span></td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>{formatCurrency(order.totalAmount)}</td>
                        <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                        <td>
                          <select
                            className="admin-select"
                            value={order.status}
                            onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}
                          >
                            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                      </tr>

                      {expandedOrders.includes(order.id) && (
                        <tr>
                          <td colSpan={6}>
                            <div style={{ padding: '1rem 0' }}>
                              <strong>Customer:</strong> {order.customerName} — {order.customerPhone}<br />
                              <strong>Shipping Address:</strong> {order.shippingAddress}
                              <div style={{ marginTop: '0.75rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: 'left' }}>Product</th>
                                      <th>Variant</th>
                                      <th>Qty</th>
                                      <th>Price</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(order.items || []).map((it) => {
                                      const cached = productCache[it.productId] ?? (it.product as Product | null);
                                      const variation = cached?.variations?.find((v) => v.id === it.variationId);
                                      const variationLabel = it.variationName || (variation ? `${variation.name}: ${variation.value}` : (it.variationId ?? ''));
                                      return (
                                        <tr key={it.id}>
                                          <td style={{ padding: '8px 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                              <img src={cached?.mainImage ?? ''} alt={cached?.name ?? ''} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                                              <div>
                                                <div>{cached?.name ?? it.productId}</div>
                                              </div>
                                            </div>
                                          </td>
                                          <td style={{ textAlign: 'center' }}>{variationLabel}</td>
                                          <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                                          <td style={{ textAlign: 'center' }}>{formatCurrency(it.priceAtOrder)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={6}>No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {!isLoading && activeTab === 'products' && (
          <>
            <form className="admin-form" onSubmit={handleCreateProduct}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Short Description</label>
                <input value={productForm.shortDescription} onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>
                    <option value="">No category</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
                <label className="admin-checkbox">
                  <input type="checkbox" checked={productForm.isSignature} onChange={(e) => setProductForm({ ...productForm, isSignature: e.target.checked })} />
                  Signature product
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Main Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] ?? null)} required />
                </div>
                <div className="form-group">
                  <label>Secondary Images</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setSecondaryImages(e.target.files)} />
                </div>
              </div>
              <div className="form-group">
                <div className="variation-form-header">
                  <label>Variations</label>
                  <button
                    className="action-btn"
                    type="button"
                    onClick={() => setVariationGroups((current) => [...current, createGroupDraft()])}
                  >
                    + Add Variation Group
                  </button>
                </div>
                <div className="variation-form-list">
                  {variationGroups.map((group) => (
                    <div className="variation-group" key={group.id}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Variation Name</label>
                          <input
                            placeholder="Size, Color, Material"
                            value={group.name}
                            onChange={(e) => setVariationGroups((current) => current.map((gr) => (
                              gr.id === group.id ? { ...gr, name: e.target.value } : gr
                            )))}
                          />
                        </div>
                        <div className="form-group">
                          <label />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="action-btn"
                              type="button"
                              onClick={() => setVariationGroups((current) => current.filter((gr) => gr.id !== group.id))}
                            >
                              Remove Group
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="options-list">
                        {group.options.map((opt, oIndex) => (
                          <div className="variation-form-row" key={opt.id}>
                            <div className="form-group">
                              <label>Option Value</label>
                              <input
                                placeholder="Red, M, 22K"
                                value={opt.value}
                                onChange={(e) => setVariationGroups((current) => current.map((gr) => (
                                  gr.id === group.id ? { ...gr, options: gr.options.map(o => o.id === opt.id ? { ...o, value: e.target.value } : o) } : gr
                                )))}
                              />
                            </div>
                            <div className="form-group">
                              <label>Price Adj.</label>
                              <input
                                type="number"
                                min="-999999"
                                step="0.01"
                                value={opt.priceAdded}
                                onChange={(e) => setVariationGroups((current) => current.map((gr) => (
                                  gr.id === group.id ? { ...gr, options: gr.options.map(o => o.id === opt.id ? { ...o, priceAdded: e.target.value } : o) } : gr
                                )))}
                              />
                            </div>
                            <div className="form-group">
                              <label>Image</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setVariationGroups((current) => current.map((gr) => (
                                  gr.id === group.id ? { ...gr, options: gr.options.map(o => o.id === opt.id ? { ...o, image: e.target.files?.[0] ?? null } : o) } : gr
                                )))}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button
                                className="action-btn danger variation-remove"
                                type="button"
                                onClick={() => setVariationGroups((current) => current.map((gr) => (
                                  gr.id === group.id ? { ...gr, options: gr.options.length === 1 ? [createOptionDraft()] : gr.options.filter(o => o.id !== opt.id) } : gr
                                )))}
                              >
                                {oIndex === 0 && group.options.length === 1 ? 'Clear' : 'Remove'}
                              </button>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  className="action-btn"
                                  type="button"
                                  onClick={() => setVariationGroups((current) => current.map((gr) => {
                                    if (gr.id !== group.id) return gr;
                                    const idx = gr.options.findIndex(o => o.id === opt.id);
                                    if (idx <= 0) return gr;
                                    const newOpts = [...gr.options];
                                    [newOpts[idx - 1], newOpts[idx]] = [newOpts[idx], newOpts[idx - 1]];
                                    return { ...gr, options: newOpts };
                                  }))}
                                >↑</button>
                                <button
                                  className="action-btn"
                                  type="button"
                                  onClick={() => setVariationGroups((current) => current.map((gr) => {
                                    if (gr.id !== group.id) return gr;
                                    const idx = gr.options.findIndex(o => o.id === opt.id);
                                    if (idx === -1 || idx >= gr.options.length - 1) return gr;
                                    const newOpts = [...gr.options];
                                    [newOpts[idx + 1], newOpts[idx]] = [newOpts[idx], newOpts[idx + 1]];
                                    return { ...gr, options: newOpts };
                                  }))}
                                >↓</button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div style={{ marginTop: 8 }}>
                          <button
                            className="action-btn"
                            type="button"
                            onClick={() => setVariationGroups((current) => current.map((gr) => (
                              gr.id === group.id ? { ...gr, options: [...gr.options, createOptionDraft()] } : gr
                            )))}
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary">Save Product</button>
            </form>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td><img src={product.mainImage} alt={product.name} className="admin-thumb" /></td>
                      <td>{product.name}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.category?.name ?? 'Unassigned'}</td>
                        <td style={{ display: 'flex', gap: 8 }}>
                          <button className="action-btn" onClick={() => startEditProduct(product)} type="button">Edit</button>
                          <button className="action-btn danger" onClick={() => deleteProduct(product.id)} type="button">Delete</button>
                        </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5}>No products yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!isLoading && activeTab === 'categories' && (
          <>
            <form className="admin-form" onSubmit={handleCreateCategory}>
              <div className="form-row">
                <div className="form-group">
                  <label>Category Name</label>
                  <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Category Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setCategoryImage(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              <button type="submit" className="btn-primary">Save Category</button>
            </form>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.imageUrl ? <img src={category.imageUrl} alt={category.name} className="admin-thumb" /> : 'No image'}</td>
                      <td>{category.name}</td>
                      <td>{category._count?.products ?? 0}</td>
                      <td><button className="action-btn danger" onClick={() => deleteCategory(category.id)} type="button">Delete</button></td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan={4}>No categories yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!isLoading && activeTab === 'settings' && (
          <div className="admin-muted">
            Store settings are ready in the database schema, but there is no backend settings API yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
