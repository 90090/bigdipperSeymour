import { useState, type FormEvent } from 'react';

const LAMBDA_URL = 'https://vpi0fo77oh.execute-api.us-east-1.amazonaws.com/form'; // ← paste terraform output here

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', ...form }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-4xl font-bold text-chocolate mb-4">Message Sent!</h2>
        <p className="font-body text-chocolate/70 text-lg max-w-sm mx-auto mb-8">
          Thanks, {form.name}! We'll get back to you within one business day.
        </p>
        <button
          onClick={() => { setStatus('idle'); setForm({ name:'', email:'', subject:'', message:'' }); }}
          className="btn-primary"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="form-label">Your Name *</label>
          <input type="text" required value={form.name}
            onChange={e => setForm(f => ({...f, name: e.target.value}))}
            className="form-input" placeholder="Jane Smith" />
        </div>
        <div>
          <label className="form-label">Email Address *</label>
          <input type="email" required value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))}
            className="form-input" placeholder="jane@example.com" />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Subject *</label>
          <select required value={form.subject}
            onChange={e => setForm(f => ({...f, subject: e.target.value}))}
            className="form-input">
            <option value="">Choose a subject...</option>
            <option>General Inquiry</option>
            <option>Order Question</option>
            <option>Wholesale Inquiry</option>
            <option>Event / Catering</option>
            <option>Feedback</option>
            <option>Other</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Message *</label>
          <textarea required value={form.message}
            onChange={e => setForm(f => ({...f, message: e.target.value}))}
            rows={6} className="form-input resize-none"
            placeholder="How can we help you?" />
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}

      <button type="submit" disabled={status === 'submitting'}
        className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
