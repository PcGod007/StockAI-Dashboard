/**
 * SupportBot – a slide-up chat panel that answers questions about StockAI.
 * Rule-based keyword matcher with friendly, context-aware responses.
 */
import React, { useState, useRef, useEffect } from 'react';

const BOT_NAME = 'Warren';
const USER_AVATAR = '🧑';

// ── Knowledge base ────────────────────────────────────────────────────────────
const KB = [
    {
        patterns: ['fetch', 'load data', 'get data', 'stock data', 'ticker'],
        answer: `**How to load stock data:**\n1. Type a ticker symbol in the sidebar (e.g. AAPL, NVDA, TSLA)\n2. Set your start & end date range\n3. Click **Fetch Data** or press Enter\n\nThe dashboard will populate with OHLCV price data and news articles automatically.`,
    },
    {
        patterns: ['predict', 'run model', 'ai model', 'lstm', 'prediction', 'forecast'],
        answer: `**Running the AI Prediction:**\n1. First fetch data for a ticker\n2. Click **Run AI Model** in the sidebar\n3. You'll be taken to **Predictions** where you'll see:\n   - LSTM historical predictions vs actual price\n   - 30-day blended forecast (LSTM + Momentum + News)\n   - A final verdict (Bullish / Bearish / Neutral)\n\nNote: the 30-day forecast gives more weight to **news sentiment** than raw LSTM output.`,
    },
    {
        patterns: ['news', 'sentiment', 'nlp', 'articles', 'bullish', 'bearish'],
        answer: `**News Sentiment Analysis:**\nStockAI fetches live financial news for your ticker and classifies each headline as Bullish, Bearish, or Neutral using keyword NLP.\n\nSentiment score ranges from -1.0 (very bearish) to +1.0 (very bullish).\n\n**Weight in prediction:** News sentiment accounts for **65%** of the combined signal — it's the primary driver of the verdict.`,
    },
    {
        patterns: ['verdict', 'bullish', 'bearish', 'neutral', 'wrong', 'incorrect', 'inaccurate'],
        answer: `**Understanding the Verdict:**\nThe verdict is a combined signal:\n- 🧠 LSTM 5-day direction: **10%**\n- 📊 Technical indicators (RSI, MA, Momentum): **25%**\n- 📰 News Sentiment: **65%**\n\nIf the projected % and verdict seem inconsistent, it's usually because the 30-day momentum was very negative but news is bullish — the momentum is dampened by the RSI oversold signal to reflect expected mean reversion.`,
    },
    {
        patterns: ['rsi', 'moving average', 'ma', 'momentum', 'technical', 'indicator'],
        answer: `**Technical Indicators used:**\n- **RSI (14-day):** >70 = overbought, <30 = oversold\n- **MA30 vs MA100:** Golden Cross = bullish, Death Cross = bearish\n- **30-day Momentum:** % change over last 30 days\n- **Volatility:** ±$ daily swing over 30 days\n\nWhen RSI is oversold (<30) and momentum is negative, the model dampens the downtrend by 60% to account for likely mean reversion.`,
    },
    {
        patterns: ['portfolio', 'simulator', 'trade', 'buy', 'sell', 'simulate', 'sandbox'],
        answer: `**Portfolio Simulator:**\nThe simulator lets you practice trading with $10,000 of virtual money:\n1. Load a ticker and click ▶ to start the live sim\n2. Choose BUY or SELL, set quantity\n3. Click **Execute** — trades fill at the current sim price\n4. Track your P/L in the Positions table\n\nYou can also place **Limit**, **Stop-Loss**, and **Options (Call/Put)** orders.`,
    },
    {
        patterns: ['tutorial', 'guide', 'how to use', 'walkthrough', 'help me', 'getting started'],
        answer: `**Getting Started with StockAI:**\n1. 📊 **Dashboard** — Load a ticker to see price history + news\n2. 🤖 **Predictions** — Run the AI Model for a 30-day forecast\n3. 📰 **News Sentiment** — Deep-dive into headline NLP analysis\n4. 💼 **Portfolio Simulator** — Practice trading in real-time\n\nOn the Portfolio Simulator page, click **TUTORIAL** for an interactive step-by-step guide!`,
    },
    {
        patterns: ['options', 'call', 'put', 'contract', 'strike', 'premium', 'expiry'],
        answer: `**Options Trading in the Sim:**\n- **CALL option:** profits if price rises above your strike\n- **PUT option:** profits if price falls below your strike\n- Set strike price, contract count, and expiry days\n- Premium = 2% × strike × 100 × contracts\n- Click **Settle** on any open option to realize P/L`,
    },
    {
        patterns: ['limit', 'stop', 'stop loss', 'order type', 'pending', 'order'],
        answer: `**Order Types:**\n- **Market:** Fills immediately at current sim price\n- **Limit:** Fills only when price hits your trigger price\n- **Stop Loss:** Activates as a sell when price drops to trigger\n\nPending orders appear in the **Active Orders** panel and can be cancelled anytime.`,
    },
    {
        patterns: ['bell', 'notification', 'news dropdown', 'top right'],
        answer: `**News Bell (🔔):**\nClick the bell icon in the top-right navbar to see a dropdown of the latest news headlines for your current ticker — from any page. It shows sentiment tags (📈 Bullish / 📉 Bearish) and links to the full articles.`,
    },
    {
        patterns: ['scroll', 'chart', 'pan', 'history', 'zoom', 'candle'],
        answer: `**Navigating the Sim Chart:**\n- While the sim is **running**, the chart auto-scrolls right at a locked zoom level\n- **Pause** the sim, then **click-and-drag left** to scroll back through history\n- A "← Drag to scroll" hint appears at the bottom when paused\n- Trade markers (dashed lines) show exactly where you bought/sold`,
    },
];

const FALLBACK = `I'm not sure about that one! Here are some things I can help with:\n- How to fetch stock data\n- Running the AI prediction model\n- Understanding the verdict & sentiment weights\n- Portfolio simulator & order types\n- Options (Call/Put) trading\n\nTry asking about any of those topics! 😊`;

function getBotReply(text) {
    const lower = text.toLowerCase();
    for (const { patterns, answer } of KB) {
        if (patterns.some(p => lower.includes(p))) return answer;
    }
    return FALLBACK;
}

// ── Simple markdown renderer (bold + newlines) ────────────────────────────────
function MsgText({ text }) {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    const lines = [];
    let rendered = [];
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
            rendered.push(<strong key={i} className="font-semibold text-white">{parts[i]}</strong>);
        } else {
            parts[i].split('\n').forEach((line, j, arr) => {
                rendered.push(line);
                if (j < arr.length - 1) rendered.push(<br key={`br-${i}-${j}`} />);
            });
        }
    }
    return <span>{rendered}</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SupportBot({ isOpen, onClose }) {
    const [msgs, setMsgs] = useState([
        { from: 'bot', text: `Hi! I'm **${BOT_NAME}**, the StockAI assistant 👋\n\nI can help you with predictions, the portfolio simulator, news sentiment, order types, and more.\n\nWhat would you like to know?` },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const send = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        const userMsg = { from: 'user', text: trimmed };
        setMsgs(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const botMsg  = { from: 'bot', text: getBotReply(trimmed) };
            setMsgs(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <>
            {/* Invisible backdrop to detect clicks outside the bot */}
            <div 
                className={`fixed inset-0 z-[9980] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose} 
            />

            <div 
                className={`fixed bottom-6 right-6 z-[9990] w-[calc(100vw-48px)] sm:w-[380px] max-h-[560px] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08] transition-all duration-300 transform origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
                style={{ fontFamily: "'DM Sans', sans-serif", background: '#0f1623' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]"
                style={{ background: 'linear-gradient(135deg, #1a2540 0%, #111827 100%)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{BOT_NAME} · Support Bot</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 400 }}>
                {msgs.map((m, i) => (
                    <div key={i} className={`flex items-end gap-2 ${m.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[18px] shrink-0">{m.from === 'user' ? USER_AVATAR : '🤖'}</span>
                        <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed
                            ${m.from === 'user'
                                ? 'bg-blue-600/80 text-white rounded-br-sm'
                                : 'bg-white/[0.06] text-slate-200 rounded-bl-sm border border-white/[0.06]'}`}>
                            <MsgText text={m.text} />
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex items-end gap-2 flex-row">
                        <span className="text-[18px] shrink-0">🤖</span>
                        <div className="px-3.5 py-3 rounded-2xl bg-white/[0.06] text-slate-400 rounded-bl-sm border border-white/[0.06] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {['How do predictions work?', 'Portfolio simulator help', 'News sentiment explained'].map(q => (
                    <button key={q} onClick={() => { setInput(q); }}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">
                        {q}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Ask anything about StockAI…"
                    className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors"
                />
                <button onClick={send}
                    className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
            </div>
        </div>
        </>
    );
}
