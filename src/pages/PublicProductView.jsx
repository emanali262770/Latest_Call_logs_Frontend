import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import axios from 'axios';
import { Package, MapPin, Tag, Layers, Factory, Ruler, ShieldCheck, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');

export default function PublicProductView() {
  const { barcode } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!barcode) {
      setError('No barcode provided.');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE}/item-definitions/barcode/${barcode}`);
        const d = res.data?.data || res.data;
        if (!d || !d.item_name) {
          setError('Product not found.');
        } else {
          setProduct({
            itemName: d.item_name,
            code: d.item_code,
            category: d.category_name,
            location: d.location_name,
            salePrice: d.sale_price,
            primaryBarcode: d.primary_barcode,
            secondaryBarcode: d.secondary_barcode,
            manufacturer: d.manufacturer_name,
            unit: d.unit_name,
            image: d.image,
            status: d.status,
          });
        }
      } catch {
        setError('Product not found or server error.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [barcode]);

  if (loading) {
    return (
      <PageShell>
        <div className="ppv-loading">
          <div className="ppv-spinner" />
          <p>Loading product details...</p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="ppv-card">
          <div className="ppv-error">
            <div className="ppv-error__icon">
              <AlertTriangle size={40} strokeWidth={1.5} />
            </div>
            <h2>Product Not Found</h2>
            <p>{error}</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const barcodeValue = String(product.primaryBarcode || product.secondaryBarcode || '').trim();
  const imageUrl = product.image ? `${SERVER_BASE}${product.image}` : null;
  const isActive = product.status === 'active';

  return (
    <PageShell>
      <div className="ppv-card">
        {/* Header */}
        <div className="ppv-header">
          <div className="ppv-header__icon">
            <Package size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="ppv-header__title">Product Details</h1>
            <p className="ppv-header__sub">Verified stock information</p>
          </div>
        </div>

        {/* Image */}
        {imageUrl && (
          <div className="ppv-image">
            <img src={imageUrl} alt={product.itemName} />
          </div>
        )}

        {/* Product Name & Status */}
        <div className="ppv-name-section">
          <h2 className="ppv-name">{product.itemName}</h2>
          <span className={`ppv-badge ${isActive ? 'ppv-badge--active' : 'ppv-badge--inactive'}`}>
            {isActive ? 'In Stock' : 'Unavailable'}
          </span>
        </div>

        {/* Price */}
        <div className="ppv-price-card">
          <span className="ppv-price-card__label">Price</span>
          <span className="ppv-price-card__value">
            {product.salePrice ? `Rs ${Number(product.salePrice).toLocaleString()}` : 'Contact for price'}
          </span>
        </div>

        {/* Details Grid */}
        <div className="ppv-details">
          <DetailItem icon={<Tag size={15} />} label="Item Code" value={product.code} />
          <DetailItem icon={<Layers size={15} />} label="Category" value={product.category} />
          <DetailItem icon={<Factory size={15} />} label="Manufacturer" value={product.manufacturer} />
         
          <DetailItem icon={<MapPin size={15} />} label="Location" value={product.location} />
        </div>

        {/* Barcode */}
        {barcodeValue ? (
          <div className="ppv-barcode">
            <Barcode value={barcodeValue} width={1.8} height={50} fontSize={12} margin={0} background="transparent" lineColor="#1e1b4b" />
          </div>
        ) : null}

        {/* Footer */}
        <div className="ppv-footer">
          <ShieldCheck size={13} />
          <span>Verified product from inventory system</span>
        </div>
      </div>

      <style>{cssStyles}</style>
    </PageShell>
  );
}

function PageShell({ children }) {
  return <div className="ppv-shell">{children}</div>;
}

function DetailItem({ icon, label, value }) {
  const display = String(value ?? '').trim() || '—';
  return (
    <div className="ppv-detail">
      <div className="ppv-detail__icon">{icon}</div>
      <div className="ppv-detail__content">
        <span className="ppv-detail__label">{label}</span>
        <span className="ppv-detail__value">{display}</span>
      </div>
    </div>
  );
}

const cssStyles = `
  .ppv-shell {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 24px 16px 40px;
    background: #f1f5f9;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .ppv-card {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
    overflow: hidden;
  }

  /* Header */
  .ppv-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    background: #4f46e5;
    color: #ffffff;
  }
  .ppv-header__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .ppv-header__title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .ppv-header__sub {
    margin: 2px 0 0;
    font-size: 12px;
    opacity: 0.75;
    letter-spacing: 0.02em;
  }

  /* Image */
  .ppv-image {
    padding: 20px 24px 0;
    text-align: center;
  }
  .ppv-image img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
  }

  /* Name & Badge */
  .ppv-name-section {
    padding: 16px 24px 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .ppv-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }
  .ppv-badge {
    flex-shrink: 0;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .ppv-badge--active {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  .ppv-badge--inactive {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  /* Price */
  .ppv-price-card {
    margin: 16px 24px 0;
    padding: 14px 16px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ppv-price-card__label {
    font-size: 13px;
    font-weight: 600;
    color: #4338ca;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .ppv-price-card__value {
    font-size: 22px;
    font-weight: 800;
    color: #312e81;
    letter-spacing: -0.02em;
  }

  /* Details */
  .ppv-details {
    padding: 20px 24px 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .ppv-detail {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .ppv-detail:last-child {
    border-bottom: none;
  }
  .ppv-detail__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f46e5;
    flex-shrink: 0;
  }
  .ppv-detail__content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .ppv-detail__label {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
  }
  .ppv-detail__value {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    text-align: right;
    word-break: break-word;
  }

  /* Barcode */
  .ppv-barcode {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
    
    padding: 16px 0;
    text-align: center;
    border-top: 1px dashed #e2e8f0;
  }
  .ppv-barcode svg {
    max-width: 100%;
    height: auto;
  }

  /* Footer */
  .ppv-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 16px 24px;
    margin-top: 8px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
    letter-spacing: 0.02em;
  }

  /* Loading */
  .ppv-loading {
    width: 100%;
    max-width: 440px;
    padding: 60px 24px;
    text-align: center;
    color: #64748b;
    font-family: 'Inter', sans-serif;
  }
  .ppv-loading p {
    margin: 16px 0 0;
    font-size: 14px;
  }
  .ppv-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #4f46e5;
    border-radius: 50%;
    margin: 0 auto;
    animation: ppv-spin 0.7s linear infinite;
  }
  @keyframes ppv-spin {
    to { transform: rotate(360deg); }
  }

  /* Error */
  .ppv-error {
    padding: 48px 24px;
    text-align: center;
  }
  .ppv-error__icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #fef2f2;
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  .ppv-error h2 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }
  .ppv-error p {
    margin: 0;
    font-size: 14px;
    color: #64748b;
  }

  /* Mobile responsive */
  @media (max-width: 480px) {
    .ppv-shell { padding: 0; }
    .ppv-card { border-radius: 0; border: none; box-shadow: none; min-height: 100vh; }
    .ppv-name { font-size: 18px; }
    .ppv-price-card__value { font-size: 20px; }
  }
`;
