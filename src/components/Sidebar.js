'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Monitor, Factory, Package,
  ShieldCheck, Settings, ChevronDown, ChevronRight,
  LogOut, Menu, X, ShoppingBag
} from 'lucide-react';

const MENU = [
  { name: '대시보드',    icon: LayoutDashboard, path: '/dashboard' },
  { name: '작업스테이션', icon: Monitor,          path: '/workstation' },
  {
    name: '영업 관리', icon: ShoppingBag,
    sub: [
      { name: '제품 입고 등록', path: '/sales/register' },
    ]
  },
  {
    name: '생산 관리', icon: Factory,
    sub: [
      { name: '작업 현황',       path: '/production/status'       },
      { name: '완료 작업 조회',   path: '/production/completed'    },
      { name: '작업 계획',       path: '/production/plan'         },
      { name: '공정 순서 관리',   path: '/production/process-flow' },
      { name: '작업 이슈 현황',   path: '/production/issues'       },
    ]
  },
  {
    name: '자재 관리', icon: Package,
    sub: [
      { name: '자재 현황',          path: '/material/inventory'   },
      { name: '외주 작업 등록/현황', path: '/material/outsourcing' },
    ]
  },
  {
    name: '품질 관리', icon: ShieldCheck,
    sub: [
      { name: '런시트',     path: '/quality/runsheet'   },
      { name: '부적합 현황', path: '/quality/nc'          },
      { name: '표준 관리',  path: '/quality/standard'   },
      { name: '계측기 관리', path: '/quality/gauge'       },
      { name: '설비 점검',  path: '/quality/maintenance' },
    ]
  },
  {
    name: '등록/관리', icon: Settings,
    sub: [
      { name: '제품 등록',       path: '/admin/product' },
      { name: '공정 등록',       path: '/admin/process' },
      { name: '공정 순서 관리',  path: '/admin/flow'    },
      { name: '재작업 순서 관리', path: '/admin/rework'  },
    ]
  },
];

export default function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const [open,     setOpen]     = useState({});
  const [mobile,   setMobile]   = useState(false);
  const [userName, setUserName] = useState('사용자');
  const [dept,     setDept]     = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || '사용자');
    setDept(localStorage.getItem('userDept') || '');
    MENU.forEach(m => {
      if (m.sub?.some(s => pathname.startsWith(s.path))) {
        setOpen(prev => ({ ...prev, [m.name]: true }));
      }
    });
  }, [pathname]);

  const logout = () => {
    ['token', 'userName', 'userDept', 'empId', 'accessLevel'].forEach(k => localStorage.removeItem(k));
    router.push('/login');
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-sm md:hidden"
        onClick={() => setMobile(!mobile)}
      >
        {mobile ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobile && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobile(false)} />
      )}

      <aside
        className="flex-shrink-0 flex flex-col h-screen overflow-y-auto z-40 w-56
          max-md:fixed max-md:top-0 max-md:left-0 max-md:h-full
          max-md:transition-transform max-md:duration-300"
        style={{
          background: '#0f172a',
          transform: mobile ? 'translateX(0)' : undefined,
        }}
      >
        <div className="px-4 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow" style={{ background: '#fff' }}>
              <svg viewBox="0 0 32 32" width="20" height="20" fill="none">
                <circle cx="16" cy="16" r="10" fill="#0f172a"/>
                <path d="M16 6 L16 26 M6 16 L26 16" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-white leading-tight">MES System</div>
              <div className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>THE SUN CO., LTD.</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">{userName}</div>
              <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{dept || '관리자'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {MENU.map(item => {
            const hasSub     = !!item.sub;
            const isExpanded = open[item.name];
            const isActive   = item.path
              ? pathname === item.path
              : item.sub?.some(s => pathname.startsWith(s.path));

            return (
              <div key={item.name}>
                <button
                  onClick={() => {
                    if (hasSub) setOpen(prev => ({ ...prev, [item.name]: !prev[item.name] }));
                    else { router.push(item.path); setMobile(false); }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: isActive ? '#2563eb' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                    }
                  }}
                >
                  <item.icon size={15} className="flex-shrink-0" />
                  <span className="flex-1 text-[12.5px] font-medium truncate">{item.name}</span>
                  {hasSub && (
                    isExpanded
                      ? <ChevronDown size={12} className="flex-shrink-0" />
                      : <ChevronRight size={12} className="flex-shrink-0" />
                  )}
                </button>

                {hasSub && isExpanded && (
                  <div className="ml-3 pl-3 mt-0.5 mb-1 space-y-0.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                    {item.sub.map(s => {
                      const isSubActive = pathname.startsWith(s.path);
                      return (
                        <Link
                          key={s.path}
                          href={s.path}
                          onClick={() => setMobile(false)}
                          className="block px-3 py-1.5 text-[12px] rounded-lg transition-colors truncate"
                          style={{
                            color:      isSubActive ? '#93c5fd' : 'rgba(255,255,255,0.35)',
                            background: isSubActive ? 'rgba(96,165,250,0.1)' : 'transparent',
                            fontWeight: isSubActive ? 500 : 400,
                          }}
                        >
                          {s.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
          >
            <LogOut size={15} />
            <span className="text-[12.5px] font-medium">로그아웃</span>
          </button>
        </div>
      </aside>
    </>
  );
}
