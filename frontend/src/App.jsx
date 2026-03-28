import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout/Layout';
import DashboardView from './views/DashboardView';
import ModelAnalysisView from './views/ModelAnalysisView';
import NewsSentimentView from './views/NewsSentimentView';
import PortfolioView from './views/PortfolioView';
import { AppProvider } from './AppContext';

export default function App() {
  return (
    <AppProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#10131a', color: '#e1e2eb', border: '1px solid #424754', fontFamily: 'Inter' },
          success: { iconTheme: { primary: '#4ae176', secondary: '#10131a' } },
          error: { iconTheme: { primary: '#ffb4ab', secondary: '#10131a' } },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/analysis" element={<ModelAnalysisView />} />
          <Route path="/sentiment" element={<NewsSentimentView />} />
          <Route path="/portfolio" element={<PortfolioView />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}
