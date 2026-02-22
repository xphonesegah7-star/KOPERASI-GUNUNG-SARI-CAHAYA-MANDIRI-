/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  History, 
  LayoutDashboard, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Scale,
  Wallet,
  Save,
  X,
  Settings as SettingsIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TBSEntry {
  id: string;
  date: string;
  pricePerKg: number;
  weight: number;
}

interface SavedSlip {
  id: string;
  timestamp: string;
  recipientName: string;
  buyerName: string;
  month: string;
  entries: TBSEntry[];
  jasaMobil: number;
  pinjamanPribadi: number;
  cashDp: number;
  totalBersih: number;
}

interface AppSettings {
  defaultRecipientName: string;
  defaultBuyerName: string;
  potonganPercentage: number;
  accentColor: string;
  backgroundStyle: 'dots' | 'grid' | 'clean' | 'gradient';
  slipHeader: string;
  logoUrl: string | null;
}

export default function App() {
  // State
  const [settings, setSettings] = useState<AppSettings>({
    defaultRecipientName: 'HERMANSYAH',
    defaultBuyerName: 'Rahmad Efendi, S.Pd',
    potonganPercentage: 1,
    accentColor: '#059669', // emerald-600
    backgroundStyle: 'dots',
    slipHeader: 'SLIP PEMBELIAN TANDAN BUAH SEGAR',
    logoUrl: null
  });
  
  const [recipientName, setRecipientName] = useState(settings.defaultRecipientName);
  const [buyerName, setBuyerName] = useState(settings.defaultBuyerName);
  const [month, setMonth] = useState(format(new Date(), 'MMMM'));
  const [entries, setEntries] = useState<TBSEntry[]>([
    { id: '1', date: format(new Date(), 'yyyy-MM-dd'), pricePerKg: 3010, weight: 3.143 },
  ]);
  const [jasaMobil, setJasaMobil] = useState(0);
  const [pinjamanPribadi, setPinjamanPribadi] = useState(0);
  const [cashDp, setCashDp] = useState(0);
  
  const [history, setHistory] = useState<SavedSlip[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');

  // Load history and settings from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('tbs_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    const savedSettings = localStorage.getItem('tbs_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        // Only set defaults if we are starting fresh or user hasn't typed anything?
        // Actually, let's just use them as initial values if they exist.
        setRecipientName(parsedSettings.defaultRecipientName);
        setBuyerName(parsedSettings.defaultBuyerName);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  // Save settings
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('tbs_settings', JSON.stringify(newSettings));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save history to localStorage
  const saveToHistory = () => {
    const newSlip: SavedSlip = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      recipientName,
      buyerName,
      month,
      entries,
      jasaMobil,
      pinjamanPribadi,
      cashDp,
      totalBersih: totals.totalBersih
    };
    const updatedHistory = [newSlip, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem('tbs_history', JSON.stringify(updatedHistory));
    alert('Slip berhasil disimpan ke riwayat.');
  };

  const loadFromHistory = (slip: SavedSlip) => {
    setRecipientName(slip.recipientName);
    setBuyerName(slip.buyerName);
    setMonth(slip.month);
    setEntries(slip.entries);
    setJasaMobil(slip.jasaMobil);
    setPinjamanPribadi(slip.pinjamanPribadi);
    setCashDp(slip.cashDp);
    setShowHistory(false);
    setActiveTab('input');
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: Math.random().toString(36).substr(2, 9),
        date: format(new Date(), 'yyyy-MM-dd'),
        pricePerKg: entries.length > 0 ? entries[entries.length - 1].pricePerKg : 0,
        weight: 0,
      },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof TBSEntry, value: string | number) => {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const totals = useMemo(() => {
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    // Weight is in Tons, Price is per Kg. Convert Tons to Kg by multiplying by 1000.
    const subTotal = entries.reduce((sum, e) => sum + e.pricePerKg * (e.weight * 1000), 0);
    const potongan = Math.floor(subTotal * (settings.potonganPercentage / 100));
    const totalBersih = subTotal - jasaMobil - pinjamanPribadi - cashDp - potongan;

    return {
      totalWeight,
      subTotal,
      potongan,
      totalBersih,
      avgPrice: totalWeight > 0 ? (subTotal / (totalWeight * 1000)) : 0
    };
  }, [entries, jasaMobil, pinjamanPribadi, cashDp, settings.potonganPercentage]);

  const formatCurrency = (num: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatWeight = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(num);
  };

  return (
    <div 
      className="min-h-screen flex font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-500"
      style={{ 
        backgroundColor: settings.backgroundStyle === 'clean' ? '#FFFFFF' : '#FDFDFD',
        '--accent-color': settings.accentColor,
        '--accent-light': `${settings.accentColor}15`, // 15% opacity
        '--accent-shadow': `${settings.accentColor}33`, // 20% opacity
      } as React.CSSProperties}
    >
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/60 p-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3 mb-10">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300"
            style={{ backgroundColor: 'var(--accent-color)', boxShadow: '0 10px 15px -3px var(--accent-shadow)' }}
          >
            <Scale size={24} />
          </div>
          <span className="font-bold text-lg tracking-tight">TBS Pro</span>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => { setActiveTab('input'); setShowHistory(false); setShowSettings(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'input' && !showHistory && !showSettings ? "font-semibold" : "text-slate-500 hover:bg-slate-50"
            )}
            style={activeTab === 'input' && !showHistory && !showSettings ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' } : {}}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => { setShowHistory(true); setShowSettings(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              showHistory ? "font-semibold" : "text-slate-500 hover:bg-slate-50"
            )}
            style={showHistory ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' } : {}}
          >
            <History size={20} />
            Riwayat
          </button>
          <button 
            onClick={() => { setShowSettings(true); setShowHistory(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              showSettings ? "font-semibold" : "text-slate-500 hover:bg-slate-50"
            )}
            style={showSettings ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' } : {}}
          >
            <SettingsIcon size={20} />
            Pengaturan
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Bersih</p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent-color)' }}>{formatCurrency(totals.totalBersih)}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Background Styles */}
        {settings.backgroundStyle === 'dots' && (
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15] pointer-events-none" />
        )}
        {settings.backgroundStyle === 'grid' && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        )}
        {settings.backgroundStyle === 'gradient' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 pointer-events-none" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 lg:hidden">
             <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Scale size={18} />
            </div>
            <span className="font-bold">TBS Pro</span>
          </div>
          
          <div className="hidden lg:block">
            <h1 className="text-sm font-medium text-slate-500">
              {showHistory ? 'Riwayat Slip' : 'Buat Slip Baru'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={saveToHistory}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Save size={16} />
              Simpan
            </button>
            <button 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <FileText size={16} />
              Preview
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all shadow-md"
              style={{ backgroundColor: 'var(--accent-color)', boxShadow: '0 4px 6px -1px var(--accent-shadow)' }}
            >
              <Printer size={16} />
              Cetak Slip
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {showSettings ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Pengaturan Aplikasi</h2>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] p-6 space-y-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <LayoutDashboard size={18} className="text-emerald-600" />
                    Default Dashboard
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Penerima Default</label>
                      <input 
                        type="text" 
                        value={settings.defaultRecipientName}
                        onChange={(e) => updateSettings({ ...settings, defaultRecipientName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Pembeli Default</label>
                      <input 
                        type="text" 
                        value={settings.defaultBuyerName}
                        onChange={(e) => updateSettings({ ...settings, defaultBuyerName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] p-6 space-y-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    Konfigurasi Slip
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Kop Slip (Judul)</label>
                      <input 
                        type="text" 
                        value={settings.slipHeader}
                        onChange={(e) => updateSettings({ ...settings, slipHeader: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Logo Slip</label>
                      <div className="flex items-center gap-4">
                        {settings.logoUrl ? (
                          <div className="relative group">
                            <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                            <button 
                              onClick={() => updateSettings({ ...settings, logoUrl: null })}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300">
                            <FileText size={24} />
                          </div>
                        )}
                        <label className="flex-1">
                          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 text-center cursor-pointer hover:bg-slate-100 transition-all">
                            Pilih Logo
                          </div>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] p-6 space-y-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-600" />
                    Kalkulasi
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Persentase Potongan (%)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.1"
                          value={settings.potonganPercentage}
                          onChange={(e) => updateSettings({ ...settings, potonganPercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Potongan otomatis yang akan diterapkan pada Sub Total.</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] p-6 space-y-6 md:col-span-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    Tampilan & Tema
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase">Warna Aksen</label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { name: 'Emerald', color: '#059669' },
                          { name: 'Blue', color: '#2563eb' },
                          { name: 'Violet', color: '#7c3aed' },
                          { name: 'Rose', color: '#e11d48' },
                          { name: 'Amber', color: '#d97706' },
                          { name: 'Slate', color: '#475569' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            onClick={() => updateSettings({ ...settings, accentColor: c.color })}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all",
                              settings.accentColor === c.color ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: c.color }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase">Gaya Background</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'dots', label: 'Titik-titik' },
                          { id: 'grid', label: 'Kotak-kotak' },
                          { id: 'gradient', label: 'Gradasi' },
                          { id: 'clean', label: 'Polos' },
                        ].map((style) => (
                          <button
                            key={style.id}
                            onClick={() => updateSettings({ ...settings, backgroundStyle: style.id as any })}
                            className={cn(
                              "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                              settings.backgroundStyle === style.id 
                                ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            )}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] p-6 space-y-6 md:col-span-2">
                  <h3 className="font-bold text-rose-600 flex items-center gap-2">
                    <Trash2 size={18} />
                    Area Berbahaya
                  </h3>
                  
                  <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <div>
                      <p className="font-bold text-rose-900">Hapus Semua Riwayat</p>
                      <p className="text-xs text-rose-700">Tindakan ini tidak dapat dibatalkan. Semua slip yang disimpan akan dihapus.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat transaksi?')) {
                          setHistory([]);
                          localStorage.removeItem('tbs_history');
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-all shadow-md shadow-rose-100"
                    >
                      Hapus Riwayat
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          ) : showHistory ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {history.map((slip) => (
                  <div 
                    key={slip.id}
                    onClick={() => loadFromHistory(slip)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(slip.timestamp), 'dd MMM yyyy')}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{slip.recipientName}</h3>
                    <p className="text-xs text-slate-500 mb-4">{slip.month}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(slip.totalBersih)}</span>
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-400">
                    Belum ada riwayat transaksi.
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Scale size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Berat</p>
                      <p className="text-2xl font-bold">{formatWeight(totals.totalWeight)} <span className="text-sm font-normal text-slate-400">Kg</span></p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata Harga</p>
                      <p className="text-2xl font-bold">{formatCurrency(totals.avgPrice)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bersih</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalBersih)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-4xl mx-auto space-y-6">
                {/* Form Section */}
                <div className="space-y-6 print:hidden">
                  <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">Informasi Dasar</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Penerima</label>
                        <input 
                          type="text" 
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Bulan</label>
                        <input 
                          type="text" 
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Pembeli</label>
                        <input 
                          type="text" 
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">Detail Timbangan</h3>
                      <button 
                        onClick={addEntry}
                        className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <Plus size={16} /> Tambah Baris
                      </button>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-3 text-left">Tanggal</th>
                            <th className="px-6 py-3 text-left">Harga (Rp)</th>
                            <th className="px-6 py-3 text-left">Berat (Kg)</th>
                            <th className="px-6 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <AnimatePresence initial={false}>
                            {entries.map((entry) => (
                              <motion.tr 
                                key={entry.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="group hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <input 
                                    type="date" 
                                    value={entry.date}
                                    onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                                    className="bg-transparent border-none p-0 focus:ring-0 text-sm"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input 
                                    type="number" 
                                    value={entry.pricePerKg}
                                    onChange={(e) => updateEntry(entry.id, 'pricePerKg', parseFloat(e.target.value) || 0)}
                                    className="bg-transparent border-none p-0 focus:ring-0 text-sm w-24"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    value={entry.weight}
                                    onChange={(e) => updateEntry(entry.id, 'weight', parseFloat(e.target.value) || 0)}
                                    className="bg-transparent border-none p-0 focus:ring-0 text-sm w-24 font-medium"
                                  />
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => removeEntry(entry.id)}
                                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Jasa Mobil</label>
                      <input 
                        type="number" 
                        value={jasaMobil}
                        onChange={(e) => setJasaMobil(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Pinjaman</label>
                      <input 
                        type="number" 
                        value={pinjamanPribadi}
                        onChange={(e) => setPinjamanPribadi(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Cash / DP</label>
                      <input 
                        type="number" 
                        value={cashDp}
                        onChange={(e) => setCashDp(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </section>
                </div>
              </div>

              {/* Preview Modal */}
              <AnimatePresence>
                {showPreview && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowPreview(false)}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <FileText size={18} className="text-emerald-600" />
                          Preview Slip Pembelian
                        </h3>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.print()}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            title="Cetak Sekarang"
                          >
                            <Printer size={20} />
                          </button>
                          <button 
                            onClick={() => setShowPreview(false)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center">
                        <div id="slip-preview" className="bg-[#C5D99F] text-black border-2 border-black p-0 overflow-hidden shadow-sm w-full max-w-[210mm]">
                          {/* Header */}
                          <div className="border-b border-black flex items-center px-4 py-2 gap-4">
                            {settings.logoUrl && (
                              <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                            )}
                            <div className="flex-1 text-center font-serif text-xl tracking-widest uppercase font-bold">
                              {settings.slipHeader}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 border-b border-black">
                            <div className="p-4 space-y-1 border-r border-black">
                              <div className="text-sm">Penjualan Tandan Buah Segar (TBS)</div>
                              <div className="text-sm">Bulan {month}</div>
                            </div>
                            <div className="p-4 flex flex-col items-center justify-center">
                              <div className="text-[10px] uppercase tracking-tighter mb-2 font-bold">PENERIMA</div>
                              <div className="flex items-baseline gap-4 w-full">
                                <span className="text-sm">Nama</span>
                                <span className="text-sm">:</span>
                                <span className="text-lg font-bold italic font-serif uppercase flex-1 text-center">{recipientName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Table */}
                          <table className="w-full border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-black">
                                <th className="border-r border-black p-1 font-bold w-8">No.</th>
                                <th className="border-r border-black p-1 font-bold">Jenis Kegiatan</th>
                                <th className="border-r border-black p-1 font-bold w-24">Tanggal</th>
                                <th className="border-r border-black p-1 font-bold w-28">Harga Rp / kg</th>
                                <th className="border-r border-black p-1 font-bold w-24">Ton / Kg</th>
                                <th className="p-1 font-bold text-right pr-4">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entries.map((entry, idx) => (
                                <tr key={entry.id} className="border-b border-black/20">
                                  <td className="border-r border-black p-1 text-center align-top">{idx === 0 ? '1' : ''}</td>
                                  <td className="border-r border-black p-1 align-top">{idx === 0 ? 'Tandan Buah Segar (TBS)' : ''}</td>
                                  <td className="border-r border-black p-1 text-center">{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                                  <td className="border-r border-black p-1">
                                    <div className="flex justify-end px-1">
                                      <span>{formatCurrency(entry.pricePerKg)}</span>
                                    </div>
                                  </td>
                                  <td className="border-r border-black p-1 text-center">{formatWeight(entry.weight)}</td>
                                  <td className="p-1 text-right pr-4">
                                    <div className="flex justify-end px-1">
                                      <span>{formatCurrency(entry.pricePerKg * (entry.weight * 1000))}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Summary Rows */}
                              <tr className="border-t border-black font-bold">
                                <td colSpan={2} rowSpan={6} className="border-r border-black p-4 align-bottom text-center">
                                  <div className="mb-12">Pembeli TBS</div>
                                  <div className="underline font-bold">{buyerName}</div>
                                </td>
                                <td className="border-r border-black p-1 text-center uppercase">SUB TOTAL</td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-r border-black p-1 text-center">{formatWeight(totals.totalWeight)}</td>
                                <td className="p-1 text-right pr-4">
                                  <div className="flex justify-end px-1">
                                    <span>{formatCurrency(totals.subTotal)}</span>
                                  </div>
                                </td>
                              </tr>
                              <tr className="border-t border-black/20">
                                <td className="border-r border-black p-1 uppercase">JASA MOBIL</td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-r border-black p-1"></td>
                                <td className="p-1 text-right pr-4">
                                  <div className="flex justify-end px-1">
                                    <span>{jasaMobil > 0 ? formatCurrency(jasaMobil) : '-'}</span>
                                  </div>
                                </td>
                              </tr>
                              <tr className="border-t border-black/20">
                                <td className="border-r border-black p-1 uppercase">PINJAMAN PRIBADI</td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-r border-black p-1"></td>
                                <td className="p-1 text-right pr-4">
                                  <div className="flex justify-end px-1">
                                    <span>{pinjamanPribadi > 0 ? formatCurrency(pinjamanPribadi) : '-'}</span>
                                  </div>
                                </td>
                              </tr>
                              <tr className="border-t border-black/20">
                                <td className="border-r border-black p-1 uppercase">CAHS /DP</td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-r border-black p-1"></td>
                                <td className="p-1 text-right pr-4">
                                  <div className="flex justify-end px-1">
                                    <span>{cashDp > 0 ? formatCurrency(cashDp) : '-'}</span>
                                  </div>
                                </td>
                              </tr>
                              <tr className="border-t border-black/20">
                                <td className="border-r border-black p-1 uppercase">Potongan {settings.potonganPercentage}%</td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-r border-black p-1"></td>
                                <td className="p-1 text-right pr-4">
                                  <div className="flex justify-end px-1">
                                    <span>{formatCurrency(totals.potongan)}</span>
                                  </div>
                                </td>
                              </tr>
                              <tr className="border-t border-black font-bold bg-black/5">
                                <td className="border-r border-black p-1 uppercase">TOTAL BERSIH</td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-r border-black p-1"></td>
                                <td className="p-1 text-right pr-4">
                                  <div className="flex justify-end px-1">
                                    <span>{formatCurrency(totals.totalBersih)}</span>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>

      <style>{`
        @media print {
          aside, header, .print\\:hidden {
            display: none !important;
          }
          body, .min-h-screen {
            background: white !important;
            padding: 0 !important;
          }
          main {
            padding: 0 !important;
          }
          #slip-preview {
            box-shadow: none !important;
            border-width: 1px !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            transform: none !important;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
}
