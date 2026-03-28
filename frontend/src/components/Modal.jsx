import React, { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
    const [render, setRender] = useState(isOpen);
    const [animatingOut, setAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            setAnimatingOut(false);
        } else if (render) {
            setAnimatingOut(true);
            const timer = setTimeout(() => {
                setRender(false);
                setAnimatingOut(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, render]);

    if (!render) return null;

    return (
        <div 
            className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${animatingOut ? 'animate-backdrop-out' : 'animate-backdrop'}`} 
            onClick={() => {
                if (!animatingOut) onClose();
            }}
        >
            <div 
                className={`bg-[#0c0f19] border border-white/[0.1] rounded-2xl p-6 lg:p-8 ${maxWidth} w-full shadow-2xl relative ${animatingOut ? 'animate-blob-out' : 'animate-blob'}`} 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={() => {
                        if (!animatingOut) onClose();
                    }} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                {title && <h2 className="text-xl lg:text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h2>}
                {children}
            </div>
        </div>
    );
}
