from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
import zipfile
import json
import yfinance as yf
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
import os
import requests

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'Latest_stock_price_model.keras')
NEWS_API_KEY = os.environ.get('NEWS_API_KEY', 'db66d6f0a9eb427aa1e69437b75f6f34')

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def fetch_stock_data(ticker, start, end):
    # NOTE: This comment is here to trigger a new Git commit/redeploy on Railway.
    #       (Railway sometimes lags detecting changes; pushing anything forces
    #       a rebuild so the latest code is running.)
    # yfinance sometimes ignores the requested start/end range, returning the
    # full history.  To ensure consistency between local and deployed runs we
    # explicitly trim the DataFrame by the provided dates.
    data = yf.download(ticker, start=start, end=end, progress=False)
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)
    # guarantee datetime index and slice to requested window
    try:
        data.index = pd.to_datetime(data.index)
        # pandas slicing is inclusive of start and end when using .loc
        data = data.loc[start:end]
    except Exception:
        # if conversion fails, just return what yfinance gave us
        pass
    return data

def get_model():
    """Lazy-load the Keras model with robust fallback.

    Strategy
    --------
    1. Direct load  : keras.models.load_model(MODEL_PATH)          [fastest]
    2. Extract+load : copy the .keras archive to a system temp dir,
                      then call load_model on *that* path.  Helps when
                      Railway/Docker mounts the work-dir read-only or when
                      TF cannot open a zip from certain filesystem paths.
    The model is cached on the function object after the first successful load.
    """
    if getattr(get_model, 'model', None) is not None:
        return get_model.model

    # ── Strategy 1: direct load ──────────────────────────────────────────────
    try:
        m = load_model(MODEL_PATH, compile=False)
        get_model.model = m
        get_model.loaded_with = 'load_model_direct'
        app.logger.info('Model loaded via direct load_model()')
        return m
    except Exception as e:
        app.logger.warning('Direct load_model failed: %s', e)

    # ── Strategy 2: extract archive to temp dir, reload ──────────────────────
    # The .keras file is a ZIP archive.  Some environments (Railway, Docker)
    # have trouble letting TF read ZIPs from the mounted working directory.
    # Extracting first avoids this class of error entirely.
    try:
        import shutil, tempfile as _tmpmod
        tmp_dir = _tmpmod.mkdtemp(prefix='keras_model_')
        try:
            # Reconstruct a proper .keras file in the temp dir
            tmp_keras = os.path.join(tmp_dir, 'model.keras')
            shutil.copy2(MODEL_PATH, tmp_keras)
            m = load_model(tmp_keras, compile=False)
            get_model.model = m
            get_model.loaded_with = 'load_model_temp_copy'
            app.logger.info('Model loaded via temp-copy strategy')
            return m
        finally:
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception:
                pass
    except Exception as e2:
        app.logger.error('Temp-copy load_model also failed: %s', e2)
        raise RuntimeError(
            f'Could not load model from {MODEL_PATH}. '
            f'Direct error: see logs. Temp-copy error: {e2}'
        )


def compute_rsi(series, period=14):
    delta  = series.diff()
    gain   = delta.clip(lower=0)
    loss   = -delta.clip(upper=0)
    ag     = gain.rolling(period).mean()
    al     = loss.rolling(period).mean()
    rs     = ag / al
    return 100 - (100 / (1 + rs))


def fetch_news_sentiment(ticker):
    """Fetch recent news, return (articles, score -1..+1, verdict)."""
    BULLISH = ['surge', 'soar', 'rally', 'gain', 'profit', 'beat', 'record', 'rise',
               'jump', 'upgrade', 'buy', 'strong', 'growth', 'outperform', 'positive',
               'expansion', 'partnership', 'launch', 'boom', 'earnings beat']
    BEARISH  = ['fall', 'drop', 'plunge', 'loss', 'miss', 'cut', 'downgrade', 'decline',
                'crash', 'sell', 'warn', 'investigation', 'lawsuit', 'fine', 'weak',
                'layoff', 'recall', 'scandal', 'fraud', 'regulation', 'penalty']
    try:
        url = (
            f"https://newsapi.org/v2/everything"
            f"?q={ticker}+stock"
            f"&sortBy=publishedAt&pageSize=15&language=en"
            f"&apiKey={NEWS_API_KEY}"
        )
        resp = requests.get(url, timeout=8)
        data = resp.json()
        if data.get('status') != 'ok':
            return [], 0.0, 'neutral'

        articles  = []
        bull_total, bear_total = 0, 0
        for a in data.get('articles', []):
            text = ((a.get('title') or '') + ' ' + (a.get('description') or '')).lower()
            b = sum(1 for w in BULLISH if w in text)
            r = sum(1 for w in BEARISH if w in text)
            bull_total += b
            bear_total += r
            articles.append({
                'title':        a.get('title'),
                'description':  a.get('description'),
                'url':          a.get('url'),
                'published_at': a.get('publishedAt'),
                'source':       a.get('source', {}).get('name'),
                'sentiment':    'bullish' if b > r else ('bearish' if r > b else 'neutral'),
            })

        total = bull_total + bear_total
        if total == 0:
            return articles, 0.0, 'neutral'
        score = (bull_total - bear_total) / total
        verdict = 'bullish' if score > 0.15 else ('bearish' if score < -0.15 else 'neutral')
        return articles, round(score, 3), verdict
    except Exception:
        return [], 0.0, 'neutral'


def generate_reasoning(data, future_preds_scaled, scaler,
                       last_close, news_articles, news_score, news_verdict):
    """
    Build a balanced, realistic AI reasoning report.

    Key design decisions:
    ─────────────────────
    1.  LSTM 5-day signal  : Use only days 1-5 of the LSTM forecast (before
        compound error corrupts it) as the model's directional signal.
    2.  Momentum projection : Use recent 30-day momentum (statistically sound)
        to estimate the expected 30-day price target.
    3.  Combined verdict    : LSTM-direction × 35%  +  Technical × 35%  +  News × 30%
        All three must agree for a strong call; otherwise "neutral / mixed".
    """
    close = data['Close']

    # ── Technical indicators ──────────────────────────────────────────────────
    ma30  = float(close.rolling(30).mean().iloc[-1])  if len(close) >= 30  else None
    ma100 = float(close.rolling(100).mean().iloc[-1]) if len(close) >= 100 else None
    rsi   = (lambda s: float(s.iloc[-1]) if not pd.isna(s.iloc[-1]) else None)(compute_rsi(close))
    mom30 = float(((close.iloc[-1] - close.iloc[-30]) / close.iloc[-30]) * 100) if len(close) >= 30 else None
    vol30 = float(close.iloc[-30:].std())                                         if len(close) >= 30 else None

    # ── LSTM signal: use Days 1-5 only (avoids compound-error drift) ─────────
    # future_preds_scaled is in normalised space; inverse-transform Days 0-4
    early_preds = scaler.inverse_transform(future_preds_scaled[:5])
    early_avg   = float(np.mean(early_preds))
    lstm_5d_pct = ((early_avg - last_close) / last_close) * 100
    # Normalise to -1 … +1 (cap at ±15% for 5-day window)
    lstm_signal = max(-1.0, min(1.0, lstm_5d_pct / 15.0))

    # ── Technical signal ─────────────────────────────────────────────────────
    tech_signal, tech_n = 0.0, 0
    if rsi is not None:
        tech_signal += -(rsi - 50) / 50.0;  tech_n += 1
    if ma30 and ma100:
        tech_signal += (1.0 if ma30 > ma100 else -1.0);  tech_n += 1
    if mom30 is not None:
        tech_signal += max(-1.0, min(1.0, mom30 / 30.0));  tech_n += 1
    if tech_n:
        tech_signal /= tech_n

    # ── Combined signal ───────────────────────────────────────────────────────
    combined = (lstm_signal * 0.35) + (tech_signal * 0.35) + (news_score * 0.30)
    if   combined >  0.08: verdict, direction = 'bullish', 'rise'
    elif combined < -0.08: verdict, direction = 'bearish', 'fall'
    else:                  verdict, direction = 'neutral',  'remain stable'

    # ── Momentum-based 30-day price estimate (realistic, avoids LSTM drift) ──
    # Annualised daily trend extrapolated 30 days
    if mom30 is not None:
        daily_trend   = mom30 / 30.0               # avg daily % change
        # Scale back by RSI congestion factor (overbought stocks tend to slow)
        if rsi and rsi > 65:
            daily_trend *= 0.6
        elif rsi and rsi < 35:
            daily_trend *= 1.2
        # News nudge: ±0.3% per 100 news-score points
        daily_trend += news_score * 0.3
        proj_30d_pct  = daily_trend * 30
        proj_price    = last_close * (1 + proj_30d_pct / 100)
    else:
        proj_30d_pct = 0.0
        proj_price   = last_close

    # ── Build factors list ────────────────────────────────────────────────────
    factors = []

    # LSTM factor (honest 5-day signal)
    lstm_dir_word = 'rise' if lstm_5d_pct >= 0 else 'fall'
    factors.append(
        f"LSTM Model (5-day signal): Projects a {lstm_dir_word} of {abs(lstm_5d_pct):.1f}% in the "
        f"near-term (days 1–5). Note: 30-day LSTM extrapolation is used for chart visualization only — "
        f"beyond ~7 days, compound error from the sliding window becomes significant and is not used for verdicts."
    )

    # News factor
    bc = sum(1 for a in news_articles if a['sentiment'] == 'bullish')
    rc = sum(1 for a in news_articles if a['sentiment'] == 'bearish')
    if news_articles:
        factors.append(
            f"News Sentiment ({len(news_articles)} articles): {bc} Bullish · {rc} Bearish. "
            f"Overall news signal is {news_verdict.upper()} (score: {news_score:+.2f})."
        )

    # RSI
    if rsi is not None:
        if   rsi > 70: factors.append(f"RSI {rsi:.1f}: Overbought (>70) — possible short-term pullback pressure.")
        elif rsi < 30: factors.append(f"RSI {rsi:.1f}: Oversold (<30) — possible rebound opportunity.")
        else:           factors.append(f"RSI {rsi:.1f}: Neutral zone (30–70) — no extreme pressure.")

    # MA trend
    if ma30 and ma100:
        sign = "ABOVE (Golden Cross 🟢)" if ma30 > ma100 else "BELOW (potential Death Cross ⚠️)"
        factors.append(f"MA Trend: 30d MA (${ma30:.2f}) is {sign} 100d MA (${ma100:.2f}).")

    # Momentum
    if mom30 is not None:
        dw = 'gained' if mom30 >= 0 else 'lost'
        factors.append(f"30-day Momentum: Asset has {dw} {abs(mom30):.1f}% in the past month.")

    # Volatility
    if vol30:
        factors.append(f"30-day Volatility: ±${vol30:.2f}. Forecasts beyond 7–10 days carry higher uncertainty.")

    # Momentum-based projection note
    change_str = f"+{proj_30d_pct:.1f}%" if proj_30d_pct >= 0 else f"{proj_30d_pct:.1f}%"
    factors.append(
        f"Momentum-based 30-day estimate: {change_str} (target ~${proj_price:.2f}). "
        f"This is based on recent trend + RSI adjustment + news sentiment, not raw LSTM output."
    )

    # ── Summary ───────────────────────────────────────────────────────────────
    summary = (
        f"Combined signal (LSTM 5d direction 35% + Technical 35% + News 30%) is "
        f"\"{verdict.upper()}\". Momentum-based 30-day price estimate: {change_str} "
        f"(~${proj_price:.2f}) — a statistically grounded projection that avoids LSTM compound-error drift."
    )

    return {
        'verdict':              verdict,
        'direction':            direction,
        'pct_change':           round(proj_30d_pct, 2),       # momentum-based (shown to user)
        'price_target':         round(proj_price, 2),
        'lstm_5d_pct':          round(lstm_5d_pct, 2),        # informational
        'news_sentiment':       news_verdict,
        'news_score':           news_score,
        'combined_signal':      round(combined, 3),
        'summary':              summary,
        'factors':              factors,
        'indicators': {
            'rsi':              round(rsi, 2)   if rsi   else None,
            'ma_30d':           round(ma30, 4)  if ma30  else None,
            'ma_100d':          round(ma100, 4) if ma100 else None,
            'momentum_30d_pct': round(mom30, 2) if mom30 else None,
            'volatility_30d':   round(vol30, 4) if vol30 else None,
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/stock-data', methods=['GET'])
def get_stock_data():
    ticker = request.args.get('ticker', 'GOOG')
    start  = request.args.get('start', '2004-01-01')
    end    = request.args.get('end',   datetime.now().strftime('%Y-%m-%d'))
    try:
        data = fetch_stock_data(ticker, start, end)
        if data.empty:
            return jsonify({'error': 'No data found for the given ticker / date range.'}), 404
        data = data.reset_index()
        data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
        for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
            if col in data.columns:
                data[col] = data[col].round(4)
        records = data[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']].to_dict(orient='records')
        return jsonify({'ticker': ticker, 'data': records})
    except Exception as e:
        # include short traceback when debugging is enabled via env var
        if os.environ.get('SHOW_MODEL_TRACE') == '1':
            import traceback
            tb = traceback.format_exc()
            # limit size to avoid huge responses
            return jsonify({'error': str(e), 'traceback': tb.splitlines()[-20:]}), 500
        return jsonify({'error': str(e)}), 500


@app.route('/api/moving-average', methods=['GET'])
def get_moving_average():
    ticker  = request.args.get('ticker', 'GOOG')
    start   = request.args.get('start', '2004-01-01')
    end     = request.args.get('end',   datetime.now().strftime('%Y-%m-%d'))
    windows = [int(w) for w in request.args.get('windows', '100,200,250').split(',') if w.strip().isdigit()]
    try:
        data = fetch_stock_data(ticker, start, end)
        if data.empty:
            return jsonify({'error': 'No data found.'}), 404
        result = {
            'dates': [d.strftime('%Y-%m-%d') for d in data.index],
            'close': [round(float(v), 4) for v in data['Close']],
            'mas':   {}
        }
        for w in windows:
            ma = data['Close'].rolling(w).mean()
            result['mas'][str(w)] = [None if pd.isna(v) else round(float(v), 4) for v in ma]
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict', methods=['GET'])
def get_prediction():
    ticker = request.args.get('ticker', 'GOOG')
    start  = request.args.get('start', '2004-01-01')
    end    = request.args.get('end',   datetime.now().strftime('%Y-%m-%d'))
    try:
        data = fetch_stock_data(ticker, start, end)
        if data.empty:
            return jsonify({'error': 'No data found.'}), 404

        splitting_len = int(len(data) * 0.7)

        # ── Fit scaler on the FULL dataset (matches training normalization) ──
        # The LSTM model was trained with a scaler derived from all Close
        # prices. Using only the test-split values produces a different
        # min/max, making inverse-transformed predictions land in the wrong
        # price range entirely.
        scaler      = MinMaxScaler(feature_range=(0, 1))
        scaled_full = scaler.fit_transform(data['Close'].values.reshape(-1, 1))

        # Defensive check: ensure there are enough test-set points for at
        # least one 100-step sliding window.
        test_len = len(data) - splitting_len
        if test_len <= 100:
            return jsonify({'error': 'Not enough historical data to run prediction. Please request a larger date range or a ticker with more history (need at least 101 test-set closing prices).'}), 400

        # ── Historical test-set predictions ──────────────────────────────────
        # Windows span the train→test boundary: window i starts at
        # (splitting_len + i - 100) so the first window uses 100 training
        # points, and subsequent ones progressively include more test data.
        x_data, y_data = [], []
        for i in range(splitting_len, len(scaled_full)):
            if i < 100:
                continue  # not enough look-back (shouldn't happen for typical date ranges)
            x_data.append(scaled_full[i - 100:i])
            y_data.append(scaled_full[i])
        x_data = np.array(x_data)
        y_data = np.array(y_data)

        if len(x_data) == 0:
            return jsonify({'error': 'Unable to construct sliding windows — try a wider date range.'}), 400

        # Use the shared loader to obtain the Keras model.
        model = get_model()
        predictions = model.predict(x_data)
        inv_pre     = scaler.inverse_transform(predictions)
        inv_y_test  = scaler.inverse_transform(y_data)

        # ── Future 30-day sliding-window forecast ─────────────────────────────
        # Seed with the last 100 points of the full scaled series so the
        # model sees the most recent price context (not just the test subset).
        future_preds_scaled = []
        current_batch = scaled_full[-100:].reshape(1, 100, 1)
        for _ in range(30):
            nxt = model.predict(current_batch, verbose=0)
            future_preds_scaled.append(nxt[0])
            current_batch = np.append(current_batch[:, 1:, :], nxt.reshape(1, 1, 1), axis=1)
        future_preds_scaled_arr = np.array(future_preds_scaled)   # shape (30, 1)
        inv_future_raw = scaler.inverse_transform(future_preds_scaled_arr).reshape(-1)

        # ── Define key values before momentum/blend calculations ────────────
        last_close   = float(data['Close'].iloc[-1])
        last_date    = data.index[-1]
        pred_index   = data.index[splitting_len:]

        # ── Build a momentum-based projection as the realistic future baseline ──
        # Use 30-day momentum from historical data, adjusted by RSI congestion.
        close_series = data['Close']
        if len(close_series) >= 30:
            mom30_raw  = float(((close_series.iloc[-1] - close_series.iloc[-30]) / close_series.iloc[-30]) * 100)
            daily_rate = mom30_raw / 30.0
            rsi_series = compute_rsi(close_series)
            rsi_val    = float(rsi_series.iloc[-1]) if not pd.isna(rsi_series.iloc[-1]) else 50.0
            # Dampen: very overbought → slow down; oversold → allow acceleration
            if rsi_val > 70:   daily_rate *= 0.5
            elif rsi_val < 30: daily_rate *= 1.1
        else:
            daily_rate = 0.0

        mom_proj = np.array([last_close * (1 + daily_rate / 100 * (t + 1)) for t in range(30)])

        # ── Blend: LSTM weight decreases from 0.5 → 0.1 over 30 days (trust fades) ──
        lstm_weights = np.linspace(0.5, 0.1, 30)
        mom_weights  = 1.0 - lstm_weights
        inv_future   = lstm_weights * inv_future_raw + mom_weights * mom_proj

        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=30)


        # ── News sentiment ────────────────────────────────────────────────────
        news_articles, news_score, news_verdict = fetch_news_sentiment(ticker)

        # ── Reasoning (uses 5-day LSTM signal + momentum, not 30d raw LSTM) ──
        reasoning = generate_reasoning(
            data, future_preds_scaled_arr, scaler,
            last_close, news_articles, news_score, news_verdict
        )

        return jsonify({
            'dates':            [d.strftime('%Y-%m-%d') for d in pred_index],
            'original':         [round(float(v), 4) for v in inv_y_test.reshape(-1)],
            'predicted':        [round(float(v), 4) for v in inv_pre.reshape(-1)],
            'future_dates':     [d.strftime('%Y-%m-%d') for d in future_dates],
            'future_predicted': [round(float(v), 4) for v in inv_future.reshape(-1)],
            'reasoning':        reasoning,
            'news_articles':    news_articles,
            'close_full': {
                'dates':  [d.strftime('%Y-%m-%d') for d in pred_index],
                'values': [round(float(v), 4) for v in data['Close'].iloc[splitting_len:]]
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/news', methods=['GET'])
def get_news():
    ticker = request.args.get('ticker', 'GOOG')
    try:
        articles, score, verdict = fetch_news_sentiment(ticker)
        return jsonify({'ticker': ticker, 'articles': articles,
                        'sentiment_score': score, 'verdict': verdict})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Debug endpoint: returns file size and archive members for the .keras model file."""
    try:
        if not os.path.exists(MODEL_PATH):
            return jsonify({'error': 'model file not found', 'path': MODEL_PATH}), 404
        size = os.path.getsize(MODEL_PATH)
        members = []
        try:
            with zipfile.ZipFile(MODEL_PATH, 'r') as z:
                for n in z.namelist():
                    try:
                        info = z.getinfo(n)
                        members.append({'name': n, 'size': info.file_size})
                    except Exception:
                        members.append({'name': n})
        except Exception as e:
            members = [{'error': 'not a zip archive or cannot read members', 'detail': str(e)}]
        return jsonify({'path': MODEL_PATH, 'size_bytes': size, 'members': members})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/model-debug', methods=['GET'])
def model_debug():
    """Deep debug: load the model, list layers and weight stats, and return
    a few sample predictions (inverse-transformed) to compare against the
    historical close values. Accepts `ticker`, `start`, `end` query params.
    """
    ticker = request.args.get('ticker', 'AAPL')
    start = request.args.get('start', '2015-01-01')
    end = request.args.get('end', datetime.now().strftime('%Y-%m-%d'))
    try:
        # load model using the shared get_model helper so we exercise the same
        # code path as /api/predict.  After loading we can check how it was
        # instantiated (via load_model() or manual rebuild).
        model = get_model()
        load_mode = getattr(get_model, 'loaded_with', 'unknown')

        # gather layer info
        layers = []
        for layer in model.layers:
            w_list = layer.weights
            weights = []
            for w in w_list:
                try:
                    arr = w.numpy()
                    weights.append({'shape': list(arr.shape), 'mean_abs': float(abs(arr).mean())})
                except Exception:
                    weights.append({'shape': 'unknown'})
            layers.append({'name': layer.name, 'class': layer.__class__.__name__, 'n_weights': len(w_list), 'weights': weights})

        # prepare sample prediction using the same preprocessing
        data = fetch_stock_data(ticker, start, end)
        if data.empty:
            return jsonify({'error': 'no data for provided ticker/range'}), 404
        original_len = len(data)
        # note: after slicing we may have trimmed data; report length and sample dates
        first_dates = data.index[:5].astype(str).tolist()
        last_dates  = data.index[-5:].astype(str).tolist()
        data = data.reset_index()
        x_test_df = data['Close']
        scaler = MinMaxScaler(feature_range=(0,1))
        scaled_data = scaler.fit_transform(x_test_df.values.reshape(-1,1))

        # log scaler bounds and a few scaled samples so we can inspect
        scaler_info = {
            'data_min': scaler.data_min_.tolist() if hasattr(scaler, 'data_min_') else None,
            'data_max': scaler.data_max_.tolist() if hasattr(scaler, 'data_max_') else None,
            'data_range': scaler.data_range_.tolist() if hasattr(scaler, 'data_range_') else None,
            'scaled_head': scaled_data[:5].reshape(-1).tolist(),
            'scaled_tail': scaled_data[-5:].reshape(-1).tolist(),
        }

        # build x_data as in predict route
        x_data = []
        for i in range(100, len(scaled_data)):
            x_data.append(scaled_data[i-100:i])
        x_data = np.array(x_data)
        sample_preds = None
        raw_preds = None
        if x_data.size:
            try:
                raw = model.predict(x_data[:5])
                raw_preds = raw.reshape(-1).tolist()
                inv = scaler.inverse_transform(raw).reshape(-1).tolist()
                sample_preds = inv
            except Exception as e:
                sample_preds = {'error': str(e)}

        return jsonify({
            'model_layers': layers,
            'loaded_with': load_mode,
            'data_length': original_len,
            'first_dates': first_dates,
            'last_dates': last_dates,
            'scaler': scaler_info,
            'raw_predictions': raw_preds,
            'sample_predictions': sample_preds
        })
    except Exception as e:
        import traceback
        tb = traceback.format_exc().splitlines()[-40:]
        return jsonify({'error': str(e), 'traceback': tb}), 500


if __name__ == '__main__':
    print("🚀 Stock Predictor API running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
