import Link from 'next/link';
import { Home, PlusCircle, Target, Wallet, FileText, TrendingUp, Menu, ReceiptText } from 'lucide-react';

export default function Navbar() {
    return (
        <>
            {/* Desktop Navbar (Hidden on mobile) */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200 hidden sm:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="bg-brand-600 p-2 rounded-xl group-hover:bg-brand-500 transition-colors">
                                    <Wallet className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-900 to-brand-600">
                                    RuiPYKigo
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-4">
                            <NavLink href="/" icon={<Home className="w-4 h-4" />} label="Home" />
                            <NavLink href="/goals" icon={<Target className="w-4 h-4" />} label="Goals" />
                            <NavLink href="/planning" icon={<TrendingUp className="w-4 h-4" />} label="Strategy" />
                            <NavLink href="/expenses" icon={<ReceiptText className="w-4 h-4" />} label="Expenses" />
                            <NavLink href="/wizard" icon={<PlusCircle className="w-4 h-4" />} label="Wizard" />
                            <NavLink href="/report" icon={<FileText className="w-4 h-4" />} label="Report" />

                            {/* Docs Dropdown */}
                            <div className="relative group/docs">
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-all">
                                    <FileText className="w-4 h-4" />
                                    <span className="hidden sm:inline">Docs</span>
                                </button>
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover/docs:block animate-in fade-in slide-in-from-top-2 duration-200">
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/User-Guide" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-600">User Guide</a>
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/Design-Document" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-600">Design Doc</a>
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/Project-Work-Log" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-600">Project Work Log</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Header (Hidden on desktop) */}
            <div className="fixed top-0 w-full z-50 glass border-b border-slate-200 sm:hidden flex items-center justify-between px-4 h-16">
                <Link href="/" className="flex items-center gap-2">
                    <div className="bg-brand-600 p-1.5 rounded-lg">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-900 to-brand-600">
                        RuiPYKigo
                    </span>
                </Link>
                {/* Mobile More Menu Overlay placeholder if needed */}
            </div>

            {/* Mobile Bottom Navigation (Hidden on desktop) */}
            <nav className="fixed bottom-0 w-full z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 sm:hidden">
                <div className="grid grid-cols-6 h-16">
                    <MobileNavLink href="/" icon={<Home className="w-4 h-4" />} label="首頁" />
                    <MobileNavLink href="/goals" icon={<Target className="w-4 h-4" />} label="目標" />
                    <MobileNavLink href="/planning" icon={<TrendingUp className="w-4 h-4" />} label="策略" />
                    <MobileNavLink href="/expenses" icon={<ReceiptText className="w-4 h-4" />} label="支出" />
                    <MobileNavLink href="/wizard" icon={<PlusCircle className="w-4 h-4" />} label="結算" />
                    <MobileNavLink href="/report" icon={<FileText className="w-4 h-4" />} label="報告" />
                    <div className="relative group/mobile-docs flex flex-col items-center justify-center">
                        <MobileNavLink href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/User-Guide" icon={<FileText className="w-4 h-4" />} label="文件" />
                    </div>
                </div>
            </nav>

        </>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-all active:scale-95"
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

function MobileNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-brand-600 active:scale-95 transition-all"
        >
            <div className="p-1">
                {icon}
            </div>
            <span>{label}</span>
        </Link>
    );
}

