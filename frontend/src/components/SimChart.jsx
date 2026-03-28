/**
 * SimChart – live candlestick simulation using Plotly
 *
 * Key design:
 *  - X-axis uses SYNTHETIC monotonic timestamps (startTime + i * tickMs),
 *    NOT real wall-clock time. This guarantees every candle is exactly
 *    tickMs wide on screen regardless of pauses, lag, or render jitter.
 *  - Plotly.newPlot() once with pre-seeded candles.
 *  - Plotly.extendTraces() every tick (no full redraw).
 *  - Rolling x-axis window: always shows exactly VISIBLE_CANDLES.
 *    Zoom/density never changes while running.
 *  - When paused the user can pan/scroll left to see history and trade markers.
 *  - tradeMarkers prop: [{ time: ISOString, price: number, side: 'BUY'|'SELL' }]
 *    These are drawn as persistent dashed vertical lines with labels.
 */
import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

const VISIBLE_CANDLES = 28;

// ── helpers ──────────────────────────────────────────────────────────────────

function nextCandle(prevClose) {
    const v = 0.015;
    const d = (Math.random() - 0.5) * 2 * v;
    const open  = prevClose;
    const close = open * (1 + d);
    const body  = Math.abs(close - open);
    const wick  = body * (0.2 + Math.random() * 0.4);
    return {
        open,
        close,
        high: Math.max(open, close) + wick,
        low:  Math.min(open, close) - wick,
    };
}

function seedCandles(startPrice, count, intervalMs, endTime) {
    const times = [], O = [], H = [], L = [], C = [];
    let price = startPrice;
    for (let i = count - 1; i >= 0; i--) {
        const c = nextCandle(price);
        times.push(new Date(endTime - i * intervalMs).toISOString());
        O.push(c.open); H.push(c.high); L.push(c.low); C.push(c.close);
        price = c.close;
    }
    return { times, O, H, L, C, lastClose: price };
}

/** Build Plotly shapes + annotations for trade markers */
function buildMarkerLayout(markers) {
    const shapes = markers.map(m => ({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: m.time,
        x1: m.time,
        y0: 0,
        y1: 1,
        line: {
            color: m.side === 'BUY' ? 'rgba(16,185,129,0.55)' : 'rgba(244,63,94,0.55)',
            width: 1.5,
            dash: 'dot',
        },
    }));

    const annotations = markers.map(m => ({
        xref: 'x',
        yref: 'paper',
        x: m.time,
        y: 0.97,
        text: `${m.side} $${m.price.toFixed(2)}`,
        showarrow: false,
        font: {
            family: 'Inter, sans-serif',
            size: 9,
            color: m.side === 'BUY' ? '#10b981' : '#f43f5e',
        },
        xanchor: 'left',
        yanchor: 'top',
        bgcolor: 'rgba(6,14,28,0.85)',
        bordercolor: m.side === 'BUY' ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)',
        borderwidth: 1,
        borderpad: 3,
    }));

    return { shapes, annotations };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function SimChart({
    startPrice   = 100,
    tickMs       = 2000,
    running      = false,
    onTick,               // called as onTick(price, syntheticISOTime)
    maxCandles   = 200,   // default history buffer — more = more scrollable past
    tradeMarkers = [],    // [{ time: ISOString, price, side }]
}) {
    const divRef    = useRef(null);
    const lastPrice = useRef(startPrice);
    const inited    = useRef(false);
    const nextTime  = useRef(0);

    // ── Init / re-init when startPrice changes ──────────────────────────────
    useEffect(() => {
        if (!divRef.current) return;

        const anchorMs = Date.now();
        const seed = seedCandles(startPrice, maxCandles, tickMs, anchorMs);
        lastPrice.current = seed.lastClose;
        nextTime.current  = anchorMs + tickMs;

        const trace = {
            type: 'candlestick',
            x:     seed.times,
            open:  seed.O,
            high:  seed.H,
            low:   seed.L,
            close: seed.C,
            increasing: { line: { color: '#10b981', width: 1 }, fillcolor: '#10b981' },
            decreasing: { line: { color: '#f43f5e', width: 1 }, fillcolor: '#f43f5e' },
            name: 'Price',
            hoverinfo: 'x+y',
            whiskerwidth: 0.25,
            line: { width: 1 },
        };

        const visT = seed.times.slice(-VISIBLE_CANDLES);
        const visH = seed.H.slice(-VISIBLE_CANDLES);
        const visL = seed.L.slice(-VISIBLE_CANDLES);
        const xMin = visT[0];
        const xMax = new Date(new Date(visT[visT.length - 1]).getTime() + tickMs).toISOString();

        const maxY = Math.max(...visH);
        const minY = Math.min(...visL);
        const padY = (maxY - minY) * 0.15 || startPrice * 0.02;

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor:  'rgba(7,17,31,0)',
            font: { family: 'Inter, sans-serif', color: '#8b949e', size: 11 },
            margin: { l: 70, r: 16, t: 40, b: 56 },
            title: {
                text: 'Live Intraday Simulation',
                font: { family: 'Space Grotesk, sans-serif', size: 14, color: '#c9d1d9' },
                x: 0.01, xanchor: 'left',
            },
            xaxis: {
                type: 'date',
                tickformat: '%H:%M:%S',
                gridcolor:  'rgba(56,139,253,.06)',
                linecolor:  'rgba(56,139,253,.15)',
                tickcolor:  'rgba(56,139,253,.15)',
                rangeslider: { visible: false },
                range: [xMin, xMax],
                autorange: false,
                title: { text: 'Sim time  (HH:MM:SS)', font: { size: 10, color: '#4b5563' } },
                fixedrange: false,
            },
            yaxis: {
                tickprefix: '$',
                gridcolor: 'rgba(56,139,253,.06)',
                linecolor: 'rgba(56,139,253,.15)',
                tickcolor: 'rgba(56,139,253,.15)',
                range: [minY - padY, maxY + padY],
                fixedrange: false,
            },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor:     '#0a1628',
                bordercolor: 'rgba(56,139,253,.5)',
                font: { family: 'Inter, sans-serif', color: '#e6edf3', size: 12 },
            },
            shapes:      [],
            annotations: [],
        };

        Plotly.newPlot(divRef.current, [trace], layout, {
            responsive:     true,
            displayModeBar: false,
            displaylogo:    false,
            scrollZoom:     false,
            doubleClick:    false,
        });

        inited.current = true;
        return () => {
            if (divRef.current) Plotly.purge(divRef.current);
            inited.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startPrice]);

    // ── Sync trade marker annotations whenever the array changes ──────────────
    useEffect(() => {
        if (!divRef.current || !inited.current) return;
        const { shapes, annotations } = buildMarkerLayout(tradeMarkers);
        Plotly.relayout(divRef.current, { shapes, annotations });
    }, [tradeMarkers]);

    // ── Pan mode when paused, zoom-lock when running ───────────────────────────
    // Plotly default dragmode is 'zoom' (draws a selection box).
    // Switch to 'pan' so the user can click-drag LEFT to scroll back through
    // history when the simulation is paused.
    useEffect(() => {
        if (!divRef.current || !inited.current) return;
        Plotly.relayout(divRef.current, {
            dragmode: running ? 'zoom' : 'pan',
        });
    }, [running]);

    // ── Tick loop ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!running || !inited.current) return;

        const id = setInterval(() => {
            if (!divRef.current || !inited.current) return;

            const c = nextCandle(lastPrice.current);
            lastPrice.current = c.close;

            const syntheticTime = new Date(nextTime.current).toISOString();
            nextTime.current += tickMs;

            Plotly.extendTraces(divRef.current, {
                x:     [[syntheticTime]],
                open:  [[c.open]],
                high:  [[c.high]],
                low:   [[c.low]],
                close: [[c.close]],
            }, [0], maxCandles);

            const el = divRef.current;
            if (el?.data?.[0]) {
                const xs = el.data[0].x;
                const hs = el.data[0].high;
                const ls = el.data[0].low;

                const start = Math.max(0, xs.length - VISIBLE_CANDLES);
                const winXs = xs.slice(start);
                const winHs = hs.slice(start);
                const winLs = ls.slice(start);

                const xMin = winXs[0];
                const xMax = new Date(
                    new Date(winXs[winXs.length - 1]).getTime() + tickMs
                ).toISOString();

                const maxY = Math.max(...winHs);
                const minY = Math.min(...winLs);
                const padY = (maxY - minY) * 0.15 || c.close * 0.02;

                Plotly.relayout(el, {
                    'xaxis.range':     [xMin, xMax],
                    'xaxis.autorange': false,
                    'yaxis.range':     [minY - padY, maxY + padY],
                    'yaxis.autorange': false,
                });
            }

            // Pass both price and synthetic ISO time up to the parent
            onTick?.(c.close, syntheticTime);
        }, tickMs);

        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running, tickMs, maxCandles, onTick]);

    return (
        <div
            ref={divRef}
            style={{ width: '100%', height: 380 }}
        />
    );
}
