import React from 'react';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children }) {
    return (
        <div className="bg-[#10131a] text-[#e1e2eb] overflow-hidden min-h-screen">
            <TopNavbar />
            <Sidebar />

            {/* Main Content Canvas */}
            <main className="md:ml-72 mt-16 p-6 h-[calc(100vh-64px-32px)] overflow-y-auto custom-scrollbar bg-transparent">
                {children}
            </main>

            <Footer />
        </div>
    );
}
