import React, { useState } from 'react';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="bg-[#10131a] text-[#e1e2eb] min-h-screen">
            <TopNavbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
            
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            {/* Mobile Backdrop Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Canvas */}
            <main className="md:ml-72 mt-16 p-3 md:p-6 h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden custom-scrollbar bg-transparent">
                {children}
            </main>

            <Footer />
        </div>
    );
}
