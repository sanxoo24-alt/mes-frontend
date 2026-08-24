'use client';
import { useState, useEffect } from 'react';

const fmtDate = (v) => v ? new Date(v).toLocaleDateString('ko-KR') : '-';
const fmtDt   = (v) => v ? new Date(v).toLocaleString('ko-KR') : '-';

function TatBadge({ days }) {
  if (days === null || days === undefined) return <span style={{ color: '#9ca3af' }}>-</span>;
  const n = Number(days);
  const color = n <= 7  ? { color: '#059669', bg: '#d1fae5' }
              : n <= 14 ? { color: '#d97706', bg: '#fef3c7' }
              :           { color: '#dc2626', bg: '#fee2e2' };
  return (
    <span style={{ background: color.bg, color: color.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
      {n}일
    </span>
  );
}

export default function CompletedPage() {
  const [keyword,  setKeyword]  = useState('');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [searched, setSearched] = useState(false);

  const fetchData = async () => {
    setLoading(true); setError(''); setSearched(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (from)    params.set('from', from);
      if (to)      params.set('to', to);
      const res  = await fetch(`http://10.10.10.15:4000/api/production/completed?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setList(json.list);
    } catch (e) {
      setError(e.message || '서버 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReset = () => {
    setKeyword(''); setFrom(''); setTo('');
    setTimeout(fetchData, 0);
  };

  const handleExcel = () => {
    const header = ['작업지시번호','제품명','TYPE','S/N','입고일','투입일','완료일','TAT(일)','비고'];
    const rows = list.map(r => [
      r.order_number, r.product_name, r.work_type, r.serial_number,
      fmtDate(r.received_date), fmtDate(r.input_date),
      fmtDt(r.completed_date), r.tat_days ?? '-', r.note ?? ''
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `완료작업조회_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const avgTat = list.length > 0 ? Math.round(list.reduce((s, r) => s + (Number(r.tat_days) || 0), 0) / list.length) : null;
  const maxTat = list.length > 0 ? Math.max(...list.map(r => Number(r.tat_days) || 0)) : null;
  const COL = '1.5fr 1.3fr 0.5fr 0.8fr 1fr 1fr 1.4fr 0.7fr 1fr';

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>완료 작업 조회</h1>
        </div>
        <button onClick={handleExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          📥 엑셀 다운로드
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>통합 검색</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', background: '#f9fafb', minWidth: 200 }}>
            <span style={{ color: '#9ca3af' }}>🔍</span>
            <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData()}
              placeholder="S/N, 제품명, 지시번호로 검색..."
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1 }} />
          </div>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={dateInputStyle} />
          <span style={{ color: '#9ca3af', fontSize: 13 }}>~</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={dateInputStyle} />
          <button onClick={fetchData} style={btnPrimary}>검색</button>
          <button onClick={handleReset} style={btnSecondary}>초기화</button>
        </div>
      </div>

      {list.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { label: '완료 건수', value: `${list.length}건`, color: '#2563eb' },
            { label: '평균 TAT', value: avgTat !== null ? `${avgTat}일` : '-', color: '#d97706' },
            { label: '최장 TAT', value: maxTat !== null ? `${maxTat}일` : '-', color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 20px', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>❌ {error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COL, padding: '11px 20px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
          {['작업지시 번호','제품명','TYPE','S/N','입고일','투입일','완료일','TAT','비고'].map(h => (
            <span key={h} style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>불러오는 중...</div>}
        {!loading && list.length === 0 && <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>표시할 데이터가 없습니다.</div>}

        {!loading && list.map((row, i) => (
          <div key={row.header_id}
            style={{ display: 'grid', gridTemplateColumns: COL, padding: '13px 20px', alignItems: 'center', borderBottom: i < list.length - 1 ? '1px solid #f9fafb' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>{row.order_number}</span>
            <span style={{ fontSize: 13, color: '#374151' }}>{row.product_name || '-'}</span>
            <span style={{ display: 'inline-flex', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, width: 'fit-content' }}>{row.work_type || '-'}</span>
            <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#374151' }}>{row.serial_number || '-'}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{fmtDate(row.received_date)}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{fmtDate(row.input_date)}</span>
            <span style={{ fontSize: 13, color: '#374151' }}>{fmtDt(row.completed_date)}</span>
            <TatBadge days={row.tat_days} />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{row.note || '-'}</span>
          </div>
        ))}
      </div>

      {!loading && list.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>총 {list.length}개</div>
      )}
    </div>
  );
}

const dateInputStyle = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#374151', background: '#f9fafb', outline: 'none', cursor: 'pointer' };
const btnPrimary   = { background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
