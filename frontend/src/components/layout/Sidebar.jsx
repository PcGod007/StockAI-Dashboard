import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../AppContext';
import SupportBot from '../SupportBot';

const MENU_ITEMS = [
    { id: 'dashboard',     path: '/dashboard',  label: 'Dashboard',          icon: 'dashboard' },
    { id: 'model_analysis',path: '/analysis',   label: 'Model Analysis',     icon: 'analytics',         fill: true },
    { id: 'news_sentiment',path: '/sentiment',  label: 'News Sentiment',     icon: 'psychology' },
    { id: 'portfolio',     path: '/portfolio',  label: 'Portfolio Simulator',icon: 'account_balance' },
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { ticker, setTicker, start, setStart, end, setEnd,
             handleFetch, handlePredict, loading, hasData } = useAppContext();

    const [botOpen, setBotOpen] = useState(false);

    return (
        <>
            <aside style={{ fontFamily: "'DM Sans', sans-serif" }}
                className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-72 bg-[#0c0f19] border-r border-white/[0.05] flex flex-col py-6 z-40 overflow-y-auto overflow-x-hidden custom-scrollbar transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* ── User badge ── */}
                <div className="px-5 mb-5 shrink-0">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden border border-white/[0.1] shrink-0">
                            <img alt="User profile" className="w-8 h-8 rounded"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpDBBpwADT83jVKzSaqXQGg9QIkStxc36nHrg_s9TUhtBEeF4ou3hgwnaBmfPsjHLGQBVRZaZu7JjVn23uWa0dVzVKFUxgcEALnb14Z96qoB76PpkH6K3wC1OTISIchZZre69ArLs5C3ZaLe4khWeXPQ9StrohQMoZB71W7zJqnAu_n60EVk8XHhGtvCIusBUQrPTS6-LGcoq9BaGMlZCODYi5tyKU6kUEGo7c7EmUexzyphOcsMbRzbipmA8NHuPDwOx9FfgkkTk" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-slate-100 leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Strategist</p>
                            <p className="text-[10px] text-blue-400 font-medium tracking-wide">AI-Powered</p>
                        </div>
                    </div>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-none space-y-0.5 px-3 mb-5">
                    {MENU_ITEMS.map((item) => (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            onClick={() => onClose && onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group
                                ${isActive
                                    ? 'bg-blue-500/[0.12] text-blue-300 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:scale-110
                                        ${isActive ? 'text-blue-400' : ''}`}
                                        style={isActive && item.fill ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* ── Data Controls ── */}
                <div className="px-4 mb-5 flex-1">
                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 space-y-4">
                        <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Data Controls</h4>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Ticker</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[15px] text-slate-500">search</span>
                                <input
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-1.5 pl-8 pr-2 text-sm text-slate-100
                                        focus:outline-none focus:border-blue-500/50 transition-colors placeholder-slate-600"
                                    value={ticker}
                                    onChange={e => setTicker(e.target.value.toUpperCase())}
                                    placeholder="AAPL, NVDA…"
                                    onKeyDown={e => e.key === 'Enter' && !loading && handleFetch()}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Start</label>
                                <input type="date" value={start} onChange={e => setStart(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-1 px-2 text-[11px] text-slate-100 focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">End</label>
                                <input type="date" value={end} onChange={e => setEnd(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-1 px-2 text-[11px] text-slate-100 focus:outline-none focus:border-blue-500/40" />
                            </div>
                        </div>

                        <button
                            onClick={handleFetch}
                            disabled={loading || !ticker.trim()}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-[11px] uppercase tracking-widest transition-all duration-200
                                bg-blue-500/[0.1] hover:bg-blue-500/20 text-blue-400 border border-blue-500/20
                                disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
                            {loading
                                ? <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                                : <span className="material-symbols-outlined text-[14px]">download</span>}
                            Fetch Data
                        </button>

                        {hasData && (
                            <>
                                <div className="h-px bg-white/[0.06]" />
                                <button
                                    onClick={() => { handlePredict(); navigate('/analysis'); }}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-[11px] uppercase tracking-widest transition-all duration-200
                                        bg-emerald-500/[0.1] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20
                                        disabled:opacity-40 active:scale-[0.98]">
                                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                                    Run AI Model
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Support Bot button ── */}
                <div className="mt-auto px-4 shrink-0 pb-4">
                    <button
                        onClick={() => setBotOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                            text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] group">
                        <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform text-blue-400"
                            style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                        <span>Support &amp; Help</span>
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">AI</span>
                    </button>
                </div>
            </aside>

            {/* ── Support Bot panel ── */}
            {botOpen && <SupportBot onClose={() => setBotOpen(false)} />}
        </>
    );
}
