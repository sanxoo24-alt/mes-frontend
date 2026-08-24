'use client';
import { useState, useEffect, useCallback } from 'react';

const API = 'http://10.10.10.15:4000';

const JUDGMENTS = ['현장조치', '재작업', '부적합', '폐기', '합격'];

const JUDGMENT_STYLE = {
  '현장조치': { text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  '재작업':   { text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  '부적합':   { text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
  '폐기':     { text: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200'  },
  '합격':     { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  '미처리':   { text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-300'     },
};

const SEV_STYLE = {
  Critical: { text: 'text-red-700',   bg: 'bg-red-50'   },
  Major:    { text: 'text-amber-700', bg: 'bg-amber-50' },
  Minor:    { text: 'text-slate-600', bg: 'bg-slate-100' },
  General:  { text: 'text-blue-700',  bg: 'bg-blue-50'  },
};

const fmt = (d) => (d ? String(d).slice(0, 10) : '-');
const fmtDt = (v) => v ? new Date(v).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';

function JudgmentBadge({ judgment, result }) {
  const label = judgment || result || '미처리';
  const isPending = !judgment && (!result || result === '' || result === '미처리');
  const s = isPending ? JUDGMENT_STYLE['미처리'] : (JUDGMENT_STYLE[label] || { text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' });
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.text} ${s.bg} ${s.border}`}>
      {isPending ? '🔴 미처리' : label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
      <span className="text-sm">불러오는 중...</span>
    </div>
  );
}

export default function NCPage() {
  const [list,           setList]           = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [search,         setSearch]         = useState('');
  const [judgmentFilter, setJudgmentFilter] = useState('전체');
  const [slideMode,      setSlideMode]      = useState(null);
  const [detail,         setDetail]         = useState(null);
  const [detailLoading,  setDetailLoading]  = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)                    params.set('keyword',  search);
      if (judgmentFilter !== '전체') params.set('judgment', judgmentFilter);
      const res  = await fetch(`${API}/api/nc?${params}`);
      const data = await res.json();
      if (data.success) setList(data.list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, judgmentFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = async (item) => {
    setSlideMode('detail'); setDetailLoading(true); setDetail(null);
    try {
      const res  = await fetch(`${API}/api/nc/${item.id}`);
      const data = await res.json();
      if (data.success) setDetail(data.data);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const closePanel = () => { setSlideMode(null); setDetail(null); };

  const isPending = (item) => !item.judgment && (!item.result || item.result === '' || item.result === '미처리');

  return (
    <div className="flex h-full relative overflow-hidden bg-slate-100">
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${slideMode ? 'mr-[500px]' : ''}`}>

        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <span>품질 관리</span><span>›</span>
            <span className="text-slate-700 font-semibold">이슈/부적합 현황</span>
          </div>
        </div>

        <div className="px-6 pb-3 flex items-center gap-2">
          <div className="flex-1" />
          <button onClick={fetchList} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">
            🔄 새로고침
          </button>
          <button onClick={() => alert('엑셀 다운로드 기능 준비중')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-sm">
            📥 엑셀 다운로드
          </button>
        </div>

        <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <svg width="15" height="15" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="이슈코드, 작업지시번호, 제품명 검색..."
              className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white shadow-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {['전체', '미처리', ...JUDGMENTS].map(j => (
              <button key={j} onClick={() => setJudgmentFilter(j)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${judgmentFilter === j ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                {j === '미처리' ? '🔴 미처리' : j}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">{list.length}건</span>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['이슈코드', 'NC번호', '작업지시번호', '제품명', '공정명', 'S/N', '심각도', '판정', '보고자', '발생일'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={10}><Spinner /></td></tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="40" height="40" className="text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">표시할 데이터가 없습니다</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.map(item => {
                    const pending = isPending(item);
                    const sevSt = SEV_STYLE[item.severity] || SEV_STYLE.General;
                    return (
                      <tr key={item.id} onClick={() => openDetail(item)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${pending ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium whitespace-nowrap">{item.issue_code || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{item.nc_number || <span className="text-slate-300">-</span>}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{item.work_order_number || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{item.product_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{item.process_name || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.serial_number || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sevSt.text} ${sevSt.bg}`}>{item.severity || '-'}</span>
                        </td>
                        <td className="px-4 py-3"><JudgmentBadge judgment={item.judgment} result={item.result} /></td>
                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{item.reporter_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDt(item.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 패널 */}
      <div className={`fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 z-50 ${slideMode ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800">이슈 상세</h2>
          <button onClick={closePanel} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {slideMode === 'detail' && (
            <div className="p-6">
              {detailLoading ? <Spinner /> : detail ? (
                <div className="space-y-5">

                  {/* 헤더 */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">이슈코드</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">{detail.issue_code}</div>
                      {detail.nc_number && (
                        <div className="text-xs text-slate-400 mt-1 font-mono">NC: {detail.nc_number}</div>
                      )}
                    </div>
                    <JudgmentBadge judgment={detail.judgment} result={detail.result} />
                  </div>

                  {/* 기본 정보 */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">기본 정보</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '작업지시번호', value: detail.work_order_number },
                        { label: 'S/N',          value: detail.serial_number },
                        { label: '제품명',        value: detail.product_name },
                        { label: '공정명',        value: detail.process_name },
                        { label: '심각도',        value: detail.severity },
                        { label: '보고자',        value: detail.reporter_name },
                        { label: '발생일시',      value: fmtDt(detail.created_at) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                          <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
                          <div className="text-sm font-medium text-slate-700">{value || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 이슈 내용 */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">이슈 내용</div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {detail.issue_content || <span className="text-slate-300">내용 없음</span>}
                    </div>
                  </div>

                  {/* 판정 결과 (있을 때만) */}
                  {detail.judgment && (
                    <>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">원인 분석</div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                          {detail.root_cause || <span className="text-slate-300">내용 없음</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">대책사항</div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                          {detail.countermeasures || <span className="text-slate-300">내용 없음</span>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 미처리 안내 */}
                  {!detail.judgment && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                      ⚠️ 아직 판정이 이루어지지 않은 이슈입니다. 생산관리 &gt; 작업 이슈 현황에서 판정해주세요.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-sm">데이터를 불러올 수 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
