import React from 'react';
import { useAppContext } from '../AppContext';

export default function NewsSentimentView() {
    const { newsData, hasNews, ticker } = useAppContext();

    if (!hasNews) {
        return (
            <div className="p-2 md:p-8 max-w-7xl mx-auto h-[70vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-teal-400 opacity-60">newspaper</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>No News Data Available</h2>
                <p className="text-slate-400 max-w-md text-sm">Fetch a ticker from the sidebar to stream real-time news and AI sentiment analysis.</p>
            </div>
        );
    }

    const { articles, sentiment_score, verdict } = newsData;
    const totalArticles = articles.length;
    const bullishCount  = articles.filter(a => a.sentiment === 'bullish').length;
    const bearishCount  = articles.filter(a => a.sentiment === 'bearish').length;
    const neutralCount  = articles.filter(a => a.sentiment === 'neutral').length;

    const isBullish = sentiment_score > 0.15;
    const isBearish = sentiment_score < -0.15;

    const headerGrad  = isBullish ? 'from-emerald-950/70' : isBearish ? 'from-rose-950/70'   : 'from-slate-900/70';
    const accentColor = isBullish ? 'text-emerald-400'    : isBearish ? 'text-rose-400'       : 'text-slate-400';
    const accentBg    = isBullish ? 'bg-emerald-500/10'   : isBearish ? 'bg-rose-500/10'      : 'bg-slate-500/10';
    const accentBorder= isBullish ? 'border-emerald-500/25': isBearish ? 'border-rose-500/25' : 'border-slate-500/25';
    const glowClass   = isBullish ? 'glow-green'          : isBearish ? 'glow-red'            : '';
    const scoreGrad   = isBullish ? 'text-gradient-green' : isBearish ? 'text-gradient-red'   : 'text-gradient-blue';
    const verdictIcon = isBullish ? 'trending_up'         : isBearish ? 'trending_down'       : 'sync_alt';
    const barAccent   = isBullish ? 'bg-emerald-500'      : isBearish ? 'bg-rose-500'         : 'bg-slate-400';
    const topBorder   = isBullish ? 'border-emerald-500'  : isBearish ? 'border-rose-500'     : 'border-slate-500';

    return (
        <div className="p-2 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">

            {/* ── Hero header ── */}
            <div className={`relative overflow-hidden rounded-2xl border ${accentBorder} bg-gradient-to-br ${headerGrad} via-[#0d1021] to-[#0d1021] p-6 ${glowClass}`}>
                <div className={`absolute -right-16 -top-16 w-56 h-56 ${accentBg} blur-[80px] rounded-full pointer-events-none opacity-60`} />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`material-symbols-outlined text-[20px] ${accentColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                            <span className={`text-[10px] font-bold tracking-[0.2em] ${accentColor} uppercase`}>NLP Sentiment Engine</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                            <span className={accentColor}>{ticker}</span> · News Sentiment
                        </h1>
                        <p className="text-sm text-slate-400">Global headline aggregation — {totalArticles} articles analysed in real-time</p>
                    </div>

                    {/* Verdict badge */}
                    <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border ${accentBorder} ${accentBg} shrink-0`}>
                        <div className="text-right">
                            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">AI Verdict</div>
                            <div className={`text-2xl font-black ${accentColor}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                                {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
                            </div>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${accentBorder} bg-white/[0.04]`}>
                            <span className={`material-symbols-outlined text-2xl ${accentColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{verdictIcon}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* ── Score sidebar ── */}
                <div className="lg:col-span-1 space-y-5">
                    <div className={`bg-white/[0.03] border-t-4 ${topBorder} border border-white/[0.06] rounded-2xl p-5 ${glowClass}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`material-symbols-outlined text-[18px] ${accentColor}`}>radar</span>
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Score</h3>
                        </div>
                        <div className={`text-5xl font-black mb-1 ${scoreGrad}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                            {sentiment_score > 0 ? '+' : ''}{(sentiment_score * 100).toFixed(0)}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            NLP score from {totalArticles} financial headlines
                        </p>

                        {/* Breakdown bars */}
                        <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-3">
                            {[
                                { label: 'Bullish', count: bullishCount, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                                { label: 'Neutral', count: neutralCount, color: 'bg-slate-500',   textColor: 'text-slate-400' },
                                { label: 'Bearish', count: bearishCount, color: 'bg-rose-500',    textColor: 'text-rose-400' },
                            ].map(({ label, count, color, textColor }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-xs mb-1 font-semibold">
                                        <span className={textColor}>{label}</span>
                                        <span className={textColor}>{count}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div className={`h-full ${color} rounded-full transition-all duration-700`}
                                            style={{ width: `${totalArticles ? (count / totalArticles) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Articles grid ── */}
                <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-[18px] ${accentColor}`}>dynamic_feed</span>
                            <h3 className="text-sm font-semibold text-slate-200" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Live NLP Stream · {ticker}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-emerald-400 font-semibold">Live</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {articles.map((article, idx) => {
                            const bull = article.sentiment === 'bullish';
                            const bear = article.sentiment === 'bearish';
                            const borderL = bull ? 'border-l-emerald-500' : bear ? 'border-l-rose-500' : 'border-l-slate-600';
                            const iconColor = bull ? 'text-emerald-400' : bear ? 'text-rose-400' : 'text-slate-500';
                            const tagBg = bull ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : bear ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' : 'bg-slate-500/10 text-slate-400 border-slate-500/25';
                            const icon = bull ? 'trending_up' : bear ? 'trending_down' : 'horizontal_rule';
                            return (
                                <a key={idx} href={article.url} target="_blank" rel="noopener noreferrer"
                                    className={`block p-4 bg-white/[0.02] hover:bg-white/[0.05] border-l-4 ${borderL} border border-white/[0.04] rounded-r-xl transition-all duration-200 group`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`material-symbols-outlined text-[14px] ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{article.source}</span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${tagBg}`}>
                                            {article.sentiment}
                                        </span>
                                    </div>
                                    <h4 className="text-[12px] font-semibold text-slate-200 group-hover:text-white transition-colors leading-snug line-clamp-2 mb-1">
                                        {article.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-500">
                                        {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                    </p>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
