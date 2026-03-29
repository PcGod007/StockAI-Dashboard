import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

// Responsive chart height: smaller on mobile, full on desktop
const chartH = () => window.innerWidth <= 480 ? 260 : window.innerWidth <= 768 ? 330 : window.innerWidth <= 1024 ? 390 : 460;
const isMobile = () => window.innerWidth <= 768;

const LAYOUT_BASE = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', color: '#8b949e', size: 12 },
    margin: { l: 60, r: 20, t: 20, b: 80 },
    xaxis: {
        gridcolor: 'rgba(56,139,253,.08)',
        linecolor: 'rgba(56,139,253,.15)',
        tickcolor: 'rgba(56,139,253,.15)',
        zerolinecolor: 'rgba(56,139,253,.1)',
    },
    yaxis: {
        gridcolor: 'rgba(56,139,253,.08)',
        linecolor: 'rgba(56,139,253,.15)',
        tickcolor: 'rgba(56,139,253,.15)',
        zerolinecolor: 'rgba(56,139,253,.1)',
        tickprefix: '$',
    },
    legend: {
        bgcolor: 'rgba(10,22,40,.7)',
        bordercolor: 'rgba(56,139,253,.2)',
        borderwidth: 1,
        font: { size: 11 },
        orientation: 'h',
        x: 0.5,
        xanchor: 'center',
        y: -0.12,
        yanchor: 'top',
    },
    hovermode: 'x unified',
    spikedistance: -1,
    hoverlabel: {
        bgcolor: '#0a1628',
        bordercolor: 'rgba(56,139,253,.5)',
        font: { family: 'Inter, sans-serif', color: '#e6edf3', size: 12 },
    },
};

const CONFIG = {
    displayModeBar: true,
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
};

const MA_COLORS = {
    100: '#388bfd',
    200: '#bc8cff',
    250: '#d29922',
};

/* ──────────────── Mobile touch-outside dismiss hook ────── */
function useMobileTouchDismiss(ref) {
    useEffect(() => {
        // Only wire up on actual touch devices
        if (!('ontouchstart' in window)) return;

        let restoreTimer = null;

        const hideSpike = () => {
            if (!ref.current) return;
            // 1. Immediately hide hover layer via DOM for instant visual effect
            const hoverlayer = ref.current.querySelector('g.hoverlayer');
            if (hoverlayer) hoverlayer.style.display = 'none';
            // Also target any stray spike line elements outside hoverlayer
            ref.current.querySelectorAll('line.spikeline').forEach(el => { el.style.display = 'none'; });
        };

        const showSpike = () => {
            if (!ref.current) return;
            const hoverlayer = ref.current.querySelector('g.hoverlayer');
            if (hoverlayer) hoverlayer.style.display = '';
            ref.current.querySelectorAll('line.spikeline').forEach(el => { el.style.display = ''; });
        };

        const handleTouchStart = (e) => {
            if (!ref.current) return;

            if (ref.current.contains(e.target)) {
                // Touch inside chart — restore hover immediately
                clearTimeout(restoreTimer);
                showSpike();
                try { Plotly.relayout(ref.current, { hovermode: 'x unified' }); } catch (_) {}
                return;
            }

            // Touch outside — hide spike instantly, then let Plotly reset state
            hideSpike();
            clearTimeout(restoreTimer);
            try {
                Plotly.relayout(ref.current, { hovermode: false }).then(() => {
                    // Restore hovermode after 500ms so the next in-chart touch works
                    restoreTimer = setTimeout(() => {
                        showSpike();
                        if (ref.current) {
                            Plotly.relayout(ref.current, { hovermode: 'x unified' }).catch(() => {});
                        }
                    }, 500);
                });
            } catch (_) { /* chart not yet initialised */ }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            clearTimeout(restoreTimer);
        };
    }, [ref]);
}

/* ──────────────── Moving Average Chart ──────────────────── */
export function MAChart({ data, windows }) {
    const ref = useRef(null);
    useMobileTouchDismiss(ref);

    useEffect(() => {
        if (!ref.current || !data) return;

        const traces = [
            {
                x: data.dates,
                y: data.close,
                name: 'Close Price',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#e6edf3', width: 1.5 },
                opacity: 0.6,
            },
            ...windows.map(w => ({
                x: data.dates,
                y: data.mas[String(w)],
                name: `MA ${w}d`,
                type: 'scatter',
                mode: 'lines',
                line: { color: MA_COLORS[w] || '#3fb950', width: 2 },
                connectgaps: false,
            })),
        ];

        Plotly.react(ref.current, traces, {
            ...LAYOUT_BASE,
            title: {
                text: `Close Price + Moving Average${windows.length > 1 ? 's' : ''}`,
                font: { family: 'Space Grotesk, sans-serif', size: 15, color: '#e6edf3' },
            },
        }, CONFIG);
    }, [data, windows]);

    return <div ref={ref} style={{ width: '100%', height: chartH() }} />;
}

/* ──────────────── Prediction Chart ─────────────────────── */
export function PredictionChart({ data }) {
    const ref = useRef(null);
    useMobileTouchDismiss(ref);

    useEffect(() => {
        if (!ref.current || !data) return;

        const traces = [
            {
                x: data.close_full.dates,
                y: data.close_full.values,
                name: 'Full Close Price',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#8b949e', width: 1.2 },
                opacity: 0.5,
            },
            {
                x: data.dates,
                y: data.original,
                name: 'Original (Test)',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#388bfd', width: 2 },
                connectgaps: false,
            },
            {
                x: data.dates,
                y: data.predicted,
                name: 'AI Predicted (Test)',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#3fb950', width: 2, dash: 'dot' },
                fill: 'tonexty',
                fillcolor: 'rgba(63,185,80,.06)',
                connectgaps: false,
            },
            {
                x: data.future_dates,
                y: data.future_predicted,
                name: 'Future Forecast (30d)',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#bc8cff', width: 3 },
                marker: { size: 4 },
                connectgaps: true,
            },
        ];

        // Compute x-axis range to span ALL traces (historical + future)
        const allDates = [
            ...(data.close_full?.dates || []),
            ...(data.dates || []),
            ...(data.future_dates || []),
        ];
        const xRange = allDates.length > 0
            ? [allDates[0], allDates[allDates.length - 1]]
            : undefined;

        Plotly.react(ref.current, traces, {
            ...LAYOUT_BASE,
            title: {
                text: 'Original vs Predicted Close Price (LSTM)',
                font: { family: 'Space Grotesk, sans-serif', size: 15, color: '#e6edf3' },
            },
            xaxis: {
                ...LAYOUT_BASE.xaxis,
                ...(xRange ? { range: xRange } : {}),
                type: 'date',
            },
            yaxis: {
                ...LAYOUT_BASE.yaxis,
                autorange: true,
                rangemode: 'normal',
            },
        }, CONFIG);
    }, [data]);

    return <div ref={ref} style={{ width: '100%', height: 460 }} />;
}

/* ──────────────── Overview Candlestick Chart ────────────── */
export function OverviewChart({ data, defaultZoomDays = 252 }) {
    const ref = useRef(null);
    useMobileTouchDismiss(ref);

    useEffect(() => {
        if (!ref.current || !data || data.length === 0) return;

        const traces = [
            {
                x: data.map(r => r.Date),
                close: data.map(r => r.Close),
                open: data.map(r => r.Open),
                high: data.map(r => r.High),
                low: data.map(r => r.Low),
                type: 'candlestick',
                name: 'OHLC',
                increasing: { line: { color: '#3fb950' }, fillcolor: 'rgba(63,185,80,.6)' },
                decreasing: { line: { color: '#f85149' }, fillcolor: 'rgba(248,81,73,.6)' },
            },
        ];

        const visibleData = data.slice(Math.max(0, data.length - defaultZoomDays));
        const allLows = visibleData.map(r => r.Low).filter(v => v != null);
        const allHighs = visibleData.map(r => r.High).filter(v => v != null);

        let yaxisConfig = { ...LAYOUT_BASE.yaxis, autorange: true };
        if (allLows.length > 0 && allHighs.length > 0) {
            const min_y = Math.min(...allLows);
            const max_y = Math.max(...allHighs);
            const padding = ((max_y - min_y) * 0.1) || (min_y * 0.05);
            yaxisConfig = {
                ...LAYOUT_BASE.yaxis,
                autorange: false,
                range: [Math.max(0, min_y - padding), max_y + padding]
            };
        }

        const mobile = isMobile();

        Plotly.react(ref.current, traces, {
            ...LAYOUT_BASE,
            // On mobile: remove title (card header already says "Price Action") and
            // give the rangeselector 50px of top breathing room so it doesn't overlap data
            margin: mobile
                ? { l: 45, r: 10, t: 50, b: 55 }
                : LAYOUT_BASE.margin,
            title: mobile
                ? { text: '' }
                : { text: 'Price Overview (Candlestick)', font: { family: 'Space Grotesk, sans-serif', size: 15, color: '#e6edf3' } },
            // Hide legend on mobile (single OHLC trace; card header provides context)
            legend: mobile ? { visible: false } : LAYOUT_BASE.legend,
            xaxis: {
                ...LAYOUT_BASE.xaxis,
                // Hide weekends and after-hours to prevent large blank gaps in intraday charts
                rangebreaks: [
                    { pattern: 'day of week', bounds: ['sat', 'mon'] }, // Hide Saturday to Monday morning
                    { pattern: 'hour', bounds: [16, 9.5] }              // Hide 4:00 PM to 9:30 AM
                ],

                // Rangeslider hidden on mobile — redundant with pinch-zoom & rangeselector
                rangeslider: mobile
                    ? { visible: false }
                    : { visible: true, bgcolor: 'rgba(15,31,56,.6)', bordercolor: 'rgba(56,139,253,.15)', thickness: 0.07 },
                // Default view viewport sizing
                range: [
                    data[Math.max(0, data.length - defaultZoomDays)].Date,
                    data[data.length - 1].Date
                ],
                type: 'date',
            },
            yaxis: yaxisConfig,
        }, {
            ...CONFIG,
            // Hide modebar on mobile — removes camera/zoom/pan icons that clash with rangeselector
            displayModeBar: !mobile,
        });
    }, [data, defaultZoomDays]);

    return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}
