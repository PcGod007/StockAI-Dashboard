import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../AppContext';

const NAV_LINKS = [
    { label: 'Markets',     path: '/dashboard' },
    { label: 'Predictions', path: '/analysis'  },
    { label: 'Execution',   path: '/portfolio' },
];

export default function TopNavbar({ onMenuClick }) {
    const { balance, newsData, hasNews, ticker } = useAppContext();
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef(null);

    // Close bell dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const articles = hasNews ? (newsData?.articles || []).slice(0, 6) : [];
    const verdict  = newsData?.verdict || 'neutral';
    const score    = newsData?.sentiment_score || 0;

    const verdictColor = verdict === 'bullish'
        ? 'text-emerald-400'
        : verdict === 'bearish' ? 'text-rose-400' : 'text-slate-400';

    return (
        <nav style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="fixed top-0 w-full z-50 bg-[#0a0d14]/90 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-6 h-16 shadow-2xl shadow-black/40">

            {/* ── Left: logo + nav links ── */}
            <div className="flex items-center gap-3 md:gap-10">
                {/* Mobile Menu Button */}
                <button 
                    onClick={onMenuClick} 
                    className="md:hidden flex items-center justify-center p-1 -ml-2 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-[26px]">menu</span>
                </button>

                {/* Logo */}
                <NavLink to="/dashboard" className="flex items-center gap-2 group">
                    <div className="hidden sm:flex w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                    </div>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '-0.03em' }}
                        className="text-[18px] text-white group-hover:text-blue-300 transition-colors duration-200">
                        Stock<span className="text-blue-400">AI</span>
                    </span>
                </NavLink>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map(({ label, path }) => (
                        <NavLink key={path} to={path}
                            className={({ isActive }) =>
                                `relative px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 group
                                ${isActive
                                    ? 'text-white bg-white/[0.07]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`
                            }>
                            {({ isActive }) => (
                                <>
                                    {label}
                                    {/* animated underline */}
                                    <span className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-blue-400 transition-all duration-300 origin-left
                                        ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50'}`} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* ── Right: bell + wallet ── */}
            <div className="flex items-center gap-3">

                {/* ── Notification Bell ── */}
                <div ref={bellRef} className="relative">
                    <button
                        id="news-bell-btn"
                        onClick={() => setBellOpen(v => !v)}
                        className={`relative p-2 rounded-lg transition-all duration-200
                            ${bellOpen ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>
                        <span className="material-symbols-outlined text-[22px]">notifications</span>
                        {hasNews && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400 shadow-md shadow-blue-400/50" />
                        )}
                    </button>

                    {/* Dropdown panel */}
                    <div className={`absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-[360px] max-w-[360px] bg-[#0f1623] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden
                        transition-all duration-300 origin-top-right
                        ${bellOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                            <div>
                                <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    News · {ticker || '—'}
                                </p>
                                {hasNews && (
                                    <p className={`text-[11px] font-semibold mt-0.5 ${verdictColor}`}>
                                        Sentiment: {verdict.toUpperCase()}  {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setBellOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Articles */}
                        <div className="max-h-[380px] overflow-y-auto">
                            {articles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">newspaper</span>
                                    <p className="text-sm text-slate-500 font-medium">No news yet</p>
                                    <p className="text-xs text-slate-600 mt-1">Fetch a ticker to load live headlines</p>
                                </div>
                            ) : articles.map((a, i) => {
                                const bull = a.sentiment === 'bullish';
                                const bear = a.sentiment === 'bearish';
                                return (
                                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0 group">
                                        <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0
                                            ${bull ? 'text-emerald-400' : bear ? 'text-rose-400' : 'text-slate-500'}`}
                                            style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {bull ? 'trending_up' : bear ? 'trending_down' : 'remove'}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-medium text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                                                {a.title}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                {a.source} · {a.published_at ? new Date(a.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                            </p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>

                        {hasNews && (
                            <div className="px-5 py-3 border-t border-white/[0.06]">
                                <NavLink to="/sentiment" onClick={() => setBellOpen(false)}
                                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                                    View full sentiment analysis
                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </NavLink>
                            </div>
                        )}
                    </div>
                </div>

                {/* Wallet badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/[0.08] border border-blue-500/20 text-blue-400">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                    <span className="text-xs font-bold">
                        ${(balance ?? 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </nav>
    );
}
