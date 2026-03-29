import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { OverviewChart } from '../components/ChartView';

export default function DashboardView() {
    const { 
        ticker, setTicker, start, setStart, end, setEnd, handleFetch, loading, 
        stockData, hasData, stats, newsData, hasPred, predData, hasNews 
    } = useAppContext();

    // 1H = last 30 days, 1D = last 252 trading days (~1 year), 1W = all data
    const [zoomTab, setZoomTab] = useState('1D');
    const ZOOM_MAP = { '1H': 30, '1D': 252, '1W': 9999 };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto w-full">
            {/* ── Page header ── */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            {ticker ? ticker : 'Market Overview'}
                        </h1>
                        {ticker && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-widest uppercase rounded border border-blue-500/20">
                                Equity
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm">
                        {hasData ? `${stats?.n.toLocaleString()} trading days fetched & analysed.` : 'Enter a ticker and fetch data in the sidebar to begin.'}
                    </p>
                </div>

                {hasData && stats && (
                    <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Current Price</div>
                        <div className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            ${Number(stats.last.Close).toFixed(2)}
                        </div>
                        <div className={`flex items-center justify-end gap-1 text-sm font-semibold mt-0.5 ${stats.pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {stats.pct >= 0 ? 'trending_up' : 'trending_down'}
                            </span>
                            <span>{stats.chgStr}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Data Controls */}
            <div className="md:hidden bg-[#0c0f19] border border-white/[0.06] rounded-xl p-4 shadow-xl shadow-black/20">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Ticker</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[15px] text-slate-500">search</span>
                            <input
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-1.5 pl-10 pr-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50 transition-colors placeholder-slate-600"
                                value={ticker}
                                onChange={e => setTicker(e.target.value.toUpperCase())}
                                placeholder="AAPL, NVDA…"
                                onKeyDown={e => e.key === 'Enter' && !loading && handleFetch()}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Start</label>
                            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-1 px-2 text-[11px] text-slate-100 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">End</label>
                            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-1 px-2 text-[11px] text-slate-100 outline-none" />
                        </div>
                    </div>
                    <button onClick={handleFetch} disabled={loading || !ticker?.trim()} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-[11px] uppercase tracking-widest transition-all bg-blue-500/[0.1] active:bg-blue-500/20 text-blue-400 border border-blue-500/20 disabled:opacity-40">
                        {loading ? <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span> : <span className="material-symbols-outlined text-[14px]">download</span>}
                        Fetch Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                {/* Main Candlestick Chart (Hero Widget) */}
                <div className="col-span-12 xl:col-span-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col md:min-h-[500px] shadow-2xl shadow-black/20">
                    <div className="p-4 flex items-center justify-between bg-white/[0.02] border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <span className="material-symbols-outlined text-[16px] text-blue-400">candlestick_chart</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>Price Action</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">LSTM Live Feed</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-lg border border-white/[0.04]">
                            {['1H', '1D', '1W'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setZoomTab(tab)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${
                                        zoomTab === tab
                                            ? 'bg-blue-500/20 text-white border border-blue-500/30'
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                                    }`}
                                >{tab}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative min-h-[380px] md:min-h-[460px] bg-[#0c0f19]">
                        {hasData ? (
                            <div className="absolute inset-2">
                                <OverviewChart data={stockData} defaultZoomDays={ZOOM_MAP[zoomTab]} />
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-600">query_stats</span>
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Awaiting Price Data</p>
                            </div>
                        )}
                    </div>
                    {hasData && (
                        <div className="py-2.5 px-4 bg-white/[0.015] border-t border-white/[0.06] text-center">
                            <span className="md:hidden text-[9px] text-slate-500 font-bold uppercase tracking-widest">Double tap graph to reset zoom</span>
                            <span className="hidden md:inline text-[10px] text-slate-500 font-bold uppercase tracking-widest">Double click / tap graph to reset zoom</span>
                        </div>
                    )}
                </div>

                {/* Right Column: Sentiment & Insights Widgets */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                    {/* Sentiment Score Widget */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group hover:border-white/[0.1] transition-colors shadow-2xl shadow-black/20">
                        {hasNews && newsData.verdict === 'bullish' && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />}
                        {hasNews && newsData.verdict === 'bearish' && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none" />}
                        
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-[16px] text-slate-500">radar</span>
                            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sentiment Pulse</h3>
                        </div>
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <div className="text-5xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        {hasNews ? Math.round(Math.abs(newsData.sentiment_score * 100)) : '--'}
                                    </div>
                                    <span className="text-xl text-slate-500 font-bold">%</span>
                                </div>
                                
                                <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded inline-flex
                                    ${hasNews 
                                        ? (newsData.verdict === 'bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : newsData.verdict === 'bearish' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20') 
                                        : 'bg-white/[0.04] text-slate-500 border border-white/[0.05]'}`}>
                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {hasNews ? (newsData.verdict === 'bullish' ? 'trending_up' : newsData.verdict === 'bearish' ? 'trending_down' : 'sync_alt') : 'help'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {hasNews ? newsData.verdict : 'Pending'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Radial Progress */}
                            <div className="w-20 h-20 relative flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/[0.05]" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="16" fill="none"
                                        className={`transition-all duration-1000 ease-out 
                                            ${hasNews ? (newsData.verdict === 'bullish' ? 'stroke-emerald-400' : newsData.verdict === 'bearish' ? 'stroke-rose-400' : 'stroke-slate-400') : 'stroke-transparent'}`}
                                        strokeWidth="3" strokeLinecap="round"
                                        strokeDasharray={`${hasNews ? Math.round(Math.abs(newsData.sentiment_score * 100)) : 0}, 100`} />
                                </svg>
                                <span className={`absolute material-symbols-outlined text-[24px]
                                    ${hasNews ? (newsData.verdict === 'bullish' ? 'text-emerald-400' : newsData.verdict === 'bearish' ? 'text-rose-400' : 'text-slate-400') : 'text-slate-600'}`}>
                                    hub
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Model Insights Widget */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/20 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
                            <span className="material-symbols-outlined text-[16px] text-violet-400">psychology</span>
                            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Model Insights</h3>
                        </div>

                        {hasPred && predData?.reasoning?.factors ? (
                            <ul className="space-y-4 max-h-[260px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                                {predData.reasoning.factors.slice(0, 4).map((factor, i) => {
                                    const isPos = factor.toLowerCase().includes('bullish') || factor.toLowerCase().includes('rise') || factor.toLowerCase().includes('gain') || factor.toLowerCase().includes('above');
                                    const isNeg = factor.toLowerCase().includes('bearish') || factor.toLowerCase().includes('fall') || factor.toLowerCase().includes('lost') || factor.toLowerCase().includes('below');
                                    const iconColor = isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-blue-400';
                                    const iconSign = isPos ? 'add_circle' : isNeg ? 'remove_circle' : 'info';

                                    return (
                                        <li key={i} className="flex gap-3 items-start group">
                                            <span className={`material-symbols-outlined text-[16px] mt-0.5 ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {iconSign}
                                            </span>
                                            <p className="text-[11px] text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                                                {factor.includes(':') ? (
                                                    <>
                                                        <strong className="text-white font-semibold">{factor.split(':')[0]}:</strong>
                                                        {factor.substring(factor.indexOf(':') + 1)}
                                                    </>
                                                ) : factor}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full border border-dashed border-white/[0.1] flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-[20px] text-slate-600">psychology</span>
                                </div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Run AI Model</p>
                                <p className="text-[10px] text-slate-600 mt-2 max-w-[180px]">Generate insights to see decision factors here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: News Feed Widget */}
                <div className="col-span-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
                    <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-blue-400">dynamic_feed</span>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live News Stream</h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Source: NLP Aggregate</span>
                        </div>
                    </div>

                    {hasNews && newsData?.articles?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
                            {newsData.articles.slice(0, 3).map((article, i) => {
                                const bull = article.sentiment === 'bullish';
                                const bear = article.sentiment === 'bearish';
                                const tagColor = bull ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : bear ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

                                return (
                                    <div key={i} className="p-3 md:p-5 hover:bg-white/[0.04] transition-colors cursor-pointer group" onClick={() => window.open(article.url, '_blank')}>
                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                            <span className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest line-clamp-1 mr-2">
                                                {article.source} · {article.published_at ? new Date(article.published_at).toLocaleDateString() : ''}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded border text-[8px] md:text-[9px] font-bold uppercase tracking-wider ${tagColor}`}>
                                                {article.sentiment}
                                            </span>
                                        </div>
                                        <h4 className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors leading-snug line-clamp-2" title={article.title}>
                                            {article.title}
                                        </h4>
                                        <p className="hidden md:block text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed" title={article.description}>
                                            {article.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full border border-dashed border-white/[0.1] flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-slate-600">article</span>
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Awaiting News Feed</p>
                            <p className="text-[11px] text-slate-600 mt-2">Enter a ticker to stream live financial headlines.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
