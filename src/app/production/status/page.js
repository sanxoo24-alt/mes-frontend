'use client';
import { useState, useEffect, useCallback } from 'react';

const API = 'https://mes-backend-production-3a22.up.railway.app';

const STATUS_STYLE = {
  '완료':   { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  '진행중': { text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  '시작전': { text: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200'   },
};

const STEP_STATUS = {
  'Completed': { label: '완료',       dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', row: 'border-emerald-100 bg-emerald-50/40' },
  'COMP':      { label: '완료',       dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', row: 'border-emerald-100 bg-emerald-50/40' },
  'PROC':      { label: '진행중',     dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',       row: 'border-blue-200 bg-blue-50'          },
  'Scheduled': { label: '대기',       dot: 'bg-slate-300',   badge: 'bg-slate-100 text-slate-500',     row: 'border-slate-100 bg-white'           },
  'Handover':  { label: '인수인계',   dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700',     row: 'border-amber-100 bg-amber-50/40'     },
  'Issue':     { label: '이슈처리중', dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700',         row: 'border-red-200 bg-red-50/40'         },
  'Fail':      { label: '실패',       dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700',         row: 'border-red-100 bg-red-50/40'         },
  'Pending':   { label: '보류',       dot: 'bg-purple-400',  badge: 'bg-purple-100 text-purple-700',   row: 'border-purple-100 bg-white'          },
};

const JUDGMENT_STYLE = {
  '현장조치': { text: 'text-blue-700',   bg: 'bg-blue-50'   },
  '재작업':   { text: 'text-amber-700',  bg: 'bg-amber-50'  },
  '부적합':   { text: 'text-red-700',    bg: 'bg-red-50'    },
  '폐기':     { text: 'text-purple-700', bg: 'bg-purple-50' },
};

const fmt = (d) => (d ? String(d).slice(0, 10) : '-');
const fmtDt = (v) => v ? new Date(v).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';

const getProgress = (item) => {
  const total = Number(item.total_steps || 0);
  const done  = Number(item.completed_steps || 0);
  if (!total) return 0;
  return Math.round((done / total) * 100);
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['시작전'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.text} ${s.bg} ${s.border}`}>
      {status}
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[60px]">
        <div className={`h-1.5 rounded-full transition-all ${value === 100 ? 'bg-emerald-500' : value > 0 ? 'bg-blue-500' : 'bg-slate-200'}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${value === 100 ? 'text-emerald-600' : value > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{value}%</span>
    </div>
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

export default function ProductionStatusPage() {
  const [list,         setList]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [checked,      setChecked]      = useState([]);
  const [slideMode,    setSlideMode]    = useState(null);
  const [products,     setProducts]     = useState([]);
  const [types,        setTypes]        = useState([]);
  const [processes,    setProcesses]    = useState([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [form, setForm] = useState({
    product_id: '', serial_number: '', work_type: '',
    receipt_date: new Date().toISOString().slice(0, 10),
    desired_delivery_date: '', note: '',
  });
  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/workorder`);
      const data = await res.json();
      if (data.success) setList(data.list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (slideMode !== 'register') return;
    fetch(`${API}/api/workorder/products`).then(r => r.json()).then(d => { if (d.success) setProducts(d.list); }).catch(console.error);
  }, [slideMode]);

  useEffect(() => {
    if (!form.product_id) { setTypes([]); setForm(f => ({ ...f, work_type: '' })); return; }
    fetch(`${API}/api/workorder/types/${form.product_id}`).then(r => r.json()).then(d => { if (d.success) setTypes(d.list); }).catch(console.error);
  }, [form.product_id]);

  useEffect(() => {
    if (!form.product_id || !form.work_type) { setProcesses([]); return; }
    fetch(`${API}/api/workorder/processes/${form.product_id}?type=${encodeURIComponent(form.work_type)}`).then(r => r.json()).then(d => { if (d.success) setProcesses(d.list); }).catch(console.error);
  }, [form.product_id, form.work_type]);

  const openDetail = async (item) => {
    setSlideMode('detail'); setDetailLoading(true); setDetail(null);
    try {
      const res  = await fetch(`${API}/api/workorder/detail/${item.header_id}`);
      const data = await res.json();
      if (data.success) setDetail(data);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const closePanel = () => {
    setSlideMode(null); setDetail(null);
    setForm({ product_id: '', serial_number: '', work_type: '', receipt_date: new Date().toISOString().slice(0, 10), desired_delivery_date: '', note: '' });
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.serial_number || !form.work_type) { alert('제품, S/N, TYPE은 필수 입력 항목입니다.'); return; }
    if (!processes.length) { alert('선택한 TYPE에 공정이 없습니다.\n공정 순서를 먼저 등록해주세요.'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/api/workorder`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, processes }),
      });
      const data = await res.json();
      if (data.success) { alert(`✅ 작업지시 등록 완료\n번호: ${data.work_order_number}`); closePanel(); fetchList(); }
      else { alert('등록 실패: ' + data.error); }
    } catch (e) { alert('오류가 발생했습니다.'); }
    finally { setSubmitting(false); }
  };

  const handleStart = async () => {
    if (!checked.length) { alert('작업지시를 선택해주세요.'); return; }
    if (!confirm(`${checked.length}개 작업을 시작하시겠습니까?`)) return;
    try {
      const res  = await fetch(`${API}/api/workorder/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header_ids: checked }),
      });
      const data = await res.json();
      if (data.success) { alert(`✅ ${data.message}`); setChecked([]); fetchList(); }
      else { alert('오류: ' + data.error); }
    } catch (e) { alert('오류가 발생했습니다.'); }
  };

  const filtered = list.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || (item.serial_number||'').toLowerCase().includes(q) || (item.product_name||'').toLowerCase().includes(q) || (item.order_number||'').toLowerCase().includes(q);
    const matchStatus = statusFilter === '전체' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleAll = () => setChecked(checked.length === filtered.length ? [] : filtered.map(i => i.header_id));
  const toggleOne = (id) => setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="flex h-full relative overflow-hidden bg-slate-100">
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${slideMode ? 'mr-[500px]' : ''}`}>
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <span>생산 관리</span><span>›</span>
            <span className="text-slate-700 font-semibold">작업 등록/현황</span>
          </div>
        </div>

        <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
          <button onClick={() => { setSlideMode('register'); setDetail(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-sm">
            <span className="text-base leading-none">+</span> 신규 작업등록
          </button>
          <button onClick={handleStart} disabled={!checked.length} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors shadow-sm ${checked.length ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-white text-slate-400 border-slate-200 cursor-not-allowed'}`}>
            작업시작{checked.length > 0 && ` (${checked.length})`}
          </button>
          <div className="flex-1" />
          <button onClick={() => alert('엑셀 다운로드 기능 준비중')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            📥 엑셀 다운로드
          </button>
        </div>

        <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <svg width="15" height="15" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="작업지시번호, S/N, 제품명 검색..."
              className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white shadow-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>}
          </div>
          <div className="flex items-center gap-1">
            {['전체', '시작전', '진행중', '완료'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{s}</button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length}건</span>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={filtered.length > 0 && checked.length === filtered.length} onChange={toggleAll} className="rounded border-slate-300" />
                  </th>
                  {['작업지시번호','제품명','TYPE','S/N','현재 공정','진행율','상태','이슈','입고일','납기일'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={11}><Spinner /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="40" height="40" className="text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">표시할 데이터가 없습니다</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => {
                    const progress       = getProgress(item);
                    const isChecked      = checked.includes(item.header_id);
                    const pendingIssues  = Number(item.pending_issues  || 0);
                    const resolvedIssues = Number(item.resolved_issues || 0);
                    return (
                      <tr key={item.header_id} className={`hover:bg-slate-50 transition-colors cursor-default ${isChecked ? 'bg-blue-50/40' : ''}`}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isChecked} onChange={() => toggleOne(item.header_id)} className="rounded border-slate-300" />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 cursor-pointer hover:underline whitespace-nowrap" onClick={() => openDetail(item)}>{item.order_number}</td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{item.product_name || '-'}</td>
                        <td className="px-4 py-3">{item.work_type ? <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{item.work_type}</span> : <span className="text-slate-400">-</span>}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.serial_number || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{item.current_process || (item.status === '완료' ? '완료' : '-')}</td>
                        <td className="px-4 py-3 min-w-[130px]"><ProgressBar value={progress} /></td>
                        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {pendingIssues > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 cursor-pointer"
                                onClick={() => openDetail(item)} title="미처리 이슈 있음">
                                🔴 {pendingIssues}
                              </span>
                            )}
                            {resolvedIssues > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200 cursor-pointer"
                                onClick={() => openDetail(item)} title="처리완료 이슈">
                                ✅ {resolvedIssues}
                              </span>
                            )}
                            {pendingIssues === 0 && resolvedIssues === 0 && (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmt(item.receipt_date)}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmt(item.desired_delivery_date)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 슬라이드 패널 */}
      <div className={`fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 z-50 ${slideMode ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800">{slideMode === 'register' ? '신규 작업등록' : '작업 상세'}</h2>
          <button onClick={closePanel} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* 신규 등록 패널 */}
          {slideMode === 'register' && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">제품 <span className="text-red-500">*</span></label>
                <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value, work_type: '' }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
                  <option value="">제품을 선택하세요</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.product_name} ({p.product_code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">TYPE <span className="text-red-500">*</span></label>
                <select value={form.work_type} onChange={e => setForm(f => ({ ...f, work_type: e.target.value }))} disabled={!form.product_id} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">{!form.product_id ? '제품을 먼저 선택하세요' : types.length === 0 ? '등록된 TYPE 없음' : 'TYPE을 선택하세요'}</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">S/N <span className="text-red-500">*</span></label>
                <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} placeholder="시리얼 번호 입력" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">입고일</label>
                <input type="date" value={form.receipt_date} onChange={e => setForm(f => ({ ...f, receipt_date: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">납기 예정일</label>
                <input type="date" value={form.desired_delivery_date} onChange={e => setForm(f => ({ ...f, desired_delivery_date: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">특이사항</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="특이사항 입력 (선택)" rows={3} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
              </div>
              {processes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">배정될 공정 순서</label>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-200">
                    {processes.map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-medium text-[10px] flex-shrink-0">{p.sequence_order}</span>
                        <span className="text-slate-700 font-medium">{p.process_name}</span>
                        <span className="text-slate-400">({p.department_name})</span>
                        {p.step_type === 'handover' && <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[10px] font-medium">인수인계</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 상세 패널 */}
          {slideMode === 'detail' && (
            <div className="flex flex-col">
              {detailLoading ? <Spinner /> : detail ? (
                <>
                  {/* 기본 정보 */}
                  <div className="p-5 border-b border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '작업지시번호', value: detail.header?.work_order_number },
                        { label: '제품명',       value: detail.header?.product_name },
                        { label: 'TYPE',         value: detail.header?.work_type },
                        { label: 'S/N',          value: detail.header?.serial_number },
                        { label: '입고일',        value: fmt(detail.header?.receipt_date) },
                        { label: '납기 예정일',   value: fmt(detail.header?.desired_delivery_date) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                          <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
                          <div className="text-sm font-medium text-slate-700 truncate">{value || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ✅ 이슈 요약 카드 */}
                  {(detail.issues || []).length > 0 && (
                    <div className="p-5 border-b border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">⚠️ 이슈 요약</div>
                      <div className="space-y-2">
                        {detail.issues.map((issue, i) => {
                          const isPending = !issue.result || issue.result === '미처리';
                          const judSt = JUDGMENT_STYLE[issue.judgment] || { text: 'text-slate-600', bg: 'bg-slate-100' };
                          return (
                            <div key={issue.id || i} className={`rounded-xl border p-3 ${isPending ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span>{isPending ? '🔴' : '✅'}</span>
                                <span className="text-xs font-semibold text-slate-700">{issue.process_name || '-'}</span>
                                <span className="font-mono text-[11px] text-slate-400">{issue.issue_code}</span>
                                {isPending
                                  ? <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700">미처리</span>
                                  : <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${judSt.bg} ${judSt.text}`}>{issue.judgment}</span>
                                }
                                <span className="text-[11px] text-slate-400 ml-auto">{fmtDt(issue.occurred_at)}</span>
                              </div>
                              <div className="text-xs text-slate-600 leading-relaxed pl-6">{issue.issue_content}</div>
                              {!isPending && issue.countermeasures && (
                                <div className="text-xs text-slate-500 mt-1 pl-6">
                                  <span className="font-medium">대책: </span>{issue.countermeasures}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 공정 현황 */}
                  <div className="p-5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">공정 현황</div>
                    <div className="space-y-2">
                      {(detail.steps || []).map((step, i) => {
                        const s = STEP_STATUS[step.status] || STEP_STATUS['Scheduled'];
                        const isLast = i === (detail.steps?.length || 0) - 1;
                        let memo = null;
                        try { memo = step.issue_memo ? JSON.parse(step.issue_memo) : null; } catch {}
                        const stepIssues = (detail.issues || []).filter(
                          issue => String(issue.process_id) === String(step.process_id)
                        );

                        // 이슈로 삽입된 공정
                        if (memo) {
                          const judSt = JUDGMENT_STYLE[memo.judgment] || { text: 'text-slate-600', bg: 'bg-slate-100' };
                          return (
                            <div key={step.id || i} className="ml-5 flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                              <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
                                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                {!isLast && <div className="w-px h-4 bg-amber-200" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-slate-700">{step.process_name}</span>
                                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${s.badge}`}>{s.label}</span>
                                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${judSt.bg} ${judSt.text}`}>{memo.judgment}</span>
                                </div>
                                <div className="text-[11px] text-amber-600 mt-1">📋 이슈 조치 작업</div>
                                {(step.start_time || step.end_time) && (
                                  <div className="text-[11px] text-slate-400 mt-1 flex gap-3">
                                    {step.start_time && <span>시작: {fmt(step.start_time)}</span>}
                                    {step.end_time   && <span>완료: {fmt(step.end_time)}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-300 flex-shrink-0 font-mono">#{step.sequence_order}</div>
                            </div>
                          );
                        }

                        // 일반 공정
                        return (
                          <div key={step.id || i}>
                            <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${s.row}`}>
                              <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                                {(!isLast || stepIssues.length > 0) && <div className="w-px h-4 bg-slate-200" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-slate-700">{step.process_name}</span>
                                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${s.badge}`}>{s.label}</span>
                                  {stepIssues.length > 0 && (
                                    <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-600">⚠️ 이슈 {stepIssues.length}건</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">{step.department_name}</div>
                                {(step.start_time || step.end_time) && (
                                  <div className="text-xs text-slate-400 mt-1 flex gap-3">
                                    {step.start_time && <span>시작: {fmt(step.start_time)}</span>}
                                    {step.end_time   && <span>완료: {fmt(step.end_time)}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-300 flex-shrink-0 font-mono">#{step.sequence_order}</div>
                            </div>

                            {/* 이슈 인라인 표시 */}
                            {stepIssues.map((issue, j) => {
                              const isPending = !issue.result || issue.result === '미처리';
                              const judSt = JUDGMENT_STYLE[issue.judgment] || { text: 'text-slate-600', bg: 'bg-slate-100' };
                              return (
                                <div key={issue.id || j} className="ml-5 mt-1 mb-1">
                                  <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${isPending ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <span className="flex-shrink-0 mt-0.5">{isPending ? '🔴' : '✅'}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-mono text-[11px] text-slate-400">{issue.issue_code}</span>
                                        {isPending
                                          ? <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700">미처리</span>
                                          : <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${judSt.bg} ${judSt.text}`}>{issue.judgment}</span>
                                        }
                                        <span className="text-[11px] text-slate-400 ml-auto">{fmtDt(issue.occurred_at)}</span>
                                      </div>
                                      <div className="text-slate-600 leading-relaxed">{issue.issue_content}</div>
                                      {!isPending && issue.countermeasures && (
                                        <div className="mt-1 text-slate-500">
                                          <span className="font-medium">대책: </span>{issue.countermeasures}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-slate-400 text-sm">데이터를 불러올 수 없습니다.</div>
              )}
            </div>
          )}
        </div>

        {slideMode === 'register' && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <button onClick={closePanel} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">취소</button>
            <button onClick={handleSubmit} disabled={submitting || !form.product_id || !form.serial_number || !form.work_type}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
              {submitting ? '등록 중...' : '작업지시 등록'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
