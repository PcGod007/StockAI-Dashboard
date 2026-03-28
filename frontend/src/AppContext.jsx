import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchStockData, fetchMovingAverage, fetchPrediction, fetchNews } from './services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
    const today = new Date().toISOString().slice(0, 10);
    const twentyYrsAgo = `${new Date().getFullYear() - 20}-01-01`;

    const [loading, setLoading] = useState(false);
    const [ticker, setTicker] = useState('NVDA');
    const [start, setStart] = useState(twentyYrsAgo);
    const [end, setEnd] = useState(today);
    const [stockData, setStockData] = useState(null);
    const [maData, setMaData] = useState(null);
    const [predData, setPredData] = useState(null);
    const [newsData, setNewsData] = useState(null);
    const [maWindows, setMaWindows] = useState([100]);

    // Sandbox Trading State
    const [balance, setBalance] = useState(10000);
    const [positions, setPositions] = useState({});
    const [orders, setOrders] = useState([]);
    const [tradeHistory, setTradeHistory] = useState([]);
    const [optionContracts, setOptionContracts] = useState([]);

    const hasData = !!stockData;
    const hasPred = !!predData;
    const hasMa = !!maData;
    const hasNews = !!newsData;

    /* ── Stats derived from stock data ── */
    const stats = stockData && stockData.length > 0 ? (() => {
        const d = stockData;
        const n = d.length;
        const last = d[n - 1];
        const prev = d[n - 2] || last;
        const pct = ((last.Close - prev.Close) / prev.Close * 100);
        const chgStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
        const maxH = Math.max(...d.map(r => r.High)).toFixed(2);
        const minL = Math.min(...d.map(r => r.Low)).toFixed(2);
        const avgVol = (d.reduce((s, r) => s + Number(r.Volume), 0) / n);
        const volStr = avgVol >= 1e6 ? `${(avgVol / 1e6).toFixed(1)}M` : `${(avgVol / 1e3).toFixed(0)}K`;
        return { last, pct, chgStr, maxH, minL, volStr, n };
    })() : null;

    const handleDirectTrade = useCallback((action, tradeTicker, qtyRaw, price, fromOrder = false) => {
        const qty = Number(qtyRaw);
        if (isNaN(qty) || qty <= 0) return;

        const cost = qty * price;
        const pos = positions[tradeTicker] || { qty: 0, avgPrice: 0 };

        if (action === 'BUY') {
            if (balance < cost) {
                if (!fromOrder) toast.error('Insufficient funds for trade.');
                return;
            }
            const newQty = pos.qty + qty;
            const newAvg = ((pos.qty * pos.avgPrice) + cost) / newQty;

            setBalance(b => b - cost);
            setPositions(p => ({ ...p, [tradeTicker]: { qty: newQty, avgPrice: newAvg } }));
            setTradeHistory(h => [{ id: Date.now() + Math.random(), type: 'BUY', ticker: tradeTicker, qty, price, time: new Date().toISOString() }, ...h]);

            if (!fromOrder) toast.success(`Bought ${qty} ${tradeTicker} @ $${price.toFixed(2)}`);
            else toast.success(`Order Filled: Bought ${qty} ${tradeTicker} @ $${price.toFixed(2)}`);

        } else if (action === 'SELL') {
            if (pos.qty < qty) {
                if (!fromOrder) toast.error(`Insufficient shares of ${tradeTicker}.`);
                return;
            }
            const revenue = qty * price;
            const newQty = pos.qty - qty;

            setBalance(b => b + revenue);
            setPositions(p => {
                const newP = { ...p };
                if (newQty === 0) {
                    delete newP[tradeTicker];
                } else {
                    newP[tradeTicker] = { qty: newQty, avgPrice: pos.avgPrice };
                }
                return newP;
            });
            setTradeHistory(h => [{ id: Date.now() + Math.random(), type: 'SELL', ticker: tradeTicker, qty, price, time: new Date().toISOString() }, ...h]);

            if (!fromOrder) toast.success(`Sold ${qty} ${tradeTicker} @ $${price.toFixed(2)}`);
            else toast.success(`Order Filled: Sold ${qty} ${tradeTicker} @ $${price.toFixed(2)}`);
        }
    }, [balance, positions]);

    const placeOrder = useCallback((type, action, ordTicker, qty, limitPrice) => {
        const order = { id: Date.now(), type, action, ticker: ordTicker, qty: Number(qty), price: Number(limitPrice) };
        setOrders(o => [...o, order]);
        toast.success(`Placed ${type} ${action} order for ${ordTicker} @ $${limitPrice.toFixed(2)}`);
    }, []);

    const processOrders = useCallback((currentPrice, activeTicker) => {
        setOrders(ordersList => {
            const newOrders = ordersList.filter(o => {
                if (o.ticker !== activeTicker) return true;

                let trigger = false;
                if (o.type === 'LIMIT' && o.action === 'BUY' && currentPrice <= o.price) trigger = true;
                if (o.type === 'LIMIT' && o.action === 'SELL' && currentPrice >= o.price) trigger = true;
                if (o.type === 'STOP' && o.action === 'SELL' && currentPrice <= o.price) trigger = true;

                if (trigger) {
                    setTimeout(() => {
                        handleDirectTrade(o.action, o.ticker, o.qty, currentPrice, true);
                    }, 0);
                    return false;
                }
                return true;
            });
            return newOrders;
        });
    }, [handleDirectTrade]);

    // --- Options (Call / Put contracts) ---
    const placeOption = useCallback((optType, optTicker, contracts, strike, currentPrice, expiryDays) => {
        const qty = Number(contracts);
        if (isNaN(qty) || qty <= 0) return;
        
        let intrinsic = 0;
        if (optType === 'CALL') intrinsic = Math.max(0, currentPrice - strike);
        if (optType === 'PUT') intrinsic = Math.max(0, strike - currentPrice);
        
        const timeValue = currentPrice * 0.02;
        const premiumPerShare = intrinsic + timeValue;
        const premium = premiumPerShare * 100 * qty;
        if (balance < premium) { toast.error('Insufficient funds for option premium.'); return; }
        const expiry = new Date(Date.now() + expiryDays * 24 * 3600 * 1000).toISOString();
        const contract = { id: Date.now() + Math.random(), type: optType, ticker: optTicker, contracts: qty, strike: Number(strike), premium, expiry, status: 'OPEN' };
        setBalance(b => b - premium);
        setOptionContracts(c => [contract, ...c]);
        setTradeHistory(h => [{ id: Date.now() + Math.random(), type: optType, ticker: optTicker, qty: `${qty} contracts`, price: premium, time: new Date().toISOString() }, ...h]);
        toast.success(`${optType} option placed on ${optTicker} @ strike $${Number(strike).toFixed(2)}`);
    }, [balance]);

    const settleOption = useCallback((contractId, currentPrice) => {
        const c = optionContracts.find(x => x.id === contractId && x.status === 'OPEN');
        if (!c) return;
        
        let intrinsic = 0;
        if (c.type === 'CALL') intrinsic = Math.max(0, currentPrice - c.strike) * 100 * c.contracts;
        if (c.type === 'PUT') intrinsic = Math.max(0, c.strike - currentPrice) * 100 * c.contracts;
        const pnl = intrinsic - c.premium;
        
        setBalance(b => b + intrinsic);
        setOptionContracts(cs => cs.map(x => x.id === contractId ? { ...x, status: 'SETTLED', pnl } : x));
        
        const verdict = pnl >= 0 ? 'profit' : 'loss';
        toast.success(`Option settled: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} ${verdict}`);
    }, [optionContracts]);

    const handleFetch = useCallback(async () => {
        if (!ticker.trim()) return;
        setLoading(true);
        try {
            const [res, newsRes] = await Promise.all([
                fetchStockData(ticker, start, end),
                fetchNews(ticker).catch(e => null) // don't block stock data if news fails
            ]);
            if (res.error) { toast.error(res.error); return; }
            setStockData(res.data);
            if (newsRes && !newsRes.error) setNewsData(newsRes);
            setMaData(null);
            setPredData(null);
            toast.success(`Loaded ${res.data.length} rows for ${ticker}`);
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed to fetch stock data.');
        } finally {
            setLoading(false);
        }
    }, [ticker, start, end]);

    const handleShowMA = useCallback(async (windows = [100]) => {
        if (!ticker.trim()) return;
        setLoading(true);
        setMaWindows(windows);
        try {
            const res = await fetchMovingAverage(ticker, start, end, windows);
            if (res.error) { toast.error(res.error); return; }
            setMaData(res);
            toast.success(`Moving average${windows.length > 1 ? 's' : ''} computed (${windows.join(', ')}d)`);
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed to fetch MA data.');
        } finally {
            setLoading(false);
        }
    }, [ticker, start, end]);

    const handlePredict = useCallback(async () => {
        if (!ticker.trim()) return;
        setLoading(true);
        try {
            const res = await fetchPrediction(ticker, start, end);
            if (res.error) { toast.error(res.error); return; }
            setPredData(res);
            toast.success('AI prediction complete!');
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Prediction failed — ensure the Flask API is running.');
        } finally {
            setLoading(false);
        }
    }, [ticker, start, end]);

    return (
        <AppContext.Provider value={{
            loading, ticker, setTicker, start, setStart, end, setEnd,
            stockData, maData, predData, newsData, maWindows,
            hasData, hasPred, hasMa, hasNews, stats,
            balance, positions, orders, setOrders, tradeHistory, optionContracts,
            handleDirectTrade, placeOrder, processOrders, placeOption, settleOption,
            handleFetch, handleShowMA, handlePredict
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
