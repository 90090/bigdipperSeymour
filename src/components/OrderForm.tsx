import { useState, type FormEvent } from 'react';

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const LAMBDA_URL        = 'https://YOUR_LAMBDA_URL.amazonaws.com/prod/send-order';
const BUSINESS_EMAIL    = 'orders@yourdomain.com'; // ← change to your business email

const MIN_HOURS_CUSTOM  = 72;  // cake / pie
const MIN_HOURS_ICE     = 2;   // ice cream / ufo (unused in date field but noted in footer)

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────
type ProductType = 'cake' | 'pie' | 'icecream' | 'ufo';

interface CakeItem {
  type: 'cake';
  cakeShape: string;
  customFlavors: string;
  trimColor: string;
  flowers: 'yes' | 'no';
  cookieCrumble: 'yes' | 'no';
  cakeText: string;
  dateNeeded: string;
  quantity: number;
}

interface PieItem {
  type: 'pie';
  crust: 'chocolate' | 'graham';
  pieFlavor: string;
  dateNeeded: string;
  quantity: number;
}

interface IceCreamItem {
  type: 'icecream';
  flavor: string;
  size: 'pint' | 'quart' | 'half_gallon' | 'two_half_gallon';
  quantity: number;
}

interface UfoItem {
  type: 'ufo';
  ufoFlavor: 'swirl' | 'chocolate' | 'vanilla';
  cookie: 'chocolate_wafer' | 'chocolate_chip';
  sprinkles: 'yes' | 'no';
  quantity: number;
}

type OrderItem = CakeItem | PieItem | IceCreamItem | UfoItem;

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const CAKE_SHAPES  = ['Round','Square','Log','Heart','Cross','Egg'];
const TRIM_COLORS  = ['Blue','White','Yellow','Pink','Lavender','Purple','Green'];

const ICE_SIZES: { value: IceCreamItem['size']; label: string }[] = [
  { value: 'pint',            label: 'Pint' },
  { value: 'quart',           label: 'Quart' },
  { value: 'half_gallon',     label: '½ Gallon' },
  { value: 'two_half_gallon', label: '2½ Gallon' },
];

const PRODUCT_META: Record<ProductType, { emoji: string; label: string; color: string; border: string; badge: string; hoverBorder: string }> = {
  cake:     { emoji: '', label: 'Ice Cream Cake', color: 'bg-rose-50',   border: 'border-rose-200',   badge: 'bg-rose-100 text-rose-700',    hoverBorder: 'hover:border-rose-400' },
  pie:      { emoji: '', label: 'Pie',  color: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  hoverBorder: 'hover:border-amber-400' },
  icecream: { emoji: '', label: 'Ice Cream',      color: 'bg-sky-50',    border: 'border-sky-200',    badge: 'bg-sky-100 text-sky-700',      hoverBorder: 'hover:border-sky-400' },
  ufo:      { emoji: '', label: 'UFO',            color: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', hoverBorder: 'hover:border-purple-400' },
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function minDate(hoursAhead: number): string {
  return new Date(Date.now() + hoursAhead * 3600000).toISOString().split('T')[0];
}

const newCake    = (): CakeItem      => ({ type:'cake',     cakeShape:'Round', customFlavors:'', trimColor:'Pink', flowers:'no', cookieCrumble:'no', cakeText:'', dateNeeded:'', quantity:1 });
const newPie     = (): PieItem       => ({ type:'pie',      crust:'graham', pieFlavor:'', dateNeeded:'', quantity:1 });
const newIce     = (): IceCreamItem  => ({ type:'icecream', flavor:'', size:'pint', quantity:1 });
const newUfo     = (): UfoItem       => ({ type:'ufo',      ufoFlavor:'swirl', cookie:'chocolate_wafer', sprinkles:'no', quantity:1 });

const factories: Record<ProductType, () => OrderItem> = { cake: newCake, pie: newPie, icecream: newIce, ufo: newUfo };

function buildSummary(items: OrderItem[]): string {
  return items.map((item, i) => {
    const n = i + 1;
    if (item.type === 'cake') return (
      `Item ${n} — Ice Cream Cake x${item.quantity}\n` +
      `  Shape: ${item.cakeShape}\n` +
      `  Flavors/Center: ${item.customFlavors || 'Standard (Chocolate & Vanilla / Cookie Crunch)'}\n` +
      `  Trim Color: ${item.trimColor}\n` +
      `  Flowers/Roses: ${item.flowers}\n` +
      `  Chocolate Cookie Crumble: ${item.cookieCrumble}\n` +
      `  Text on Cake: ${item.cakeText || '(none)'}\n` +
      `  Date Needed: ${item.dateNeeded}`
    );
    if (item.type === 'pie') return (
      `Item ${n} — Ice Cream Pie x${item.quantity}\n` +
      `  Crust: ${item.crust === 'graham' ? 'Graham Cracker' : 'Chocolate'}\n` +
      `  Flavor: ${item.pieFlavor}\n` +
      `  Date Needed: ${item.dateNeeded}`
    );
    if (item.type === 'icecream') {
      const sz = ICE_SIZES.find(s => s.value === item.size)?.label ?? item.size;
      return `Item ${n} — Ice Cream x${item.quantity}\n  Flavor: ${item.flavor}\n  Size: ${sz}`;
    }
    if (item.type === 'ufo') return (
      `Item ${n} — UFO x${item.quantity}\n` +
      `  Flavor: ${item.ufoFlavor}\n` +
      `  Cookie: ${item.cookie === 'chocolate_wafer' ? 'Chocolate Wafer' : 'Chocolate Chip Cookie'}\n` +
      `  Rainbow Sprinkles: ${item.sprinkles}`
    );
    return '';
  }).join('\n\n');
}

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
function YesNo({ value, onChange }: { value: 'yes'|'no'; onChange: (v:'yes'|'no') => void }) {
  return (
    <div className="flex gap-3">
      {(['yes','no'] as const).map(v => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-xl border-2 font-body font-bold text-sm transition-all ${
            value === v ? 'bg-strawberry border-strawberry text-white' : 'bg-white border-cream-200 text-chocolate hover:border-strawberry'
          }`}>
          {v === 'yes' ? '✓ Yes' : '✗ No'}
        </button>
      ))}
    </div>
  );
}

function QuantityInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="form-label">Quantity *</label>
      <div className="flex items-center gap-3 w-36">
        <button type="button" onClick={() => onChange(Math.max(1, value - 1))}
          className="w-10 h-10 rounded-xl bg-cream-100 border-2 border-cream-200 text-chocolate font-bold text-lg hover:bg-strawberry hover:text-white hover:border-strawberry transition-all">−</button>
        <span className="flex-1 text-center font-display font-bold text-chocolate text-xl">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(99, value + 1))}
          className="w-10 h-10 rounded-xl bg-cream-100 border-2 border-cream-200 text-chocolate font-bold text-lg hover:bg-strawberry hover:text-white hover:border-strawberry transition-all">+</button>
      </div>
    </div>
  );
}

// ── Cake ────────────────────────────────────────────────────
function CakeCard({ item, onChange }: { item: CakeItem; onChange: (p: Partial<CakeItem>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="form-label">Cake Shape *</label>
        <div className="flex flex-wrap gap-2">
          {CAKE_SHAPES.map(s => (
            <button key={s} type="button" onClick={() => onChange({ cakeShape: s })}
              className={`px-4 py-2 rounded-xl border-2 font-body text-sm font-bold transition-all ${
                item.cakeShape === s ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-cream-200 text-chocolate hover:border-rose-300'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white/60 border border-rose-200 rounded-2xl p-4">
        <p className="font-body text-sm text-chocolate/70 mb-3">
          <strong>Standard filling:</strong> Chocolate &amp; Vanilla Ice Cream with a Cookie Crunch Center.
        </p>
        <label className="form-label">Custom Flavors &amp; Center <span className="normal-case font-normal text-chocolate/40">(optional)</span></label>
        <input type="text" value={item.customFlavors} onChange={e => onChange({ customFlavors: e.target.value })}
          className="form-input" placeholder="e.g. Strawberry & Mint Chip with Brownie Center" maxLength={150} />
      </div>

      <div>
        <label className="form-label">Trim Color *</label>
        <div className="flex flex-wrap gap-2">
          {TRIM_COLORS.map(c => (
            <button key={c} type="button" onClick={() => onChange({ trimColor: c })}
              className={`px-4 py-1.5 rounded-xl border-2 font-body text-sm font-bold transition-all ${
                item.trimColor === c ? 'bg-strawberry border-strawberry text-white' : 'bg-white border-cream-200 text-chocolate hover:border-strawberry'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Flowers / Roses?</label>
          <YesNo value={item.flowers} onChange={v => onChange({ flowers: v })} />
        </div>
        <div>
          <label className="form-label">Chocolate Cookie Crumble?</label>
          <YesNo value={item.cookieCrumble} onChange={v => onChange({ cookieCrumble: v })} />
        </div>
      </div>

      <div>
        <label className="form-label">
          Text on Cake <span className="normal-case font-normal text-chocolate/40">(max 75 characters)</span>
        </label>
        <input type="text" value={item.cakeText} onChange={e => onChange({ cakeText: e.target.value })}
          className="form-input" placeholder="Happy Birthday Sarah!" maxLength={75} />
        <p className="text-xs text-chocolate/40 mt-1 font-body">{item.cakeText.length} / 75</p>
      </div>

      <div>
        <label className="form-label">Date Needed * <span className="normal-case font-normal text-chocolate/40">(minimum 72 hours from today)</span></label>
        <input type="date" required value={item.dateNeeded} min={minDate(MIN_HOURS_CUSTOM)}
          onChange={e => onChange({ dateNeeded: e.target.value })} className="form-input" />
      </div>

      <QuantityInput value={item.quantity} onChange={v => onChange({ quantity: v })} />
    </div>
  );
}

// ── Pie ────────────────────────────────────────────────────
function PieCard({ item, onChange }: { item: PieItem; onChange: (p: Partial<PieItem>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="form-label">Crust Type *</label>
        <div className="flex gap-3">
          {([{value:'graham',label:'Graham Cracker Crust'},{value:'chocolate',label:'Chocolate Crust'}] as const).map(opt => (
            <button key={opt.value} type="button" onClick={() => onChange({ crust: opt.value })}
              className={`flex-1 py-2.5 rounded-xl border-2 font-body text-sm font-bold transition-all ${
                item.crust === opt.value ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-cream-200 text-chocolate hover:border-amber-400'
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Pie Flavor *</label>
        <input type="text" required value={item.pieFlavor} onChange={e => onChange({ pieFlavor: e.target.value })}
          className="form-input" placeholder="e.g. Strawberry, Mint Chip, Cookies & Cream…" />
      </div>

      <div>
        <label className="form-label">Date Needed * <span className="normal-case font-normal text-chocolate/40">(minimum 72 hours from today)</span></label>
        <input type="date" required value={item.dateNeeded} min={minDate(MIN_HOURS_CUSTOM)}
          onChange={e => onChange({ dateNeeded: e.target.value })} className="form-input" />
      </div>

      <QuantityInput value={item.quantity} onChange={v => onChange({ quantity: v })} />
    </div>
  );
}

// ── Ice Cream ──────────────────────────────────────────────
function IceCreamCard({ item, onChange }: { item: IceCreamItem; onChange: (p: Partial<IceCreamItem>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="form-label">Ice Cream Flavor *</label>
        <input type="text" required value={item.flavor} onChange={e => onChange({ flavor: e.target.value })}
          className="form-input" placeholder="e.g. Honey Lavender, Mint Chip, Vanilla Bean…" />
      </div>

      <div>
        <label className="form-label">Size *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ICE_SIZES.map(s => (
            <button key={s.value} type="button" onClick={() => onChange({ size: s.value })}
              className={`py-2.5 rounded-xl border-2 font-body text-sm font-bold transition-all ${
                item.size === s.value ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white border-cream-200 text-chocolate hover:border-sky-400'
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      <QuantityInput value={item.quantity} onChange={v => onChange({ quantity: v })} />
    </div>
  );
}

// ── UFO ────────────────────────────────────────────────────
function UfoCard({ item, onChange }: { item: UfoItem; onChange: (p: Partial<UfoItem>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="form-label">UFO Flavor *</label>
        <div className="flex gap-2">
          {([
            { value:'swirl',     label:'Swirl' },
            { value:'chocolate', label:'Chocolate' },
            { value:'vanilla',   label:'Vanilla' },
          ] as const).map(opt => (
            <button key={opt.value} type="button" onClick={() => onChange({ ufoFlavor: opt.value })}
              className={`flex-1 py-2.5 rounded-xl border-2 font-body text-sm font-bold transition-all ${
                item.ufoFlavor === opt.value ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white border-cream-200 text-chocolate hover:border-purple-400'
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Cookie *</label>
        <div className="flex gap-3">
          {([
            { value:'chocolate_wafer', label:'Chocolate Wafer' },
            { value:'chocolate_chip',  label:'Chocolate Chip Cookie' },
          ] as const).map(opt => (
            <button key={opt.value} type="button" onClick={() => onChange({ cookie: opt.value })}
              className={`flex-1 py-2.5 rounded-xl border-2 font-body text-sm font-bold transition-all ${
                item.cookie === opt.value ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white border-cream-200 text-chocolate hover:border-purple-400'
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Rainbow Sprinkles?</label>
        <YesNo value={item.sprinkles} onChange={v => onChange({ sprinkles: v })} />
      </div>

      <QuantityInput value={item.quantity} onChange={v => onChange({ quantity: v })} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function OrderForm() {
  const [contact, setContact] = useState<ContactInfo>({ firstName:'', lastName:'', email:'', phone:'' });
  const [items,   setItems]   = useState<OrderItem[]>([]);
  const [notes,   setNotes]   = useState('');
  const [status,  setStatus]  = useState<'idle'|'submitting'|'success'|'error'>('idle');
  const [errMsg,  setErrMsg]  = useState('');

  const addItem    = (t: ProductType) => setItems(p => [...p, factories[t]()]);
  const removeItem = (i: number)      => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<OrderItem>) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, ...patch } as OrderItem : item));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setErrMsg('Please add at least one item to your order.'); setStatus('error'); return; }
    setStatus('submitting');
    setErrMsg('');

    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'retail',
          contact: { ...contact, fullName: `${contact.firstName} ${contact.lastName}` },
          items,
          notes,
          summary: buildSummary(items),
          businessEmail: BUSINESS_EMAIL,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong. Please call us directly.');
    }
  };

  // ── Success ────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="text-center py-20 px-4 max-w-lg mx-auto">
        <div className="text-7xl mb-6">🎉</div>
        <h2 className="font-display text-4xl font-bold text-chocolate mb-3">Order Received!</h2>
        <p className="font-body text-chocolate/70 text-base leading-relaxed mb-2">
          A confirmation has been sent to <strong>{contact.email}</strong>.
        </p>
        <p className="font-body text-chocolate/60 text-sm mb-8">
          Payment is collected in store — no card needed today. We'll see you soon!
        </p>
        <button
          onClick={() => { setStatus('idle'); setContact({ firstName:'', lastName:'', email:'', phone:'' }); setItems([]); setNotes(''); }}
          className="btn-primary"
        >Place Another Order</button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">

      {/* 1. Contact */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-cream-200">
        <h2 className="font-display font-bold text-chocolate text-2xl mb-6 flex items-center gap-2">
          Your Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="form-label">First Name *</label>
            <input type="text" required value={contact.firstName}
              onChange={e => setContact(c => ({ ...c, firstName: e.target.value }))}
              className="form-input" placeholder="Jane" />
          </div>
          <div>
            <label className="form-label">Last Name *</label>
            <input type="text" required value={contact.lastName}
              onChange={e => setContact(c => ({ ...c, lastName: e.target.value }))}
              className="form-input" placeholder="Smith" />
          </div>
          <div>
            <label className="form-label">Email Address *</label>
            <input type="email" required value={contact.email}
              onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
              className="form-input" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="form-label">Phone Number *</label>
            <input type="tel" required value={contact.phone}
              onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
              className="form-input" placeholder="(555) 000-0000" />
          </div>
        </div>
      </div>

      {/* 2. Order items */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-cream-200">
        <h2 className="font-display font-bold text-chocolate text-2xl mb-1 flex items-center gap-2">
          Your Order
        </h2>
        <p className="font-body text-chocolate/55 text-sm mb-6">
          Add as many items as you like — any mix of cakes, pies, ice cream, and UFOs.
        </p>

        {/* Product picker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {(Object.entries(PRODUCT_META) as [ProductType, typeof PRODUCT_META[ProductType]][]).map(([key, meta]) => (
            <button key={key} type="button" onClick={() => addItem(key)}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 border-dashed ${meta.border} ${meta.color} ${meta.hoverBorder} hover:scale-105 transition-all duration-200 font-body font-bold text-sm text-chocolate`}>
              <span className="text-3xl">{meta.emoji}</span>
              <span>+ {meta.label}</span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-10 text-chocolate/30 font-body border-2 border-dashed border-cream-200 rounded-2xl">
            <p className="text-sm">Select a product above to start building your order</p>
          </div>
        )}

        {/* Item cards */}
        <div className="space-y-5">
          {items.map((item, i) => {
            const meta = PRODUCT_META[item.type];
            return (
              <div key={i} className={`rounded-2xl border-2 ${meta.border} overflow-hidden`}>
                <div className={`flex items-center justify-between px-5 py-3 ${meta.color} border-b ${meta.border}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <span className={`font-body font-bold text-xs px-3 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                    <span className="font-body text-xs text-chocolate/40">— Item {i + 1}</span>
                  </div>
                  <button type="button" onClick={() => removeItem(i)}
                    className="text-xs font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors">
                    ✕ Remove
                  </button>
                </div>
                <div className="p-5 bg-white">
                  {item.type === 'cake'     && <CakeCard     item={item} onChange={p => updateItem(i, p)} />}
                  {item.type === 'pie'      && <PieCard      item={item} onChange={p => updateItem(i, p)} />}
                  {item.type === 'icecream' && <IceCreamCard item={item} onChange={p => updateItem(i, p)} />}
                  {item.type === 'ufo'      && <UfoCard      item={item} onChange={p => updateItem(i, p)} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add more prompt (after at least 1 item) */}
        {items.length > 0 && (
          <p className="text-center text-xs text-chocolate/40 font-body mt-5">
            Need more? Use the buttons above to add another item to your order.
          </p>
        )}
      </div>

      {/* 3. Notes */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-cream-200">
        <h2 className="font-display font-bold text-chocolate text-2xl mb-4 flex items-center gap-2">
          Additional Notes
        </h2>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          className="form-input resize-none"
          placeholder="Allergies, special requests, or anything else we should know…" />
      </div>

      {/* Payment note */}
      <div className="bg-cream-100 border border-cream-300 rounded-2xl px-6 py-4 flex items-start gap-3">
        <p className="font-body text-chocolate/80 text-sm leading-relaxed">
          <strong>Payment in store.</strong> No payment is required now. We'll confirm your order and collect payment when you pick up.
        </p>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-700 font-body text-sm">
          ⚠️ {errMsg || 'Something went wrong. Please call us at (555) 123-4567.'}
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={status === 'submitting'}
        className="btn-primary w-full justify-center text-lg py-4 disabled:opacity-60 disabled:cursor-not-allowed">
        {status === 'submitting'
          ? <><span className="animate-spin inline-block">🍦</span> Placing Order…</>
          : <>Place Order</>}
      </button>

      <p className="text-center text-xs text-chocolate/50 font-body pb-4">
        A confirmation email will be sent to you immediately. Cakes &amp; Pies require 72 hours notice. Ice Cream &amp; UFOs require 2 hours.
      </p>
    </form>
  );
}