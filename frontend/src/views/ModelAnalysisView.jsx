import React from 'react';
import { useAppContext } from '../AppContext';
import { PredictionChart } from '../components/ChartView';

export default function ModelAnalysisView() {
    const { predData, hasPred, handlePredict, loadingModel, hasData } = useAppContext();
    const r = hasPred ? predData.reasoning : null;

    const verdictGrad = !r ? 'text-gradient-blue'
        : r.verdict === 'bullish' ? 'text-gradient-green'
        : r.verdict === 'bearish' ? 'text-gradient-red'
        : 'text-gradient-blue';

    const verdictGlow = !r ? 'glow-blue'
        : r.verdict === 'bullish' ? 'glow-green'
        : r.verdict === 'bearish' ? 'glow-red'
        : 'glow-blue';

    const verdictTopBorder = !r ? 'border-blue-500'
        : r.verdict === 'bullish' ? 'border-emerald-500'
        : r.verdict === 'bearish' ? 'border-rose-500'
        : 'border-blue-500';

    const verdictBg = !r ? 'bg-blue-500/[0.05]'
        : r.verdict === 'bullish' ? 'bg-emerald-500/[0.06]'
        : r.verdict === 'bearish' ? 'bg-rose-500/[0.06]'
        : 'bg-blue-500/[0.05]';

    const pctColor = r && r.pct_change >= 0 ? 'text-emerald-400' : 'text-rose-400';

    return (
        <div className="p-2 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-8">

            {/* ── Page header with purple gradient accent ── */}
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-[#0d1021] to-[#0d1021] p-6 glow-purple">
                {/* Ambient glow blobs */}
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute left-0 bottom-0 w-32 h-32 bg-blue-500/8 blur-[60px] rounded-full pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:justify-between md:items-end gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-violet-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-violet-400 uppercase">AI Engine v4</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                            Model Analysis
                        </h1>
                        <p className="text-sm text-slate-400 max-w-lg">
                            LSTM deep-learning predictions blended with momentum and news sentiment for a 30-day outlook.
                        </p>
                    </div>
                    {hasPred && (
                        <div className="md:text-right shrink-0">
                            <div className="text-[10px] text-violet-400 tracking-[0.18em] font-bold mb-1 uppercase">Live System Status</div>
                            <div className="flex items-center gap-2 md:justify-end">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                </span>
                                <span className="text-sm font-semibold text-emerald-400">Stable Sync</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Run Model Button (Visible everywhere) */}
            <div className="block">
                <button
                    onClick={handlePredict}
                    disabled={loadingModel || !hasData}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm tracking-[0.15em] uppercase transition-all bg-gradient-to-br from-violet-600 to-indigo-700 active:scale-[0.98] text-white shadow-xl shadow-violet-500/20 glow-purple disabled:opacity-40"
                    title={!hasData ? "Fetch data first before running model" : ""}
                >
                    {loadingModel ? <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span> : <span className="material-symbols-outlined text-[18px]">psychology</span>}
                    {loadingModel ? 'Analyzing...' : 'Run AI Model'}
                </button>
                {!hasData && (
                    <p className="text-[10px] text-rose-400 text-center mt-2 font-semibold uppercase tracking-widest">
                        Data required. Fetch a ticker in dashboard.
                    </p>
                )}
            </div>

            {/* ── Chart panel ── */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3 md:p-6 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-72 h-72 bg-violet-500/[0.06] blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-blue-500" />
                        <h3 className="text-base font-semibold text-slate-200" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            AI Forecast Engine
                        </h3>
                    </div>
                    <div className="w-full h-[480px] md:h-[580px] bg-slate-950/50 rounded-xl overflow-hidden border border-white/[0.05] flex items-center justify-center">
                        {hasPred ? (
                            <PredictionChart data={predData} />
                        ) : (
                            <div className="text-center p-8">
                                <span className="material-symbols-outlined text-5xl mb-4 text-violet-400/40 block">psychology</span>
                                <div className="text-lg font-semibold text-white/60 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Awaiting Execution</div>
                                <p className="text-xs text-slate-500 mt-3 max-w-xs mx-auto">
                                    Run the AI Model from the sidebar to generate predictions and a 30-day forecast.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Zoom reset hint */}
            {hasPred && (
                <div className="py-2.5 px-4 bg-white/[0.015] border border-white/[0.06] rounded-xl text-center">
                    <span className="md:hidden text-[9px] text-slate-500 font-bold uppercase tracking-widest">Double tap graph to reset zoom</span>
                    <span className="hidden md:inline text-[10px] text-slate-500 font-bold uppercase tracking-widest">Double click / tap graph to reset zoom</span>
                </div>
            )}

            {/* ── Reasoning section ── */}
            {hasPred && r && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Final Verdict card */}
                    <div className={`lg:col-span-1 rounded-2xl border-t-4 ${verdictTopBorder} ${verdictBg} ${verdictGlow} p-6`}>
                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-4">Final Verdict</div>

                        <div className={`text-5xl font-black mb-1 ${verdictGrad}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                            {r.verdict.charAt(0).toUpperCase() + r.verdict.slice(1)}
                        </div>
                        <div className={`text-sm font-semibold mt-1 ${pctColor}`}>
                            {r.pct_change > 0 ? '+' : ''}{r.pct_change}% projected · ${r.price_target}
                        </div>

                        {/* Mini stats */}
                        <div className="space-y-3 pt-5 mt-5 border-t border-white/[0.07]">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Combined Signal</span>
                                <span className={`text-sm font-bold ${r.combined_signal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {r.combined_signal > 0 ? '+' : ''}{r.combined_signal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">News Sentiment</span>
                                <span className={`text-sm font-bold capitalize ${r.news_sentiment === 'bullish' ? 'text-emerald-400' : r.news_sentiment === 'bearish' ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {r.news_sentiment} {r.news_score > 0 ? '+' : ''}{r.news_score}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">LSTM 5-Day</span>
                                <span className={`text-sm font-bold ${r.lstm_5d_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {r.lstm_5d_pct > 0 ? '+' : ''}{r.lstm_5d_pct}%
                                </span>
                            </div>
                        </div>

                        {/* Weight bar */}
                        <div className="mt-5">
                            <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1.5">Signal Weights</div>
                            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                                <div className="bg-violet-500/70" style={{ width: '10%' }} title="LSTM 10%" />
                                <div className="bg-blue-500/70"   style={{ width: '25%' }} title="Technical 25%" />
                                <div className={`${r.news_sentiment === 'bullish' ? 'bg-emerald-500/70' : r.news_sentiment === 'bearish' ? 'bg-rose-500/70' : 'bg-slate-500/70'}`} style={{ width: '65%' }} title="News 65%" />
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-600 mt-1">
                                <span>LSTM 10%</span><span>Tech 25%</span><span>News 65%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right panel */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Core AI Synthesis */}
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-violet-400 text-[18px]">psychology</span>
                                <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Core AI Synthesis</h3>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{r.summary}</p>
                        </div>

                        {/* Decision Factors */}
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-blue-400 text-[18px]">account_tree</span>
                                <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Decision Factors</h3>
                            </div>
                            <div className="space-y-3">
                                {r.factors.map((factor, idx) => {
                                    const isPos = factor.toLowerCase().includes('bullish') || factor.toLowerCase().includes('golden') || factor.toLowerCase().includes('rise') || factor.toLowerCase().includes('gain');
                                    const isNeg = factor.toLowerCase().includes('bearish') || factor.toLowerCase().includes('fall') || factor.toLowerCase().includes('overbought') || factor.toLowerCase().includes('lost');
                                    const dotColor = isPos ? 'bg-emerald-400' : isNeg ? 'bg-rose-400' : 'bg-blue-400';
                                    return (
                                        <div key={idx} className="flex gap-3 items-start p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isPos ? 'bg-emerald-500/15' : isNeg ? 'bg-rose-500/15' : 'bg-blue-500/15'}`}>
                                                <span className={`text-[9px] font-black ${isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-blue-400'}`}>{idx + 1}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                {factor.includes(':') ? (
                                                    <>
                                                        <strong className="text-slate-200 font-semibold">{factor.split(':')[0]}:</strong>
                                                        {factor.substring(factor.indexOf(':') + 1)}
                                                    </>
                                                ) : factor}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
