import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';

export default function Footer() {
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const checkApiStatus = async () => {
        try {
            const res = await fetch('/api/health');
            if (res.ok) {
                toast.success('System is Healthy', { position: 'top-left' });
            } else {
                toast.error('System Degraded', { position: 'top-left' });
            }
        } catch {
            toast.error('System Unreachable', { position: 'top-left' });
        }
    };

    return (
        <>
            <footer className="fixed bottom-0 right-0 md:left-72 left-0 h-10 bg-[#0c0f19] flex items-center justify-between px-4 border-t border-white/[0.05] z-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-emerald-400 font-body text-[10px] uppercase tracking-widest font-bold">SYSTEM STABLE</span>
                    </div>
                    <span className="hidden sm:inline text-slate-500 font-body text-[9px] uppercase tracking-widest leading-tight">
                        Warning: Experimental Tool. Do not use for real financial decisions.
                    </span>
                </div>
                
                <div className="flex items-center gap-6 hidden sm:flex">
                    <button onClick={checkApiStatus} className="text-slate-500 hover:text-emerald-400 transition-colors font-body text-[10px] uppercase tracking-widest font-bold">API Status</button>
                    <button onClick={() => setShowPrivacy(true)} className="text-slate-500 hover:text-white transition-colors font-body text-[10px] uppercase tracking-widest font-bold">Privacy Policy</button>
                    <button onClick={() => setShowTerms(true)} className="text-slate-500 hover:text-white transition-colors font-body text-[10px] uppercase tracking-widest font-bold">Terms</button>
                </div>
            </footer>

            {/* Privacy Popup */}
            <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
                <div className="text-sm text-slate-400 space-y-4">
                    <p>This application does not collect, store, or share personal financial data. All simulated portfolio data is kept locally.</p>
                    <p>All copyrights and intellectual property rights related to this predictive analytics engine and platform belong exclusively to <strong>Pranav C</strong>.</p>
                </div>
            </Modal>

            {/* Terms Popup */}
            <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Service">
                <div className="text-sm text-slate-400 space-y-4">
                    <p><strong>Disclaimer:</strong> This tool is built strictly for experimental and educational purposes. The predictions, news sentiments, and portfolio simulator provided do not constitute financial advice. Do not pursue or make real trades or purchase stock based on this tool.</p>
                    <p>All copyrights and intellectual property to the algorithm, platform structure, and proprietary predictive weighting system are reserved to <strong>Pranav C</strong>.</p>
                </div>
            </Modal>
        </>
    );
}
