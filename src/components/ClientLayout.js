'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RefreshCw, Bell } from 'lucide-react';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const isLogin  = pathname === '/login';
  const [ready,    setReady]    = useState(false);
  const [userName, setUserName] = useState('');
  const [dept,     setDept]     = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    // [데모용] 로그인 없이 접근 허용 - 아래 줄 주석 처리
    // if (!token && !isLogin) { router.push('/login'); return; }
    setUserName(localStorage.getItem('userName') || '');
    setDept(localStorage.getItem('userDept') || '');
    setReady(true);
  }, [pathname, isLogin, router]);

  if (!ready) return null;
  if (isLogin) return children;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-2 flex-shrink-0 shadow-sm">
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="새로고침"
          >
            <RefreshCw size={15} />
          </button>
          <button className="p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="알림">
            <Bell size={15} />
          </button>
          <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userName?.charAt(0) || 'U'}
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-slate-700">{userName || '사용자'}</div>
              <div className="text-[10px] text-slate-400">{dept || '관리자'}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
