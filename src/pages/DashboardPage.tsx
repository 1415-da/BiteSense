import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Candy, Flame, History, KeyRound, LogOut, ScanLine, ShieldCheck, Sparkles, Target, Trash2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  changePassword,
  createMenuScan,
  deleteSavedMeal,
  createSavedMeal,
  fetchGoals,
  fetchHealth,
  fetchLatestScan,
  fetchScanHistory,
  fetchSavedMeals,
  patchMenuScanDishes,
  patchProfile,
  putGoals,
  putHealth,
  type GoalsDto,
  type HealthDto,
  type MenuScanDto,
  type MenuScanSummaryDto,
  type SavedMealDto,
} from '../api/workspace';
import { useAuth } from '../auth/AuthContext';
import dashboardHeroBg from '../assets/dashboard-hero-bg.png';
import logo from '../assets/logo.png';
import DashboardSkeleton from './dashboard/DashboardSkeleton';
import DashboardToast from './dashboard/DashboardToast';
import HealthPreferencesTab from './dashboard/HealthPreferencesTab';
import HistoryTab from './dashboard/HistoryTab';
import MatchScorePill from './dashboard/MatchScorePill';
import ProfileGoalsTab from './dashboard/ProfileGoalsTab';
import ProgressRing from './dashboard/ProgressRing';
import RecommendationsTab from './dashboard/RecommendationsTab';
import SparklineMini from './dashboard/SparklineMini';
import { buildRecommendationsFromScan, type ScanRecommendationsPayload } from './dashboard/recommendationModel';
import SavedMealsTab from './dashboard/SavedMealsTab';
import { inputStyle, quickMetricStyle } from './dashboard/styles';
import { DASHBOARD_TABS, type DashboardTab } from './dashboard/types';

type ScanInputMode = 'url' | 'image' | 'pdf';

const scanStages = [
  'Upload received',
  'OCR extraction',
  'Dish parsing',
  'Nutrition mapping',
  'Personal scoring',
];

const DEFAULT_GOALS: GoalsDto = {
  primary_goal: 'Weight loss',
  target_weight_kg: '72',
  workouts_per_week: 4,
  protein_g: 120,
  carbs_g: 180,
  fat_g: 55,
};

const DEFAULT_HEALTH: HealthDto = {
  allergens: ['Shellfish'],
  diets: ['Pescatarian'],
  max_sodium_mg: 2000,
  max_sugar_g: 40,
};

const DashboardPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
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
  const [latestScan, setLatestScan] = React.useState<MenuScanDto | null>(null);
  const [scanSyncing, setScanSyncing] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const dismissToast = React.useCallback(() => setToastMessage(null), []);
  const [workspaceLoading, setWorkspaceLoading] = React.useState(true);
  const [goals, setGoals] = React.useState<GoalsDto>(DEFAULT_GOALS);
  const [health, setHealth] = React.useState<HealthDto>(DEFAULT_HEALTH);
  const [scanHistory, setScanHistory] = React.useState<MenuScanSummaryDto[]>([]);
  const [savedMeals, setSavedMeals] = React.useState<SavedMealDto[]>([]);
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(null);
  const [profileName, setProfileName] = React.useState(user?.full_name ?? '');
  const [profileEmail, setProfileEmail] = React.useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [accountNotice, setAccountNotice] = React.useState<string | null>(null);
  const [accountError, setAccountError] = React.useState<string | null>(null);

  const hydrateFromScan = React.useCallback((scan: MenuScanDto) => {
    setParsedItems([...scan.dishes]);
    setRestaurantName(scan.restaurant_name ?? '');
    setCuisineType(scan.cuisine_type ?? '');
    setLocation(scan.location ?? '');
    setMenuUrl(scan.menu_url ?? '');
    setUploadFileName(scan.upload_filename);
    const m = scan.input_mode;
    if (m === 'url' || m === 'image' || m === 'pdf') setInputMode(m);
    setAnalysisConfidence(scan.confidence);
    setAnalysisIndex(-1);
  }, []);

  const loadWorkspace = React.useCallback(async () => {
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const [scan, goalsRes, healthRes, historyRes, mealsRes] = await Promise.all([
        fetchLatestScan(),
        fetchGoals(),
        fetchHealth(),
        fetchScanHistory(),
        fetchSavedMeals(),
      ]);
      setGoals(goalsRes);
      setHealth(healthRes);
      setScanHistory(historyRes);
      setSavedMeals(mealsRes);
      if (scan) {
        setLatestScan(scan);
        hydrateFromScan(scan);
      } else {
        setLatestScan(null);
      }
    } catch (e) {
      setWorkspaceError(e instanceof Error ? e.message : 'Could not load your dashboard data.');
    } finally {
      setWorkspaceLoading(false);
    }
  }, [hydrateFromScan]);

  const profileCompleteness = React.useMemo(() => {
    let filled = 0;
    const slots = 9;
    if (goals.primary_goal?.trim()) filled += 1;
    if (goals.target_weight_kg?.trim() && Number(goals.target_weight_kg) > 0) filled += 1;
    if (typeof goals.workouts_per_week === 'number' && goals.workouts_per_week >= 0) filled += 1;
    if (goals.protein_g > 0) filled += 1;
    if (goals.carbs_g > 0) filled += 1;
    if (goals.fat_g > 0) filled += 1;
    if (health.max_sodium_mg > 0) filled += 1;
    if (health.max_sugar_g > 0) filled += 1;
    if (health.allergens.length > 0 || health.diets.length > 0) filled += 1;
    return Math.round((filled / slots) * 100);
  }, [goals, health]);

  const overviewScanConfidence = latestScan?.confidence ?? analysisConfidence;

  React.useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

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
          const nextConfidence = 89;
          setAnalysisConfidence(nextConfidence);
          const fallback =
            inputMode === 'url'
              ? ['Grilled Chicken Caesar Salad', 'Margherita Flatbread', 'Tomato Basil Soup']
              : ['Paneer Bowl', 'Steamed Dumplings', 'House Veg Stir Fry'];
          setParsedItems((current) => {
            const dishes = current.length > 0 ? current : fallback;
            queueMicrotask(() => {
              void (async () => {
                setScanSyncing(true);
                setScanError(null);
                try {
                  const saved = await createMenuScan({
                    input_mode: inputMode,
                    menu_url: inputMode === 'url' ? menuUrl.trim() || null : null,
                    upload_filename: uploadFileName,
                    restaurant_name: restaurantName.trim() || null,
                    cuisine_type: cuisineType.trim() || null,
                    location: location.trim() || null,
                    confidence: nextConfidence,
                    dishes,
                  });
                  setLatestScan(saved);
                  setToastMessage('Menu scan saved.');
                  setScanHistory(await fetchScanHistory());
                } catch (e) {
                  setScanError(e instanceof Error ? e.message : 'Could not save scan to the server.');
                } finally {
                  setScanSyncing(false);
                }
              })();
            });
            return dishes;
          });
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [isAnalyzing, inputMode, menuUrl, uploadFileName, restaurantName, cuisineType, location]);

  const recentScanSummary = React.useMemo(() => {
    if (!latestScan) {
      return {
        restaurant: 'No scan yet',
        analyzedCount: 0,
        topPicks: ['-'] as string[],
      };
    }
    return {
      restaurant: restaurantName.trim() || latestScan.restaurant_name?.trim() || 'Restaurant scan',
      analyzedCount: parsedItems.length,
      topPicks: parsedItems.length > 0 ? parsedItems.slice(0, 3) : ['-'],
    };
  }, [latestScan, restaurantName, parsedItems]);

  const scanRecommendations = React.useMemo((): ScanRecommendationsPayload | null => {
    if (!latestScan || parsedItems.length === 0) return null;
    const lastAt = new Date(latestScan.scanned_at).toLocaleString();
    const locationLabel = [cuisineType.trim(), location.trim()].filter(Boolean).join(' · ') || 'Any location';
    return buildRecommendationsFromScan(parsedItems, {
      restaurantLabel: restaurantName.trim() || latestScan.restaurant_name?.trim() || 'Menu scan',
      location: locationLabel,
      lastScanAt: lastAt,
      confidence: analysisConfidence ?? latestScan.confidence,
    });
  }, [latestScan, parsedItems, restaurantName, cuisineType, location, analysisConfidence]);

  const handleAnalyze = () => {
    setScanError(null);

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
    setLatestScan(null);
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Target size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem' }}>Profile Status</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Goal: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{goals.primary_goal}</span> · Allergens:{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{health.allergens.length ? health.allergens.join(', ') : 'None set'}</span>
                {' · '}
                Diets: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{health.diets.length ? health.diets.join(', ') : 'None set'}</span>
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Macro fit vs. targets updates when dish-level nutrition is connected—placeholders below mirror your goals & guardrails.
              </p>
            </div>
            <ProgressRing value={profileCompleteness} size={80} stroke={5} caption="Completeness" />
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ ...quickMetricStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Calories fit</p>
            <MatchScorePill icon={Flame} variant="accent">
              Good
            </MatchScorePill>
          </div>
          <SparklineMini trend="up" />
        </div>
        <div style={{ ...quickMetricStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Protein fit</p>
            <MatchScorePill icon={Zap} variant="accent">
              On track
            </MatchScorePill>
          </div>
          <SparklineMini trend="up" />
        </div>
        <div style={{ ...quickMetricStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sodium risk</p>
            <MatchScorePill icon={AlertTriangle} variant="warn">
              Moderate
            </MatchScorePill>
          </div>
          <SparklineMini trend="warn" />
        </div>
        <div style={{ ...quickMetricStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sugar risk</p>
            <MatchScorePill icon={Candy} variant="accent">
              Low
            </MatchScorePill>
          </div>
          <SparklineMini trend="flat" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <History size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem' }}>Recent Scan Summary</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                Restaurant: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{recentScanSummary.restaurant}</span>
              </p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                Last scan:{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {latestScan ? new Date(latestScan.scanned_at).toLocaleString() : 'Not available yet'}
                </span>
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
            <ProgressRing
              value={overviewScanConfidence}
              size={80}
              stroke={5}
              caption={latestScan ? 'Scan confidence' : 'No scan yet'}
            />
          </div>
        </div>

        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Saved Meals</h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)' }}>
            {savedMeals.length === 0 && <li style={{ marginBottom: '0.35rem' }}>No saved meals yet</li>}
            {savedMeals.slice(0, 6).map((item) => (
              <li key={item.id} style={{ marginBottom: '0.35rem' }}>{item.dish_name}</li>
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
              setLatestScan(null);
              setScanError(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {(isAnalyzing || analysisIndex >= 0) && (
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Processing status</h3>
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
      )}

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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={scanSyncing || !latestScan}
              onClick={() => setActiveTab('Recommendations')}
            >
              {scanSyncing ? 'Syncing scan…' : 'View recommendations'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={!latestScan || parsedItems.length === 0}
              onClick={() => {
                void (async () => {
                  if (!latestScan) return;
                  try {
                    const updated = await patchMenuScanDishes(latestScan.id, parsedItems);
                    setLatestScan(updated);
                    setScanHistory(await fetchScanHistory());
                    setToastMessage('Scan dishes updated.');
                    setActiveTab('Overview');
                  } catch (e) {
                    setScanError(e instanceof Error ? e.message : 'Could not update scan.');
                  }
                })();
              }}
            >
              Save scan
            </button>
          </div>
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
              void (async () => {
                setAccountError(null);
                if (!profileName.trim() || !profileEmail.trim()) {
                  setAccountError('Name and email are required.');
                  setAccountNotice(null);
                  return;
                }
                try {
                  await patchProfile({ full_name: profileName.trim(), email: profileEmail.trim() });
                  await refreshUser();
                  setAccountNotice(null);
                  setToastMessage('Profile updated.');
                } catch (e) {
                  setAccountError(e instanceof Error ? e.message : 'Could not update profile.');
                  setAccountNotice(null);
                }
              })();
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
                Sign-in method: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Email & password</span>
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
              void (async () => {
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
                try {
                  await changePassword({ current_password: currentPassword, new_password: newPassword });
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setAccountNotice(null);
                  setToastMessage('Password changed.');
                } catch (e) {
                  setAccountError(e instanceof Error ? e.message : 'Could not change password.');
                  setAccountNotice(null);
                }
              })();
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
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', color: 'var(--text-primary)' }}>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundColor: '#0B0F14',
          backgroundImage: `radial-gradient(ellipse 100% 75% at 70% 30%, rgba(41, 201, 139, 0.32) 0%, transparent 58%),
            linear-gradient(180deg, rgba(11, 15, 20, 0.48) 0%, rgba(11, 15, 20, 0.28) 48%, rgba(11, 15, 20, 0.52) 100%),
            linear-gradient(102deg, rgba(11, 15, 20, 0.42) 0%, rgba(11, 15, 20, 0.14) 50%, rgba(11, 15, 20, 0.48) 100%),
            url(${dashboardHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="dashboard-root" style={{ position: 'relative', zIndex: 1 }}>
      <header
        data-dashboard-header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(11, 15, 20, 0.48)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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

      {workspaceError && (
        <div className="container" style={{ padding: '0.75rem 2rem 0', maxWidth: '1440px', margin: '0 auto' }}>
          <div className="glass" style={{ borderRadius: '0.75rem', padding: '0.85rem 1rem', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
            {workspaceError}
          </div>
        </div>
      )}

      {workspaceLoading ? (
        <DashboardSkeleton />
      ) : (
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
            {DASHBOARD_TABS.map((tab) => {
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="glass"
          style={{ borderRadius: '1rem', minHeight: '620px', padding: '2rem' }}
        >
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Scan Menu' && renderScanMenu()}
          {activeTab === 'Recommendations' && <RecommendationsTab onNavigate={setActiveTab} scanRecommendations={scanRecommendations} />}
          {activeTab === 'History' && <HistoryTab onNavigate={setActiveTab} scans={scanHistory} />}
          {activeTab === 'Saved Meals' && (
            <SavedMealsTab
              onNavigate={setActiveTab}
              meals={savedMeals}
              onAdd={async (body) => {
                const row = await createSavedMeal(body);
                setSavedMeals((prev) => [row, ...prev]);
              }}
              onRemove={async (id) => {
                await deleteSavedMeal(id);
                setSavedMeals((prev) => prev.filter((m) => m.id !== id));
              }}
            />
          )}
          {activeTab === 'Profile & Goals' && (
            <ProfileGoalsTab
              goals={goals}
              onSave={async (g) => {
                const next = await putGoals(g);
                setGoals(next);
                setToastMessage('Goals saved.');
              }}
            />
          )}
          {activeTab === 'Health Preferences' && (
            <HealthPreferencesTab
              health={health}
              onSave={async (h) => {
                const next = await putHealth(h);
                setHealth(next);
                setToastMessage('Health preferences saved.');
              }}
            />
          )}
          {activeTab === 'Account & Security' && renderAccountSecurity()}
        </motion.main>
      </div>
      )}
      <DashboardToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </div>
  );
};

export default DashboardPage;
