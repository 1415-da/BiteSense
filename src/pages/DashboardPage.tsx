import React from 'react';
import { motion } from 'framer-motion';
import { History, KeyRound, LogOut, ScanLine, ShieldCheck, Sparkles, Target, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';

const tabs = [
  'Overview',
  'Scan Menu',
  'Recommendations',
  'History',
  'Saved Meals',
  'Profile & Goals',
  'Health Preferences',
  'Account & Security',
] as const;

type DashboardTab = (typeof tabs)[number];
type ScanInputMode = 'url' | 'image' | 'pdf';

const scanStages = [
  'Upload received',
  'OCR extraction',
  'Dish parsing',
  'Nutrition mapping',
  'Personal scoring',
];

const sampleSavedMeals = [
  'Grilled Salmon Bowl',
  'Tandoori Chicken Salad',
  'Paneer Tikka Wrap',
  'Lentil Protein Plate',
];

const quickMetricStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'rgba(22, 28, 36, 0.5)',
  borderRadius: '0.875rem',
  padding: '0.9rem 1rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 0.9rem',
  borderRadius: '0.625rem',
  border: '1px solid var(--border)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  outline: 'none',
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = React.useState<DashboardTab>('Overview');

  const [inputMode, setInputMode] = React.useState<ScanInputMode>('url');
  const [menuUrl, setMenuUrl] = React.useState('');
  const [uploadFileName, setUploadFileName] = React.useState<string | null>(null);
  const [restaurantName, setRestaurantName] = React.useState('');
  const [cuisineType, setCuisineType] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [analysisIndex, setAnalysisIndex] = React.useState(-1);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [parsedItems, setParsedItems] = React.useState<string[]>([]);
  const [newItemDraft, setNewItemDraft] = React.useState('');
  const [analysisConfidence, setAnalysisConfidence] = React.useState<number | null>(null);
  const [lastScanAt, setLastScanAt] = React.useState<string | null>(null);
  const [saveNotice, setSaveNotice] = React.useState<string | null>(null);
  const [profileName, setProfileName] = React.useState(user?.full_name ?? '');
  const [profileEmail, setProfileEmail] = React.useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [accountNotice, setAccountNotice] = React.useState<string | null>(null);
  const [accountError, setAccountError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setProfileName(user?.full_name ?? '');
    setProfileEmail(user?.email ?? '');
  }, [user]);

  React.useEffect(() => {
    if (!isAnalyzing) return;
    const timer = window.setInterval(() => {
      setAnalysisIndex((prev) => {
        if (prev >= scanStages.length - 1) {
          window.clearInterval(timer);
          setIsAnalyzing(false);
          setAnalysisConfidence(89);
          setLastScanAt(new Date().toLocaleString());
          setParsedItems((current) => {
            if (current.length > 0) return current;
            return inputMode === 'url'
              ? ['Grilled Chicken Caesar Salad', 'Margherita Flatbread', 'Tomato Basil Soup']
              : ['Paneer Bowl', 'Steamed Dumplings', 'House Veg Stir Fry'];
          });
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [isAnalyzing, inputMode]);

  const recentScanSummary = React.useMemo(() => {
    if (!lastScanAt) {
      return {
        restaurant: 'No scan yet',
        analyzedCount: 0,
        topPicks: ['-'],
      };
    }
    return {
      restaurant: restaurantName || 'Restaurant scan',
      analyzedCount: parsedItems.length,
      topPicks: parsedItems.slice(0, 3),
    };
  }, [lastScanAt, restaurantName, parsedItems]);

  const handleAnalyze = () => {
    setScanError(null);
    setSaveNotice(null);

    if (inputMode === 'url' && !menuUrl.trim()) {
      setScanError('Please paste a menu URL before analyzing.');
      return;
    }
    if ((inputMode === 'image' || inputMode === 'pdf') && !uploadFileName) {
      setScanError(`Please upload a ${inputMode.toUpperCase()} file before analyzing.`);
      return;
    }

    setParsedItems([]);
    setAnalysisConfidence(null);
    setAnalysisIndex(0);
    setIsAnalyzing(true);
  };

  const renderOverview = () => (
    <>
      <h1 style={{ fontSize: '2.1rem', marginBottom: '0.75rem' }}>Overview</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
        Quick snapshot of your health profile, recent scan activity, and what to do next.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Target size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Profile Status</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Goal: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Weight Loss</span> · Restrictions:{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Low Sodium, Diabetic-friendly</span>
          </p>
          <div style={{ ...quickMetricStyle }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Profile completeness: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>82%</span>
            </p>
          </div>
        </div>

        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ScanLine size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Next Action</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Start a new scan to get personalized dish ranking instantly.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.9rem', width: '100%' }}
            onClick={() => setActiveTab('Scan Menu')}
          >
            Scan a New Menu
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={quickMetricStyle}><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Calories fit: <b style={{ color: 'var(--text-primary)' }}>Good</b></p></div>
        <div style={quickMetricStyle}><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Protein fit: <b style={{ color: 'var(--text-primary)' }}>On track</b></p></div>
        <div style={quickMetricStyle}><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sodium risk: <b style={{ color: '#f6c760' }}>Moderate</b></p></div>
        <div style={quickMetricStyle}><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sugar risk: <b style={{ color: 'var(--accent-primary)' }}>Low</b></p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <History size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Recent Scan Summary</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
            Restaurant: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{recentScanSummary.restaurant}</span>
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
            Last scan: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{lastScanAt ?? 'Not available yet'}</span>
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
            Items analyzed: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{recentScanSummary.analyzedCount}</span>
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Top picks:</p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)' }}>
            {recentScanSummary.topPicks.map((item) => (
              <li key={item} style={{ marginBottom: '0.25rem' }}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Saved Meals</h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)' }}>
            {sampleSavedMeals.map((item) => (
              <li key={item} style={{ marginBottom: '0.35rem' }}>{item}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '0.82rem' }} onClick={() => setActiveTab('Profile & Goals')}>Update Goals</button>
            <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '0.82rem' }} onClick={() => setActiveTab('Health Preferences')}>Allergens</button>
          </div>
        </div>
      </div>
    </>
  );

  const renderScanMenu = () => (
    <>
      <h1 style={{ fontSize: '2.1rem', marginBottom: '0.75rem' }}>Scan Menu</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
        Upload a menu URL, image, or PDF to extract dishes and generate personalized recommendations.
      </p>

      <div className="glass" style={{ borderRadius: '1rem', padding: '1rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.7rem' }}>Input method</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['url', 'image', 'pdf'] as ScanInputMode[]).map((mode) => {
            const active = inputMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setInputMode(mode);
                  setScanError(null);
                }}
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.06em',
                  borderRadius: '0.6rem',
                  padding: '0.55rem 0.8rem',
                  border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: active ? 'rgba(41, 201, 139, 0.12)' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {inputMode === 'url' && (
          <input
            type="url"
            placeholder="https://restaurant.com/menu"
            value={menuUrl}
            onChange={(e) => setMenuUrl(e.target.value)}
            style={inputStyle}
          />
        )}

        {(inputMode === 'image' || inputMode === 'pdf') && (
          <div>
            <label htmlFor="menu-file" style={{ display: 'inline-block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Upload {inputMode.toUpperCase()} (max 10MB)
            </label>
            <input
              id="menu-file"
              type="file"
              accept={inputMode === 'image' ? 'image/png,image/jpeg,image/webp' : 'application/pdf'}
              onChange={(e) => setUploadFileName(e.target.files?.[0]?.name ?? null)}
              style={{ ...inputStyle, padding: '0.6rem 0.9rem' }}
            />
            {uploadFileName && (
              <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Selected file: <span style={{ color: 'var(--text-primary)' }}>{uploadFileName}</span>
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          <input
            placeholder="Restaurant name (optional)"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Cuisine type (optional)"
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
          />
        </div>

        {scanError && <p style={{ marginTop: '0.75rem', marginBottom: 0, color: 'var(--accent-danger)', fontSize: '0.88rem' }}>{scanError}</p>}

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-primary" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing…' : 'Analyze Menu'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setMenuUrl('');
              setUploadFileName(null);
              setParsedItems([]);
              setAnalysisIndex(-1);
              setIsAnalyzing(false);
              setAnalysisConfidence(null);
              setScanError(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: '1rem', padding: '1rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Processing Status</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {scanStages.map((stage, idx) => {
            const done = analysisIndex > idx;
            const current = analysisIndex === idx;
            return (
              <div key={stage} style={{ ...quickMetricStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{stage}</span>
                <span style={{ color: done ? 'var(--accent-primary)' : current ? '#f6c760' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                  {done ? 'Done' : current ? 'Running' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
        {analysisConfidence !== null && (
          <p style={{ marginTop: '0.75rem', marginBottom: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Parsing confidence: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{analysisConfidence}%</span>
          </p>
        )}
      </div>

      {parsedItems.length > 0 && (
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Parsed Dishes (editable)</h3>
          <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '0.75rem' }}>
            {parsedItems.map((item, idx) => (
              <div key={`${item}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                <input
                  value={item}
                  onChange={(e) => {
                    setParsedItems((current) => {
                      const next = [...current];
                      next[idx] = e.target.value;
                      return next;
                    });
                  }}
                  style={inputStyle}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.6rem 0.75rem' }}
                  onClick={() => {
                    setParsedItems((current) => current.filter((_, i) => i !== idx));
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '0.9rem' }}>
            <input
              placeholder="Add a missing dish"
              value={newItemDraft}
              onChange={(e) => setNewItemDraft(e.target.value)}
              style={inputStyle}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                if (!newItemDraft.trim()) return;
                setParsedItems((current) => [...current, newItemDraft.trim()]);
                setNewItemDraft('');
              }}
            >
              Add Item
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn btn-primary" onClick={() => setActiveTab('Recommendations')}>
              View Recommendations
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSaveNotice('Scan saved to your history.');
                setActiveTab('Overview');
              }}
            >
              Save Scan
            </button>
          </div>
          {saveNotice && (
            <p style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>{saveNotice}</p>
          )}
        </div>
      )}
    </>
  );

  const renderAccountSecurity = () => (
    <>
      <h1 style={{ fontSize: '2.1rem', marginBottom: '0.75rem' }}>Account & Security</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
        Manage your account details, password, and active session security.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>Profile details</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full name</label>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email address</label>
              <input
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.9rem' }}
            onClick={() => {
              setAccountError(null);
              if (!profileName.trim() || !profileEmail.trim()) {
                setAccountError('Name and email are required.');
                setAccountNotice(null);
                return;
              }
              setAccountNotice('Profile details updated (UI only).');
            }}
          >
            Save profile
          </button>
        </div>

        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <ShieldCheck size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Security snapshot</h3>
          </div>
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            <div style={quickMetricStyle}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Session status: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Active</span>
              </p>
            </div>
            <div style={quickMetricStyle}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Sign-in method: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Email / Google</span>
              </p>
            </div>
            <div style={quickMetricStyle}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Last login: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{new Date().toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: '0.85rem', width: '100%' }}
            onClick={() => {
              setAccountNotice('All other sessions revoked (UI only).');
              setAccountError(null);
            }}
          >
            Sign out other devices
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <KeyRound size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Change password</h3>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              style={inputStyle}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.9rem' }}
            onClick={() => {
              setAccountError(null);
              if (!currentPassword || !newPassword || !confirmPassword) {
                setAccountError('Please fill in all password fields.');
                setAccountNotice(null);
                return;
              }
              if (newPassword.length < 8) {
                setAccountError('New password must be at least 8 characters.');
                setAccountNotice(null);
                return;
              }
              if (newPassword !== confirmPassword) {
                setAccountError('New password and confirmation do not match.');
                setAccountNotice(null);
                return;
              }
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setAccountNotice('Password changed successfully (UI only).');
            }}
          >
            Update password
          </button>
        </div>

        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <Trash2 size={18} color="var(--accent-danger)" />
            <h3 style={{ fontSize: '1.05rem' }}>Danger zone</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
            Deleting your account permanently removes profile data, scan history, and saved meal recommendations.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            style={{ borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)', width: '100%' }}
            onClick={() => {
              setAccountNotice(null);
              setAccountError('Account deletion is disabled in this demo build.');
            }}
          >
            Delete account
          </button>
        </div>
      </div>

      {(accountNotice || accountError) && (
        <p
          style={{
            marginTop: '1rem',
            marginBottom: 0,
            fontSize: '0.9rem',
            color: accountError ? 'var(--accent-danger)' : 'var(--accent-primary)',
          }}
        >
          {accountError ?? accountNotice}
        </p>
      )}
    </>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, var(--bg-primary), var(--bg-secondary))',
        color: 'var(--text-primary)',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(11, 15, 20, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="container"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', paddingBottom: '1rem' }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}
          >
            <img src={logo} alt="Bite Sense logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            Bite Sense
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {user?.full_name ?? user?.email}
            </span>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem', gap: '0.375rem' }}
              onClick={() => {
                void logout();
                navigate('/');
              }}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '2rem',
        }}
      >
        <aside className="glass" style={{ borderRadius: '1rem', padding: '1.25rem', alignSelf: 'start' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            Dashboard
          </p>
          <nav style={{ display: 'grid', gap: '0.625rem' }}>
            {tabs.map((tab) => {
              const active = tab === activeTab;
              return (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    textAlign: 'left',
                    borderRadius: '0.75rem',
                    padding: '0.9rem 1rem',
                    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
                    background: active ? 'rgba(41, 201, 139, 0.1)' : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        </aside>

        <motion.main
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{ borderRadius: '1rem', minHeight: '620px', padding: '2rem' }}
        >
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Scan Menu' && renderScanMenu()}
          {activeTab === 'Account & Security' && renderAccountSecurity()}
          {activeTab !== 'Overview' && activeTab !== 'Scan Menu' && activeTab !== 'Account & Security' && (
            <>
              <h1 style={{ fontSize: '2.1rem', marginBottom: '0.75rem' }}>{activeTab}</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
                This section is ready for implementation.
              </p>
              <div
                style={{
                  border: '1px dashed var(--border)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  background: 'rgba(22, 28, 36, 0.45)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>
                  You are currently viewing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeTab}</span>.
                </p>
              </div>
            </>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardPage;
