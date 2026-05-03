import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

export type LegalDialogKind = 'privacy' | 'terms' | 'contact';

interface InfoDialogProps {
  kind: LegalDialogKind;
  onClose: () => void;
}

const copy: Record<
  Exclude<LegalDialogKind, 'contact'>,
  { title: string; subtitle?: string; body: React.ReactNode }
> = {
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Last updated for pre-release Bite Sense',
    body: (
      <>
        <p>
          Bite Sense collects account information (such as email and name), health-related preferences you choose to save
          (goals, restrictions, allergens), and menu content you upload or scan so we can generate recommendations.
        </p>
        <p>
          We use this data only to operate the product, improve accuracy, and secure your account. We do not sell your
          personal health information. We may use trusted processors (for example hosting, email, or analytics) under
          contracts that limit how they use your data.
        </p>
        <p>
          You can request access, correction, or deletion of your account data by contacting us. We may update this
          policy as the service matures; we will notify you of material changes where required.
        </p>
      </>
    ),
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Summary for early access',
    body: (
      <>
        <p>
          Bite Sense provides informational suggestions about restaurant menu items based on the data you provide and
          automated analysis. It is not medical advice, diagnosis, or treatment. Always follow guidance from a qualified
          clinician for conditions that require a therapeutic diet.
        </p>
        <p>
          You are responsible for the accuracy of information you enter and for verifying allergens or ingredients with
          the restaurant. We do not guarantee that menus, nutrition estimates, or scores are complete or error-free.
        </p>
        <p>
          You agree not to misuse the service (for example by attempting to disrupt systems or scrape data at scale).
          We may suspend or terminate access for violations or for operational reasons, subject to applicable law.
        </p>
      </>
    ),
  },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

function ContactFormDialog({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setFormError('Please enter a message.');
      return;
    }
    setSent(true);
    window.setTimeout(() => onClose(), 1800);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11, 15, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-dialog-title"
          style={{
            background: 'var(--surface)',
            padding: '2.25rem 2.5rem',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '560px',
            maxHeight: 'min(90vh, 720px)',
            border: '1px solid var(--border)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-elevated)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--text-secondary)' }}
          >
            <X size={24} />
          </button>

          {sent ? (
            <div style={{ padding: '2rem 0', textAlign: 'center' }}>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-primary)', margin: 0 }}>
                Thanks — we received your message and will get back to you soon.
              </p>
            </div>
          ) : (
            <>
              <h2
                id="contact-dialog-title"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  margin: '0 2.5rem 1.5rem 0',
                  textAlign: 'left',
                  letterSpacing: '-0.02em',
                }}
              >
                Get In Touch
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {formError && (
                  <p role="alert" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--accent-danger)' }}>
                    {formError}
                  </p>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <label htmlFor="contact-full-name" style={labelStyle}>
                      Full Name
                    </label>
                    <input
                      id="contact-full-name"
                      type="text"
                      placeholder="Enter your full name"
                      style={inputStyle}
                      value={fullName}
                      onChange={(ev) => setFullName(ev.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={labelStyle}>
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="Enter your email address"
                      style={inputStyle}
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" style={labelStyle}>
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="Tell us about your question, feedback, or partnership idea..."
                    rows={6}
                    style={{
                      ...inputStyle,
                      minHeight: '140px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                    value={message}
                    onChange={(ev) => setMessage(ev.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    marginTop: '0.25rem',
                    width: '100%',
                    padding: '0.95rem 1.25rem',
                    borderRadius: '0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  Send Message
                  <Send size={18} strokeWidth={2.25} aria-hidden />
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

const InfoDialog: React.FC<InfoDialogProps> = ({ kind, onClose }) => {
  if (kind === 'contact') {
    return <ContactFormDialog onClose={onClose} />;
  }

  const { title, subtitle, body } = copy[kind];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11, 15, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-dialog-title"
          style={{
            background: 'var(--surface)',
            padding: '3rem',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '480px',
            maxHeight: 'min(85vh, 640px)',
            border: '1px solid var(--border)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)' }}
          >
            <X size={24} />
          </button>

          <h2
            id="info-dialog-title"
            style={{
              fontSize: '1.75rem',
              marginBottom: subtitle ? '0.35rem' : '1rem',
              textAlign: 'center',
              paddingRight: '2rem',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              {subtitle}
            </p>
          )}

          <div
            style={{
              overflowY: 'auto',
              paddingRight: '0.25rem',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}
          >
            {body}
          </div>

          <button type="button" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InfoDialog;
