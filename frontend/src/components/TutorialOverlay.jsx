import React, { useEffect, useState } from 'react';

export const TUTORIALS = {
        EQUITY: [
        { id: 'load', actionKey: 'LOADED', title: '① Load a Stock', body: 'Type any ticker (e.g. NVDA, AAPL, TSLA) in the input box and click "LOAD DATASET". This seeds the live simulation with that stock\'s last real closing price.', target: 'sim-controls-bar', arrowSide: 'bottom' },
        { id: 'play', actionKey: 'PLAYING', title: '② Start the Simulation', body: 'Hit the ▶ Play button. The OHLC chart will start updating every 2 seconds with realistic random price motion — just like a real intraday terminal.', target: 'sim-play-btn', arrowSide: 'bottom' },
        { id: 'side', actionKey: 'SIDE_CHOSEN', title: '③ Go Long — Choose BUY', body: 'Select BUY to take a long position. You profit if the simulated price rises above your entry. The order panel turns bullish green.', target: 'order-side-buy', arrowSide: 'left' },
        { id: 'execute_buy', actionKey: 'TRADE_DONE', title: '④ Execute Your First Buy!', body: 'Press the big green Execute button to open a long position at the current simulated market price. Your positions table will update instantly.', target: 'order-execute-btn', arrowSide: 'left' },
        { id: 'notify', actionKey: null, timed: 4000, title: '🔔 Trade Confirmed!', body: 'See that green toast notification in the top-right corner ↗ ? That\'s your real-time trade confirmation. Every buy and sell triggers one — watch for it!', target: null, arrowSide: null },
        { id: 'observe', actionKey: null, timed: 5000, title: '👁 Watch the Live Price', body: 'The candlestick chart updates every 2 seconds with realistic Brownian-motion price swings. Your open BUY position\'s P/L is tracking the sim price live right now.', target: 'sim-play-btn', arrowSide: 'bottom' },
        { id: 'sell_side', actionKey: 'SELL_CHOSEN', title: '⑤ Now Sell — Close Your Position', body: 'Click SELL to switch to bearish mode. This queues up a sell order that will close the BUY position you just opened, locking in profit or loss.', target: 'order-side-sell', arrowSide: 'left' },
        { id: 'execute_sell', actionKey: 'SELL_DONE', title: '⑥ Execute the Sell', body: 'Hit the big red EXECUTE SELL button. Watch the toast notification fire again — and your open position will disappear from the positions table below.', target: 'order-execute-btn', arrowSide: 'left' },
        { id: 'wallet', actionKey: null, timed: 5000, title: '💰 Your Wallet Updated!', body: 'Your Simulated Net Liq Value just changed. 🟢 Green % = you profited, 🔴 Red % = you took a loss. Every trade instantly reflects in your balance — no delays.', target: 'sim-netliq-display', arrowSide: 'top' },
        { id: 'done', actionKey: null, title: '🎉 You\'re a Simulated Trader!', body: 'You\'ve completed a full buy-sell cycle. Now explore Limit & Stop-Loss orders, experiment with Call/Put options, and grow your virtual portfolio. Good luck out there!', target: null, arrowSide: null },
    ],
    CALL: [
        { id: 'load', actionKey: 'LOADED', title: '① Load a Stock', body: 'Before trading options, we need an underlying asset. Type a ticker and hit "LOAD DATASET".', target: 'sim-controls-bar', arrowSide: 'bottom' },
        { id: 'play', actionKey: 'PLAYING', title: '② Start the Market', body: 'Hit the ▶ Play button so the stock price begins to move.', target: 'sim-play-btn', arrowSide: 'bottom' },
        { id: 'tab', actionKey: 'TAB_CALL', title: '③ Select CALL OPTION', body: 'Click the "CALL OPTION" tab. A Call option gives you the right (but not the obligation) to BUY the stock at a set Strike Price by Expiry. You profit if the stock rises significantly above your Strike.', target: 'tab-call-option', arrowSide: 'left' },
        { id: 'inputs', actionKey: 'INPUTS_FILLED', title: '④ Set Contract Details', body: 'Enter a Strike Price (usually slightly above the current price). A premium is calculated based on the strike and number of contracts (1 contract = 100 shares).', target: 'options-inputs-container', arrowSide: 'left' },
        { id: 'execute_call', actionKey: 'TRADE_DONE', title: '⑤ Buy the Call', body: 'Hit the green BUY CALL OPTION button. You pay the premium upfront from your cash balance.', target: 'order-execute-btn', arrowSide: 'left' },
        { id: 'observe_call', actionKey: null, timed: 5000, title: '📈 Watch the PnL', body: 'If the simulated stock price rises above your Strike + Premium, your PnL turns green. If it drops, the most you can lose is the premium you paid!', target: 'sim-play-btn', arrowSide: 'bottom' },
        { id: 'settle_call', actionKey: 'SETTLE_DONE', title: '⑥ Settle the Contract', body: 'Whenever you want to take your profit (or cut your loss before expiry), hit the "SETTLE" button in the options table below to close out the contract.', target: 'options-table', arrowSide: 'bottom' },
        { id: 'done', actionKey: null, title: '🎉 Call Option Mastered!', body: 'You successfully traded a Call! Calls are leveraged instruments for when you expect strong upside momentum.', target: null, arrowSide: null },
    ],
    PUT: [
        { id: 'load', actionKey: 'LOADED', title: '① Target an Asset', body: 'To buy a Put, first load a stock you think might go down.', target: 'sim-controls-bar', arrowSide: 'bottom' },
        { id: 'play', actionKey: 'PLAYING', title: '② Unpause the Market', body: 'Hit the ▶ Play button so the price begins to fluctuate.', target: 'sim-play-btn', arrowSide: 'bottom' },
        { id: 'tab', actionKey: 'TAB_PUT', title: '③ Select PUT OPTION', body: 'Click the "PUT OPTION" tab. A Put option gives you the right to SELL the stock at a set Strike Price. You profit if the stock crashes below your Strike.', target: 'tab-put-option', arrowSide: 'left' },
        { id: 'inputs', actionKey: 'INPUTS_FILLED', title: '④ Structure the Put', body: 'Set a Strike Price (usually slightly below the current price). Your premium is the maximum risk. If the stock crashes, your option value skyrockets.', target: 'options-inputs-container', arrowSide: 'left' },
        { id: 'execute_put', actionKey: 'TRADE_DONE', title: '⑤ Buy the Put', body: 'Hit the red BUY PUT OPTION button. Note: You are buying the right to sell later. Premium is paid upfront.', target: 'order-execute-btn', arrowSide: 'left' },
        { id: 'observe_put', actionKey: null, timed: 5000, title: '📉 Rooting for a Drop', body: 'Watch the price. As the stock falls below your strike, your Put option PnL becomes highly profitable.', target: 'sim-play-btn', arrowSide: 'bottom' },
        { id: 'settle_put', actionKey: 'SETTLE_DONE', title: '⑥ Claim the Profit', body: 'Hit "SETTLE" in the options table to cash out the Put option before it expires.', target: 'options-table', arrowSide: 'bottom' },
        { id: 'done', actionKey: null, title: '🎉 Put Option Mastered!', body: 'You successfully traded a Put! Puts are how traders profit from crashes or hedge their portfolios against market drops.', target: null, arrowSide: null },
    ]
};

function ArrowSVG({ side }) {
    if (!side) return null;
    const deg = { bottom: 90, left: 0, top: -90, right: 180 }[side] ?? 0;

    const posStyle = (() => {
        if (side === 'bottom') return { position: 'absolute', top: -40, left: '50%', transform: `translateX(-50%) rotate(-90deg)` };
        if (side === 'top') return { position: 'absolute', bottom: -40, left: '50%', transform: `translateX(-50%) rotate(90deg)` };
        if (side === 'left') return { position: 'absolute', right: -32, top: 24, transform: `rotate(0deg)` };
        return { position: 'absolute', bottom: -32, left: '50%', transform: `translateX(-50%) rotate(${deg}deg)` };
    })();

    return (
        <svg width="28" height="28" viewBox="0 0 32 32" style={posStyle}>
            <defs>
                <marker id={`arr-${side}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#facc15" />
                </marker>
            </defs>
            <line x1="4" y1="16" x2="24" y2="16" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" markerEnd={`url(#arr-${side})`} />
        </svg>
    );
}

const PAD = 8;

export default function TutorialOverlay({ step, steps = TUTORIALS.EQUITY, onClose, onAutoAdvance }) {
    const current = steps[step];
    const [rect, setRect] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    useEffect(() => {
        let raf;
        let lastStr = '';
        
        const tick = () => {
            if (!current?.target) {
                if (lastStr !== 'null') { setRect(null); lastStr = 'null'; }
            } else {
                const el = document.getElementById(current.target);
                if (!el) {
                    if (lastStr !== 'null') { setRect(null); lastStr = 'null'; }
                } else {
                    const r = el.getBoundingClientRect();
                    const str = `${r.top.toFixed(1)},${r.left.toFixed(1)},${r.width.toFixed(1)},${r.height.toFixed(1)}`;
                    if (str !== lastStr) {
                        setRect(r);
                        lastStr = str;
                    }
                }
            }
            raf = requestAnimationFrame(tick);
        };
        tick();

        // Scroll the target securely into the center of the viewport
        if (current?.target) {
            setTimeout(() => {
                const el = document.getElementById(current.target);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
        }

        return () => cancelAnimationFrame(raf);
    }, [current]);

    useEffect(() => {
        if (!current?.timed || !onAutoAdvance) return;
        const timer = setTimeout(onAutoAdvance, current.timed);
        return () => clearTimeout(timer);
    }, [step, current, onAutoAdvance]);

    if (!current) return null;

    const isLast = step === steps.length - 1;
    const isTimed = !!current.timed;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const hTop    = rect ? rect.top    - PAD : 0;
    const hLeft   = rect ? rect.left   - PAD : 0;
    const hRight  = rect ? rect.right  + PAD : 0;
    const hBottom = rect ? rect.bottom + PAD : 0;

    const dimmerRects = rect ? [
        { top: 0,       left: 0,      width: W,           height: Math.max(0, hTop),           key: 'top' },
        { top: hBottom, left: 0,      width: W,           height: Math.max(0, H - hBottom),    key: 'bot' },
        { top: hTop,    left: 0,      width: Math.max(0, hLeft),       height: Math.max(0, hBottom - hTop), key: 'lft' },
        { top: hTop,    left: hRight, width: Math.max(0, W - hRight),  height: Math.max(0, hBottom - hTop), key: 'rgt' },
    ] : [
        { top: 0, left: 0, width: W, height: H, key: 'full' },
    ];

    const getBlobStyle = () => {
        if (!current.target || !rect) return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9999 };
        
        let t, l;
        if (current.arrowSide === 'bottom') {
            t = hTop - 200; // Place well above
            l = Math.max(8, Math.min(rect.left, W - 324));
        } else if (current.arrowSide === 'top') {
            t = hBottom + 8; // Place below
            l = Math.max(8, Math.min(rect.left, W - 324));
        } else if (current.arrowSide === 'left') {
            t = Math.max(8, rect.top - 12);
            l = Math.max(8, hLeft - 320); // Place left
        } else {
            t = hBottom + 8;
            l = Math.max(8, rect.left);
        }

        // Clamp safely to screen bounds
        t = Math.max(8, Math.min(t, H - 250));
        l = Math.max(8, Math.min(l, W - 324));
        
        return { position: 'fixed', top: t, left: l, zIndex: 9999 };
    };

    return (
        <div className={isClosing ? 'animate-backdrop-out' : 'animate-backdrop'} style={{ position: 'fixed', inset: 0, zIndex: 9980, pointerEvents: 'none' }}>
            {dimmerRects.map(r => (
                <div key={r.key} style={{
                    position: 'fixed', top: r.top, left: r.left, width: r.width, height: r.height,
                    background: 'rgba(0,0,0,0.70)', pointerEvents: 'auto', zIndex: 9981,
                }} />
            ))}

            <div style={{ ...getBlobStyle(), pointerEvents: 'auto' }}>
                <div className={isClosing ? 'animate-blob-out' : 'animate-blob'} style={{
                    position: 'relative', background: '#060e1c', border: '2px solid rgba(250,204,21,0.7)',
                    borderRadius: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(250,204,21,0.08)',
                    padding: '20px', width: 308, overflow: 'hidden',
                }}>
                    {isTimed && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(250,204,21,0.15)' }}>
                            <div key={`pb-${step}`} style={{ height: '100%', background: 'linear-gradient(90deg, #facc15, #fb923c)', borderRadius: '0 999px 999px 0', animation: `tutProgress ${current.timed}ms linear forwards` }} />
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#fde047', lineHeight: 1.35, flex: 1, fontFamily: 'Space Grotesk, sans-serif' }}>{current.title}</h3>
                        <button onClick={handleClose} style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#64748b', background: 'transparent', border: '1px solid #334155', borderRadius: 999, padding: '2px 8px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s', fontFamily: 'Inter, sans-serif' }}
                            onMouseEnter={e => { e.currentTarget.style.color='#f43f5e'; e.currentTarget.style.borderColor='rgba(244,63,94,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='#334155'; }}
                        >QUIT</button>
                    </div>

                    <p style={{ margin: '0 0 16px 0', fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{current.body}</p>

                    {isLast ? (
                        <button onClick={handleClose} style={{ width: '100%', background: 'linear-gradient(135deg,#facc15,#fb923c)', color: '#0f172a', border: 'none', borderRadius: 12, padding: '10px 0', fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'filter 0.15s', boxShadow: '0 4px 20px rgba(250,204,21,0.25)' }}
                            onMouseEnter={e => e.currentTarget.style.filter='brightness(1.12)'} onMouseLeave={e => e.currentTarget.style.filter='none'}
                        >Start Trading! 🚀</button>
                    ) : isTimed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(250,204,21,0.55)' }}>
                            <span style={{ animation: 'pulse 1.4s ease-in-out infinite', fontSize: 12 }}>⏳</span>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Auto-advancing…</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(250,204,21,0.75)' }}>
                            <span style={{ animation: 'pulse 2s infinite', fontSize: 14 }}>◉</span>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Waiting for your action…</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 5, marginTop: 16, flexWrap: 'wrap' }}>
                        {steps.map((_, i) => (
                            <div key={i} style={{ height: 5, borderRadius: 999, transition: 'all 0.25s', background: i === step ? '#facc15' : i < step ? 'rgba(250,204,21,0.35)' : '#1e293b', width: i === step ? 18 : 5 }} />
                        ))}
                    </div>

                    {current.arrowSide && <ArrowSVG side={current.arrowSide} />}
                </div>
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} } @keyframes tutProgress { from { width: 100% } to { width: 0% } }`}</style>
        </div>
    );
}
