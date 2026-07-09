import React, { useState, useEffect, useMemo } from 'react';
import { useCart, type CartItem } from '../context/CartContext';
import { api, formatCurrency, type Product, type ProductVariation } from '../lib/api';

interface CheckoutItemProps {
  item: CartItem;
}

const CheckoutItem: React.FC<CheckoutItemProps> = ({ item }) => {
  const { updateQuantity, updateItemVariation } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductVariation | null>>({});

  useEffect(() => {
    let isMounted = true;
    api.getProduct(item.productId).then(data => {
      if (isMounted) setProduct(data);
    }).catch(console.error);
    return () => { isMounted = false; };
  }, [item.productId]);

  useEffect(() => {
    if (!product) return;
    const initialOpts: Record<string, ProductVariation | null> = {};
    if (item.variationName) {
      const parts = item.variationName.split(', ');
      parts.forEach(part => {
        const [n, v] = part.split(': ');
        if (n && v) {
          const opt = product.variations.find(va => va.name === n && va.value === v);
          if (opt) initialOpts[n] = opt;
        }
      });
    } else if (item.variationId) {
      const opt = product.variations.find(v => v.id === item.variationId);
      if (opt) initialOpts[opt.name] = opt;
    }
    
    const groups = [...new Set((product.variations ?? []).map(v => v.name))];
    groups.forEach(g => {
      if (initialOpts[g] === undefined) initialOpts[g] = null;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedOptions(initialOpts);
  }, [product, item.variationName, item.variationId]);

  const variationGroups = useMemo(() => {
    if (!product) return [] as Array<{ name: string; options: ProductVariation[] }>;
    const groups: Record<string, ProductVariation[]> = {};
    (product.variations ?? []).forEach((v) => {
      groups[v.name] = groups[v.name] ?? [];
      groups[v.name].push(v);
    });
    return Object.keys(groups).map((name) => ({ name, options: groups[name] }));
  }, [product]);

  const handleOptionChange = (groupName: string, optionId: string) => {
    if (!product) return;
    const opt = product.variations.find(v => v.id === optionId);
    if (!opt) return;

    const newOptions = { ...selectedOptions, [groupName]: opt };
    setSelectedOptions(newOptions);

    const primaryOpt = Object.values(newOptions).find(Boolean) ?? null;
    const newVariationId = primaryOpt?.id;
    const newVariationName = Object.values(newOptions)
      .filter(Boolean)
      .map((o) => `${o!.name}: ${o!.value}`)
      .join(', ');
    
    const newPrice = product.price + Object.values(newOptions).reduce((sum, o) => sum + (o?.priceAdded ?? 0), 0);
    const newImage = primaryOpt?.imageUrl ?? product.mainImage;
    
    const newCartName = `${product.name}${Object.values(newOptions).filter(Boolean).map((o) => ` - ${o!.name}: ${o!.value}`).join('')}`;

    if (newVariationId !== item.variationId || newVariationName !== item.variationName) {
      updateItemVariation(item.productId, item.variationId, newVariationId, newVariationName, newPrice, newImage, newCartName);
    }
  };

  return (
    <div className="summary-item">
      <img src={item.image} alt={item.name} className="summary-img" />
      <div className="summary-details">
        <h4 className="summary-item-name">{item.name?.split(' - ')[0] || item.name}</h4>
        
        {variationGroups.length > 0 ? (
          <div className="checkout-item-variations">
            {variationGroups.map(group => (
              <div key={group.name} className="checkout-variation-group">
                <span className="checkout-variation-label">{group.name}:</span>
                <select 
                  value={selectedOptions[group.name]?.id || ''} 
                  onChange={(e) => handleOptionChange(group.name, e.target.value)}
                  className="checkout-variation-select"
                >
                  <option value="" disabled>Select {group.name}</option>
                  {group.options.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.value} {opt.priceAdded > 0 ? `(+${formatCurrency(opt.priceAdded)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          item.variationName && <p className="summary-item-var">{item.variationName}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            style={{ padding: '6px 10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variationId)}
          >
            −
          </button>
          <input
            aria-label="Quantity"
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => {
              const v = Number(e.target.value || 0);
              if (Number.isNaN(v)) return;
              updateQuantity(item.productId, Math.max(0, Math.trunc(v)), item.variationId);
            }}
            style={{ width: 60, padding: '6px 8px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '4px' }}
          />
          <button
            type="button"
            style={{ padding: '6px 10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variationId)}
          >
            +
          </button>
        </div>
      </div>
      <div className="summary-item-price">
        {formatCurrency(item.price * item.quantity)}
      </div>
    </div>
  );
};

export default CheckoutItem;
