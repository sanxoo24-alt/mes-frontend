'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

const API = 'http://10.10.10.15:4000';
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/dashboard`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    </div>
  );

  const cards  = data?.cards  || {};
  const month  = cards.month  || new Date().getMonth() + 1;

  // 월별 차트 데이터 (1~12월)
  const chartData = MONTHS.map((label, i) => {
    const found = (data?.monthlyChart || []).find(d => Number(d.month) === i + 1);
    return { label, completed: found ? Number(found.completed) : 0, planned: found ? Number(found.planned) : 0 };
  });
  const maxChart = Math.max(...chartData.map(d => d.planned), 1);

  // WIP 데이터
  const wipData  = data?.wipByProcess || [];
  const maxWip   = Math.max(...wipData.map(d => Number(d.wip_count)), 1);

  return (
    <div className="p-6 space-y-6 bg-slate-100 min-h-full">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">대시보드</h1>
          <p className="text-sm text-slate-500 mt-0.5">실시간 생산 현황</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw size={13} /> 새로고침
        </button>
      </div>

      {/* 상단 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/production/status" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">{month}월 총 작업</p>
              <h3 className="text-3xl font-bold mt-1 text-slate-900">{cards.total_orders ?? '-'}건</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-600 font-medium">
            자세히 보기 <ArrowRight size={12} className="ml-1" />
          </div>
        </Link>

        <Link href="/production/completed" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">{month}월 완료 작업</p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-600">{cards.completed_orders ?? '-'}건</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle size={22} />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium">
            자세히 보기 <ArrowRight size={12} className="ml-1" />
          </div>
        </Link>

        <Link href="/quality/nc" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">{month}월 부적합</p>
              <h3 className="text-3xl font-bold mt-1 text-red-600">{cards.nc_count ?? '-'}건</h3>
            </div>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-red-600 font-medium">
            자세히 보기 <ArrowRight size={12} className="ml-1" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 월별 완료 차트 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-4">{new Date().getFullYear()}년 월별 작업 완료 현황</h3>
          <div className="h-48 flex items-end gap-1.5 px-1">
            {chartData.map((d, i) => {
              const height = d.planned > 0 ? (d.planned / maxChart) * 100 : 3;
              const compPct = d.planned > 0 ? (d.completed / d.planned) * 100 : 0;
              const isCurrent = i + 1 === month;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden" style={{ height: `${height}%`, minHeight: 4 }}>
                    <div className="w-full bg-emerald-400 transition-all" style={{ height: `${compPct}%` }} />
                    <div className="w-full bg-blue-100 flex-1" />
                  </div>
                  {/* 툴팁 */}
                  {d.planned > 0 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      계획 {d.planned} / 완료 {d.completed}
                    </div>
                  )}
                  <span className={`text-[10px] ${isCurrent ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>{d.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-sm bg-blue-100" /> 계획
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-sm bg-emerald-400" /> 완료
            </div>
          </div>
        </div>

        {/* WIP 병목 차트 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">공정별 WIP 현황 <span className="text-xs font-normal text-slate-400">(진행중+대기)</span></h3>
            <Link href="/production/status" className="text-xs text-blue-600 hover:underline">전체보기</Link>
          </div>
          {wipData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">진행중인 작업이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {wipData.map((w, i) => {
                const total     = Number(w.wip_count);
                const proc      = Number(w.proc_count);
                const waiting   = Number(w.waiting_count);
                const issue     = Number(w.issue_count);
                const barWidth  = (total / maxWip) * 100;
                const isBottleneck = i === 0 && total > 3;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700 truncate max-w-[140px]">{w.process_name}</span>
                        <span className="text-slate-400 text-[10px]">{w.department_name}</span>
                        {isBottleneck && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">병목!</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-shrink-0">
                        {proc > 0    && <span className="text-blue-600">진행 {proc}</span>}
                        {waiting > 0 && <span className="text-slate-500">대기 {waiting}</span>}
                        {issue > 0   && <span className="text-red-500">이슈 {issue}</span>}
                        <span className="font-bold text-slate-700">{total}건</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full flex rounded-full overflow-hidden transition-all duration-500" style={{ width: `${barWidth}%` }}>
                        {proc > 0    && <div className="bg-blue-400"   style={{ width: `${(proc/total)*100}%` }} />}
                        {waiting > 0 && <div className="bg-slate-300"  style={{ width: `${(waiting/total)*100}%` }} />}
                        {issue > 0   && <div className="bg-red-400"    style={{ width: `${(issue/total)*100}%` }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 mt-2 justify-end">
                <div className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> 진행중</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> 대기</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2.5 h-2.5 rounded-sm bg-red-400" /> 이슈</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
