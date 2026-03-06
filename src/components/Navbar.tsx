import Link from 'next/link';
import { Home, PlusCircle, Target, Wallet, FileText } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200">
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
                        <NavLink href="/" icon={<Home className="w-4 h-4" />} label="Dashboard" />
                        <NavLink href="/report" icon={<FileText className="w-4 h-4" />} label="Report" />
                        <NavLink href="/wizard" icon={<PlusCircle className="w-4 h-4" />} label="Update" />
                        <NavLink href="/goals" icon={<Target className="w-4 h-4" />} label="Goals" />
                    </div>
                </div>
            </div>
        </nav>
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
