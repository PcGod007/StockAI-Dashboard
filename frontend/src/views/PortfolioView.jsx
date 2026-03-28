import React, { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../AppContext';
import SimChart from '../components/SimChart';
import TutorialOverlay, { TUTORIALS } from '../components/TutorialOverlay';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const INSTRUMENT_TABS = ['EQUITY', 'CALL OPTION', 'PUT OPTION'];

function useTutorial() {
    const alreadyDone = localStorage.getItem('sim_tutorial_done') === 'true';
    const [path, setPath] = useState('EQUITY');
    const [step, setStep] = useState(alreadyDone ? -1 : 0);
    const [active, setActive] = useState(!alreadyDone);

    const advance = useCallback((actionKey) => {
        if (!active) return;
        setStep(prev => {
            const current = TUTORIALS[path][prev];
            if (!current || current.actionKey !== actionKey) return prev;
            return prev + 1;
        });
    }, [active, path]);

    const autoAdvance = useCallback(() => {
        if (!active) return;
        setStep(prev => (prev < TUTORIALS[path].length - 1 ? prev + 1 : prev));
    }, [active, path]);

    const close = useCallback(() => {
        setActive(false);
        localStorage.setItem('sim_tutorial_done', 'true');
    }, []);

    const reopen = useCallback((newPath) => {
        setPath(newPath);
        setStep(0);
        setActive(true);
        localStorage.removeItem('sim_tutorial_done');
    }, []);

    return { tutorialActive: active && step >= 0 && step < TUTORIALS[path].length, path, step, advance, autoAdvance, close, reopen };
}

export default function PortfolioView() {
    const {
        ticker, setTicker, handleFetch, stockData, hasData, loading,
        balance, positions, orders, setOrders, tradeHistory, optionContracts,
        handleDirectTrade, placeOrder, placeOption, settleOption,
    } = useAppContext();

    const { tutorialActive, path, step, advance, autoAdvance, close, reopen } = useTutorial();
    const [showTutChooser, setShowTutChooser] = useState(false);

    // Sim state
    const [simRunning, setSimRunning] = useState(false);
    const [simPrice, setSimPrice] = useState(null);
    const [simTime, setSimTime] = useState(null);
    const simTimeRef = useRef(null);
    const [tradeMarkers, setTradeMarkers] = useState([]);

    const startPrice = hasData && stockData?.length ? stockData[stockData.length - 1].Close : 100;

    // Order form
    const [instrTab, setInstrTab] = useState(0);
    const [orderSide, setOrderSide] = useState('BUY');
    const [orderType, setOrderType] = useState('MARKET');
    const [orderQty, setOrderQty] = useState(1);
    const [limitPrice, setLimitPrice] = useState('');
    const [strikePrice, setStrikePrice] = useState('');
    const [expiryDays, setExpiryDays] = useState(7);
    const [optContracts, setOptContracts] = useState(1);

    // Tutorial-gated handlers
    const handleSimLoad = async () => {
        setSimRunning(false);
        setSimPrice(null);
        setTradeMarkers([]);
        simTimeRef.current = null;
        await handleFetch();
        advance('LOADED');
    };

    const handleTogglePlay = () => {
        const next = !simRunning;
        setSimRunning(next);
        if (next) advance('PLAYING');
    };

    const handleSideChange = (side) => {
        setOrderSide(side);
        if (side === 'BUY') advance('SIDE_CHOSEN');
        if (side === 'SELL') advance('SELL_CHOSEN');
    };

    const handleInstrTab = (idx) => {
        setInstrTab(idx);
        if (idx === 1) advance('TAB_CALL');
        if (idx === 2) advance('TAB_PUT');
    };

    // Listen for options inputs to advance tutorial
    const handleOptInput = () => advance('INPUTS_FILLED');

    const onTick = useCallback((price, syntheticISOTime) => {
        setSimPrice(price);
        simTimeRef.current = syntheticISOTime;
        setSimTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, []);

    const handleExecute = () => {
        const price = simPrice ?? startPrice;
        const execKey = orderSide === 'SELL' ? 'SELL_DONE' : 'TRADE_DONE';

        if (simTimeRef.current) {
            setTradeMarkers(prev => [...prev, {
                time:  simTimeRef.current,
                price: price,
                side:  instrTab === 0 ? orderSide : (instrTab === 1 ? 'CALL' : 'PUT'),
            }]);
        }

        if (instrTab === 0) {
            if (orderType === 'MARKET') {
                handleDirectTrade(orderSide, ticker, Number(orderQty), price, false);
                advance(execKey);
            } else {
                if (!limitPrice || isNaN(limitPrice)) { toast.error('Set a trigger price'); return; }
                placeOrder(orderType, orderSide, ticker, Number(orderQty), Number(limitPrice));
                advance(execKey);
            }
        } else {
            const optType = instrTab === 1 ? 'CALL' : 'PUT';
            if (!strikePrice || isNaN(strikePrice)) { toast.error('Set a strike price'); return; }
            placeOption(optType, ticker, Number(optContracts), Number(strikePrice), price, Number(expiryDays));
            advance('TRADE_DONE');
        }
    };

    const handleSettle = (id) => {
        settleOption(id, simPrice ?? startPrice);
        advance('SETTLE_DONE');
    };

    const handleCancelOrder = (id) => {
        setOrders(o => o.filter(x => x.id !== id));
        toast.success('Order cancelled');
    };

    const posValue = Object.entries(positions).reduce((acc, [t, p]) => {
        const mark = t === ticker && simPrice ? simPrice : p.avgPrice;
        return acc + p.qty * mark;
    }, 0);
    const netLiq = balance + posValue;
    const pnlPct = ((netLiq - 10000) / 10000) * 100;
    const isProfit = pnlPct >= 0;

    return (
        <div className="pb-12 relative">
            {tutorialActive && <TutorialOverlay step={step} steps={TUTORIALS[path]} onClose={close} onAutoAdvance={autoAdvance} />}

            {/* Tutorial Chooser Modal */}
            <Modal isOpen={showTutChooser} onClose={() => setShowTutChooser(false)} title="Choose Your Scenario" maxWidth="max-w-2xl">
                <p className="text-sm text-slate-400 mb-6">Select a learning path to activate the interactive tutorial overlay. We recommend grasping equities before moving onto leveraged derivatives like Call and Put options.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                        onClick={() => { setShowTutChooser(false); reopen('EQUITY'); }}
                        className="bg-white/[0.03] border border-white/[0.05] hover:border-blue-500/50 hover:bg-white/[0.05] p-5 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center group"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-blue-400">monitoring</span>
                        </div>
                        <h3 className="font-bold text-white mb-2">Equity Trading</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">The fundamentals. Learn to buy, hold, and sell stocks in the live simulator using Market, Limit, and Stop orders.</p>
                    </div>

                    <div 
                        onClick={() => { setShowTutChooser(false); reopen('CALL'); }}
                        className="bg-white/[0.03] border border-emerald-500/20 hover:border-emerald-500/70 hover:bg-white/[0.05] p-5 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center group"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-emerald-400">trending_up</span>
                        </div>
                        <h3 className="font-bold text-emerald-400 mb-2">Call Options</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">Profit from upward momentum. Learn to purchase the right to buy at a certain strike price, yielding massive returns with limited risk if the stock rallies.</p>
                    </div>

                    <div 
                        onClick={() => { setShowTutChooser(false); reopen('PUT'); }}
                        className="bg-white/[0.03] border border-rose-500/20 hover:border-rose-500/70 hover:bg-white/[0.05] p-5 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center group"
                    >
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-rose-400">trending_down</span>
                        </div>
                        <h3 className="font-bold text-rose-400 mb-2">Put Options</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">Profit from crashes. Learn to purchase the right to sell at a certain strike price, allowing you to short the market or hedge a long portfolio.</p>
                    </div>
                </div>
            </Modal>

            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-10">
                <div className="space-y-1">
                    <h1 className="font-headline text-4xl font-bold tracking-tight text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>PORTFOLIO SIMULATOR</h1>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <p className="text-slate-400 text-sm font-label tracking-wide uppercase">AI-ORCHESTRATED TRADING SANDBOX</p>
                        <button
                            onClick={() => setShowTutChooser(true)}
                            className="text-[10px] font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2.5 py-0.5 rounded-full hover:bg-yellow-400/20 transition-colors"
                        >
                            TUTORIAL
                        </button>
                    </div>
                </div>
                <div id="sim-netliq-display" className="bg-white/[0.03] p-6 min-w-[340px] rounded-xl relative overflow-hidden border border-white/[0.06]">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl" />
                    <div className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase mb-2">Simulated Net Liq Value</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-headline font-bold text-white">
                            ${netLiq.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                        </span>
                    </div>
                    <div className="text-xs font-medium mt-3 border-t border-white/[0.1] pt-3 flex justify-between">
                        <span className="text-slate-400">Cash Buying Power</span>
                        <span className="font-bold text-white">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left column */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Chart Panel */}
                    <div className="bg-surface-container p-5 rounded-xl border border-white/[0.06] bg-[#0c0f19]">
                        {/* Controls */}
                        <div id="sim-controls-bar" className="flex flex-wrap items-center gap-3 mb-4">
                            <input
                                id="sim-ticker-input"
                                type="text" value={ticker}
                                onChange={e => setTicker(e.target.value.toUpperCase())}
                                placeholder="TICKER"
                                className="bg-black/50 border border-white/[0.1] focus:border-blue-500 px-3 py-2 rounded-lg text-sm font-bold w-24 text-white uppercase outline-none"
                            />
                            <button
                                onClick={handleSimLoad} disabled={loading}
                                className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500/30 active:scale-95 transition-all"
                            >
                                {loading ? 'LOADING...' : 'LOAD DATASET'}
                            </button>

                            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[0.05] ml-auto">
                                <button
                                    id="sim-play-btn"
                                    onClick={handleTogglePlay}
                                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all active:scale-95 ${simRunning ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'}`}
                                >
                                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {simRunning ? 'pause' : 'play_arrow'}
                                    </span>
                                </button>
                                {simPrice ? (
                                    <>
                                        <div className="px-3 border-l border-white/[0.1] flex flex-col">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Live Time</span>
                                            <span className="text-xs font-headline font-bold text-white tabular-nums">{simTime}</span>
                                        </div>
                                        <div className="px-3 border-l border-white/[0.1] flex flex-col">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Mark Price</span>
                                            <span className="text-sm font-headline font-bold text-emerald-400 tabular-nums">${simPrice.toFixed(2)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-xs text-slate-500 font-medium px-3">Press ▶ to Start</span>
                                )}
                            </div>
                        </div>

                        {/* SimChart */}
                        <div className="relative rounded-xl bg-black/60 border border-white/[0.1] min-h-[380px]">
                            <SimChart
                                startPrice={startPrice}
                                tickMs={2000}
                                running={simRunning}
                                onTick={onTick}
                                maxCandles={200}
                                tradeMarkers={tradeMarkers}
                            />
                            {/* Pan hint */}
                            {!simRunning && simPrice && (
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] text-slate-400 font-medium px-4 py-2 rounded-full pointer-events-none select-none">
                                    <span className="material-symbols-outlined text-[12px]">keyboard_double_arrow_left</span>
                                    <span>Click and drag chart sideways to pan history</span>
                                    <span className="material-symbols-outlined text-[12px]">keyboard_double_arrow_right</span>
                                </div>
                            )}
                        </div>

                        {!hasData && (
                            <p className="text-center text-xs text-slate-500 mt-3 font-medium uppercase tracking-widest">
                                Load a ticker to anchor the sim to its real closing price
                            </p>
                        )}
                    </div>

                    {/* Positions Table */}
                    <div className="bg-[#0c0f19] border border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
                            <h3 className="font-headline text-base font-bold tracking-tight text-white">OPEN POSITIONS</h3>
                            <span className="text-[10px] text-slate-500 font-label">{Object.keys(positions).length} EQUITY</span>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 border-b border-white/[0.06] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <tr>{['Asset', 'Qty', 'Avg Price', 'Mark Price', 'P/L'].map(h => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04] text-sm text-slate-300">
                                    {Object.keys(positions).length === 0 ? (
                                        <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-500 font-medium">No equity positions held.</td></tr>
                                    ) : Object.entries(positions).map(([t, p]) => {
                                        const mark = t === ticker && simPrice ? simPrice : p.avgPrice;
                                        const pnl = (mark - p.avgPrice) * p.qty;
                                        return (
                                            <tr key={t} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3 font-bold text-white">{t}</td>
                                                <td className="px-5 py-3">{p.qty}</td>
                                                <td className="px-5 py-3 text-slate-400">${p.avgPrice.toFixed(2)}</td>
                                                <td className="px-5 py-3 font-bold text-white">${mark.toFixed(2)}</td>
                                                <td className="px-5 py-3"><span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Options Table */}
                    {optionContracts.length > 0 && (
                        <div id="options-table" className="bg-[#0c0f19] border border-white/[0.06] rounded-xl overflow-hidden">
                            <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
                                <h3 className="font-headline text-base font-bold tracking-tight text-white">OPTIONS CONTRACTS</h3>
                                <span className="text-[10px] text-slate-500 font-label">{optionContracts.filter(c => c.status === 'OPEN').length} OPEN</span>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-black/40 border-b border-white/[0.06] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <tr>{['Type', 'Ticker', 'Contracts', 'Strike', 'Premium', 'Status / P&L', 'Action'].map(h => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04] text-sm text-slate-300">
                                        {optionContracts.map(c => (
                                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3"><span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${c.type === 'CALL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{c.type}</span></td>
                                                <td className="px-5 py-3 font-bold text-white">{c.ticker}</td>
                                                <td className="px-5 py-3">{c.contracts}</td>
                                                <td className="px-5 py-3">${c.strike.toFixed(2)}</td>
                                                <td className="px-5 py-3 text-slate-400">${c.premium.toFixed(2)}</td>
                                                <td className="px-5 py-3">
                                                    {(() => {
                                                        if (c.status !== 'OPEN') {
                                                            return <span className={`font-bold text-[10px] tracking-wider ${c.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{c.pnl >= 0 ? '+' : ''}${c.pnl.toFixed(2)}</span>;
                                                        }
                                                        
                                                        const currentP = c.ticker === ticker && simPrice ? simPrice : startPrice;
                                                        let intrinsic = 0;
                                                        if (c.type === 'CALL') intrinsic = Math.max(0, currentP - c.strike) * 100 * c.contracts;
                                                        if (c.type === 'PUT') intrinsic = Math.max(0, c.strike - currentP) * 100 * c.contracts;
                                                        const livePnl = intrinsic - c.premium;
                                                        
                                                        return (
                                                            <div className="flex flex-col">
                                                                <span className="text-yellow-400 font-bold text-[9px] tracking-widest leading-none mb-1 shadow-sm opacity-80">OPEN</span>
                                                                <span className={`font-bold text-xs tracking-wider ${livePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {c.status === 'OPEN' && (
                                                        <button onClick={() => handleSettle(c.id)} className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded hover:bg-blue-500/20 active:scale-95 transition-all">SETTLE</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column — Order Terminal */}
                <div className="col-span-12 lg:col-span-4 space-y-5">
                    <div className="bg-[#0c0f19] border border-white/[0.06] p-5 rounded-xl border-t-2 border-t-blue-500 shadow-xl shadow-black/20">
                        <h3 className="font-headline text-base font-bold tracking-tight mb-4 flex items-center justify-between text-white">
                            EXECUTE ORDER
                            <span className="material-symbols-outlined text-blue-400 text-xl">stadium</span>
                        </h3>

                        {/* Instrument tabs */}
                        <div className="flex gap-1 bg-black/40 border border-white/[0.05] rounded-lg p-1 mb-5">
                            {INSTRUMENT_TABS.map((t, i) => {
                                const activeId = i === 1 ? 'tab-call-option' : i === 2 ? 'tab-put-option' : null;
                                return (
                                    <button 
                                        id={activeId}
                                        key={t} onClick={() => handleInstrTab(i)}
                                        className={`flex-1 text-[9px] font-bold py-2 rounded-md transition-colors tracking-wider ${instrTab === i ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/[0.05]'}`}>
                                        {t}
                                    </button>
                                );
                            })}
                        </div>

                        {/* BUY/SELL toggle (equity) */}
                        {instrTab === 0 && (
                            <div className="flex gap-2 mb-5">
                                <button id="order-side-buy"
                                    onClick={() => handleSideChange('BUY')}
                                    className={`flex-1 font-bold py-2.5 rounded-lg text-xs tracking-widest border transition-all active:scale-95 ${orderSide === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-transparent text-slate-500 border-transparent hover:border-white/[0.1] hover:text-white'}`}>
                                    BUY
                                </button>
                                <button id="order-side-sell" onClick={() => handleSideChange('SELL')}
                                    className={`flex-1 font-bold py-2.5 rounded-lg text-xs tracking-widest border transition-all active:scale-95 ${orderSide === 'SELL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-500/5' : 'bg-transparent text-slate-500 border-transparent hover:border-white/[0.1] hover:text-white'}`}>
                                    SELL
                                </button>
                            </div>
                        )}

                        {/* Equity fields */}
                        {instrTab === 0 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Type</label>
                                        <select value={orderType} onChange={e => setOrderType(e.target.value)}
                                            className="w-full bg-black/50 border border-white/[0.1] rounded-lg py-2.5 px-3 text-sm text-white font-medium outline-none focus:border-blue-500 appearance-none">
                                            <option value="MARKET">MARKET</option>
                                            <option value="LIMIT">LIMIT</option>
                                            <option value="STOP">STOP LOSS</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qty (Shares)</label>
                                        <input type="number" min="1" value={orderQty} onChange={e => setOrderQty(e.target.value)}
                                            className="w-full bg-black/50 border border-white/[0.1] rounded-lg py-2.5 px-3 font-bold text-white text-sm outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                {orderType !== 'MARKET' ? (
                                    <div className="space-y-1.5 relative">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trigger Price</label>
                                        <input type="number" step="0.01" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                                            placeholder={`Current: $${(simPrice ?? startPrice).toFixed(2)}`}
                                            className="w-full bg-black/50 border border-white/[0.1] rounded-lg py-2.5 px-3 font-bold text-white text-sm outline-none focus:border-blue-500" />
                                    </div>
                                ) : (
                                    <div className="bg-blue-500/5 rounded-lg px-4 py-3 flex justify-between items-center border border-blue-500/10">
                                        <span className="text-xs text-slate-400">Est. Total Cost</span>
                                        <span className="font-bold text-blue-400">${((simPrice ?? startPrice) * (Number(orderQty) || 1)).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Options fields */}
                        {instrTab > 0 && (
                            <div className="space-y-4">
                                <div className="text-[10px] font-medium text-slate-400 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/[0.05]">
                                    <span className={`font-bold ${instrTab === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{instrTab === 1 ? '📈 CALL' : '📉 PUT'}</span>: Pay a premium for the right to {instrTab === 1 ? 'profit if price rises above' : 'profit if price falls below'} your strike. Hit Settle to realise P&L.
                                </div>
                                <div id="options-inputs-container">
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="space-y-1.5 relative" onBlur={handleOptInput}>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strike Price</label>
                                            <input type="number" step="0.01" value={strikePrice} onChange={e => setStrikePrice(e.target.value)}
                                                placeholder={`$${(simPrice ?? startPrice).toFixed(2)}`}
                                                className="w-full bg-black/50 border border-white/[0.1] rounded-lg py-2.5 px-3 font-bold text-white text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="space-y-1.5 relative" onBlur={handleOptInput}>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contracts</label>
                                            <input type="number" min="1" value={optContracts} onChange={e => setOptContracts(e.target.value)}
                                                className="w-full bg-black/50 border border-white/[0.1] rounded-lg py-2.5 px-3 font-bold text-white text-sm outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 relative" onBlur={handleOptInput}>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expiry (Days)</label>
                                        <input type="number" min="1" max="90" value={expiryDays} onChange={e => setExpiryDays(e.target.value)}
                                            className="w-full bg-black/50 border border-white/[0.1] rounded-lg py-2.5 px-3 font-bold text-white text-sm outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                {strikePrice && (() => {
                                    const currentP = simPrice ?? startPrice;
                                    const stPrice = Number(strikePrice);
                                    let intrinsic = 0;
                                    if (instrTab === 1) intrinsic = Math.max(0, currentP - stPrice);
                                    if (instrTab === 2) intrinsic = Math.max(0, stPrice - currentP);
                                    const timeV = currentP * 0.02;
                                    const premPerShare = intrinsic + timeV;
                                    const totalPrem = premPerShare * 100 * Number(optContracts);
                                    
                                    return (
                                        <div className="bg-blue-500/5 rounded-lg px-4 py-3 border border-blue-500/10 text-xs text-slate-400">
                                            Est. Premium: <span className="font-bold text-blue-400">${totalPrem.toFixed(2)}</span>
                                            <span className="block text-[10px] mt-0.5 opacity-50">
                                                = (Intrinsic ${intrinsic.toFixed(2)} + Time value ${timeV.toFixed(2)}) × 100 × {optContracts} contract(s)
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        <button
                            id="order-execute-btn"
                            onClick={handleExecute}
                            className={`w-full mt-6 font-black py-4 rounded-xl tracking-[0.15em] shadow-xl active:scale-[0.98] hover:brightness-110 transition-all text-sm ${instrTab > 0
                                ? instrTab === 1 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-500/20'
                                    : 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/20'
                                : orderSide === 'BUY' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-[#0c0f19] shadow-emerald-500/20 glow-green'
                                    : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/20 glow-red'
                                }`}
                        >
                            {instrTab === 0
                                ? (orderType === 'MARKET' ? `EXECUTE ${orderSide}` : `PLACE ${orderType}`)
                                : `BUY ${instrTab === 1 ? 'CALL' : 'PUT'} OPTION`}
                        </button>
                    </div>

                    {/* Active Orders */}
                    <div className="bg-[#0c0f19] border border-white/[0.06] p-5 rounded-xl">
                        <h3 className="font-headline text-base font-bold tracking-tight mb-4 flex items-center justify-between text-white">
                            ACTIVE ORDERS
                            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full">{orders.length}</span>
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {orders.length === 0
                                ? <p className="text-xs text-slate-500 py-2">No pending orders.</p>
                                : orders.map(o => (
                                    <div key={o.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.05]">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[9px] font-bold border ${o.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{o.type}</div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{o.action} {o.ticker}</div>
                                                <div className="text-[10px] text-slate-400">@ ${o.price.toFixed(2)} · {o.qty} shs</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleCancelOrder(o.id)} className="text-slate-500 hover:text-rose-400 p-1 transition-colors">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Trade Ledger */}
                    <div className="bg-[#0c0f19] border border-white/[0.06] p-5 rounded-xl">
                        <h3 className="font-headline text-base font-bold tracking-tight mb-4 text-white">TRADE LEDGER</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                            {tradeHistory.length === 0
                                ? <p className="text-xs text-slate-500 py-2">No transactions yet.</p>
                                : [...tradeHistory].reverse().map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${t.type === 'SELL' || t.type === 'PUT' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                                <span className={`material-symbols-outlined text-sm ${t.type === 'SELL' || t.type === 'PUT' ? 'text-rose-400' : 'text-emerald-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    {t.type === 'SELL' || t.type === 'PUT' ? 'north_west' : 'south_east'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{t.type} {t.ticker}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    {typeof t.qty === 'string' ? t.qty : `${t.qty} shs`} @ ${typeof t.price === 'number' ? t.price.toFixed(2) : t.price}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-[10px] text-slate-500">{new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-[10px] font-bold text-emerald-400 tracking-widest">FILLED</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
