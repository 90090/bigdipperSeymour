import { useState, type FormEvent } from 'react';

// ─── Config ───────────────────────────────────────────────
// Update these URLs to your actual DreamHost and Lambda endpoints
const PHP_AUTH_URL = 'https://yourdomain.com/wholesale-auth.php';
const LAMBDA_URL   = 'https://YOUR_LAMBDA_URL.amazonaws.com/prod/send-order';

// ─── Types ───────────────────────────────────────────────
interface WholesalerInfo {
  name: string;
  accountNumber: string;
  tier: string;            // e.g. "standard" | "premium" | "distributor"
  pricingLevel: string;
}

interface WholesaleItem {
  flavor: string;
  size: string;
  quantity: number;
}

interface WholesaleForm {
  contactName: string;
  contactEmail: string;
  poNumber: string;
  deliveryDate: string;
  deliveryAddress: string;
  notes: string;
  items: WholesaleItem[];
}

// ─── Constants ───────────────────────────────────────────
const FLAVORS = [
  'Strawberry Fields', 'Midnight Chocolate', 'Mint Chip Madness',
  'Honey Lavender', 'Wild Blueberry', 'Peach Cobbler',
  'Matcha Dream', 'Birthday Cake', 'Vanilla Bean', 'Salted Caramel',
  'Lemon Sorbet', 'Mango Tango', 'Cookies & Cream', 'Pistachio Dream',
  'Butter Pecan', 'Seasonal Special',
];

const WHOLESALE_SIZES = [
  { label: '1 Gallon Tub', value: '1gal' },
  { label: '2.5 Gallon Tub', value: '2.5gal' },
  { label: '5 Gallon Tub', value: '5gal' },
  { label: '3oz Pre-Portioned Cups (case of 48)', value: 'cups_48' },
  { label: '6oz Pre-Portioned Cups (case of 24)', value: 'cups_24' },
];

const newItem = (): WholesaleItem => ({
  flavor: FLAVORS[0],
  size: '1gal',
  quantity: 1,
});

// ─── Auth Screen ─────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (info: WholesalerInfo) => void }) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('checking');

    try {
      const res = await fetch(PHP_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success && data.wholesaler) {
        onAuth(data.wholesaler);
      } else {
        setStatus('error');
        setPassword('');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-white rounded-3xl p-10 shadow-lg border border-cream-200">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="font-display text-3xl font-bold text-chocolate mb-2">Wholesale Portal</h2>
        <p className="font-body text-chocolate/60 text-sm mb-8 leading-relaxed">
          This area is for authorized wholesale partners only. Enter your account password to continue.
        </p>

        <form onSubmit={handleAuth} className="space-y-5 text-left">
          <div>
            <label className="form-label">Account Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => { setPassword(e.target.value); setStatus('idle'); }}
                className="form-input pr-12"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-chocolate/40 hover:text-chocolate/80 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm font-body">
              ⚠️ Incorrect password. Please try again or contact us at wholesale@scoopsandsmiles.com
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'checking' || !password}
            className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'checking' ? (
              <><span className="animate-spin inline-block">⏳</span> Verifying...</>
            ) : (
              '🔓 Access Portal'
            )}
          </button>
        </form>

        <p className="text-xs text-chocolate/40 mt-8 font-body">
          Not a wholesale partner?{' '}
          <a href="/contact" className="text-strawberry hover:underline">Contact us</a>{' '}
          to learn about becoming one.
        </p>
      </div>
    </div>
  );
}

// ─── Order Form ───────────────────────────────────────────
function WholesaleOrderForm({ wholesaler }: { wholesaler: WholesalerInfo }) {
  const [form, setForm] = useState<WholesaleForm>({
    contactName: '',
    contactEmail: '',
    poNumber: '',
    deliveryDate: '',
    deliveryAddress: '',
    notes: '',
    items: [newItem()],
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, newItem()] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: keyof WholesaleItem, value: string | number) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: value };
      return { ...f, items };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wholesale',
          wholesaler,
          ...form,
        }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-7xl mb-6">✅</div>
        <h2 className="font-display text-4xl font-bold text-chocolate mb-4">Order Submitted!</h2>
        <p className="font-body text-chocolate/70 text-lg max-w-md mx-auto mb-8">
          Your wholesale order has been received. A confirmation was sent to <strong>{form.contactEmail}</strong>. We'll be in touch within one business day.
        </p>
        <button
          onClick={() => { setStatus('idle'); setForm({ contactName:'', contactEmail:'', poNumber:'', deliveryDate:'', deliveryAddress:'', notes:'', items:[newItem()] }); }}
          className="btn-primary"
        >
          Submit Another Order
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Wholesaler Badge */}
      <div className="bg-chocolate text-white rounded-2xl p-5 flex items-center gap-4">
        <div className="text-3xl">🏢</div>
        <div>
          <div className="font-display font-bold text-lg">{wholesaler.name}</div>
          <div className="text-cream-200 text-sm">Account #{wholesaler.accountNumber} · {wholesaler.tier} Partner · {wholesaler.pricingLevel} Pricing</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Contact Info */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-cream-200">
          <h2 className="font-display font-bold text-chocolate text-2xl mb-6 flex items-center gap-2">
            <span>👤</span> Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Contact Name *</label>
              <input type="text" required value={form.contactName}
                onChange={e => setForm(f => ({...f, contactName: e.target.value}))}
                className="form-input" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="form-label">Contact Email *</label>
              <input type="email" required value={form.contactEmail}
                onChange={e => setForm(f => ({...f, contactEmail: e.target.value}))}
                className="form-input" placeholder="jane@business.com" />
            </div>
            <div>
              <label className="form-label">PO Number</label>
              <input type="text" value={form.poNumber}
                onChange={e => setForm(f => ({...f, poNumber: e.target.value}))}
                className="form-input" placeholder="Optional" />
            </div>
            <div>
              <label className="form-label">Requested Delivery Date *</label>
              <input type="date" required value={form.deliveryDate}
                min={new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]}
                onChange={e => setForm(f => ({...f, deliveryDate: e.target.value}))}
                className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Delivery Address *</label>
              <textarea required value={form.deliveryAddress}
                onChange={e => setForm(f => ({...f, deliveryAddress: e.target.value}))}
                rows={2} className="form-input resize-none"
                placeholder="Full delivery address..." />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-cream-200">
          <h2 className="font-display font-bold text-chocolate text-2xl mb-6 flex items-center gap-2">
            <span>🍦</span> Order Items
          </h2>

          <div className="space-y-5">
            {form.items.map((item, i) => (
              <div key={i} className="bg-cream-50 rounded-2xl p-5 border border-cream-200 relative">
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="absolute top-3 right-3 text-rose-400 hover:text-rose-600 text-sm font-bold px-2 py-0.5 rounded-lg hover:bg-rose-50 transition-colors">
                    ✕
                  </button>
                )}
                <div className="text-xs font-bold uppercase tracking-widest text-strawberry mb-3">Item {i + 1}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="form-label">Flavor *</label>
                    <select required value={item.flavor} onChange={e => updateItem(i, 'flavor', e.target.value)} className="form-input">
                      {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Size *</label>
                    <select required value={item.size} onChange={e => updateItem(i, 'size', e.target.value)} className="form-input">
                      {WHOLESALE_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Quantity *</label>
                    <input type="number" min="1" max="500" required value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                      className="form-input" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem}
            className="mt-5 flex items-center gap-2 text-strawberry font-display font-semibold text-sm hover:text-rose-600 transition-colors">
            <span className="w-6 h-6 bg-strawberry/10 rounded-full flex items-center justify-center">+</span>
            Add Item
          </button>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-cream-200">
          <h2 className="font-display font-bold text-chocolate text-2xl mb-6">📝 Order Notes</h2>
          <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
            rows={3} className="form-input resize-none"
            placeholder="Special handling, delivery instructions, etc." />
        </div>

        {status === 'error' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-700 text-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        <button type="submit" disabled={status === 'submitting'}
          className="btn-primary w-full justify-center text-lg py-4 disabled:opacity-60 disabled:cursor-not-allowed">
          {status === 'submitting' ? '⏳ Submitting...' : '📦 Submit Wholesale Order'}
        </button>

        <p className="text-center text-xs text-chocolate/50 font-body">
          Confirmation sent to your email. Minimum 3-day lead time on all wholesale orders.
        </p>
      </form>
    </div>
  );
}

// ─── Main Wholesale Component ─────────────────────────────
export default function WholesalePortal() {
  const [wholesaler, setWholesaler] = useState<WholesalerInfo | null>(null);

  return wholesaler
    ? <WholesaleOrderForm wholesaler={wholesaler} />
    : <AuthScreen onAuth={setWholesaler} />;
}
