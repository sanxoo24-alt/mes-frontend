'use client';

import { useState } from 'react';

export default function SearchPage() {
  const [sn,         setSn]         = useState('');
  const [data,       setData]       = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleSearch = async () => {
    if (!sn.trim()) return;
    setLoading(true); setError(''); setData(null); setSelectedId(null);
    try {
      const res  = await fetch(`http://10.10.10.15:4000/api/search?sn=${sn.trim()}`);
      const json = await res.json();
      if (!json.success) { setError(json.error || '검색 실패'); return; }
      if (!json.orders?.length) { setError('검색 결과가 없습니다.'); return; }
      setData(json);
      setSelectedId(json.orders[0].header_id);
    } catch { setError('서버 연결 오류'); }
    finally  { setLoading(false); }
  };

  const STATUS_MAP = {
    Completed: { label: '완료',     color: '#059669', bg: '#d1fae5' },
    PROC:      { label: '진행중',   color: '#2563eb', bg: '#dbeafe' },
    Scheduled: { label: '대기',     color: '#6b7280', bg: '#f3f4f6' },
    Handover:  { label: '인수인계', color: '#d97706', bg: '#fef3c7' },
    Fail:      { label: '실패',     color: '#dc2626', bg: '#fee2e2' },
    Pending:   { label: '보류',     color: '#7c3aed', bg: '#ede9fe' },
  };
  const getStatus = (s) => STATUS_MAP[s] || { label: s || '-', color: '#6b7280', bg: '#f3f4f6' };

  const fmtDate = (v) => v ? new Date(v).toLocaleDateString('ko-KR') : '-';
  const fmtDt   = (v) => v ? new Date(v).toLocaleString('ko-KR') : '-';

  const selectedOrder   = data?.orders.find(o => o.header_id === selectedId);
  const selectedDetails = data?.details.filter(d => d.header_id === selectedId) ?? [];
  const doneCount  = selectedDetails.filter(d => d.status === 'Completed').length;
  const totalCount = selectedDetails.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span style={{ fontSize: 22 }}>🔍</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>S/N 검색</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 6px 6px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <input type="text" value={sn} onChange={e => setSn(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="시리얼 번호를 입력하세요 (예: 111)"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111827', background: 'transparent', padding: '8px 4px', fontFamily: 'inherit' }} />
          <button onClick={handleSearch} disabled={loading}
            style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, padding: '0 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            {loading ? '검색중...' : '🔍 검색'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 20 }}>
            ❌ {error}
          </div>
        )}

        {!loading && !data && !error && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14 }}>시리얼 번호를 입력하여 공정 이력을 조회하세요</div>
          </div>
        )}

        {data && selectedOrder && (
          <>
            {data.orders.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {data.orders.map(o => (
                  <button key={o.header_id} onClick={() => setSelectedId(o.header_id)}
                    style={{ background: selectedId === o.header_id ? '#1e3a5f' : '#fff', color: selectedId === o.header_id ? '#fff' : '#6b7280', border: `1px solid ${selectedId === o.header_id ? '#1e3a5f' : '#e5e7eb'}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {o.order_number}
                  </button>
                ))}
              </div>
            )}

            <div style={cardStyle}>
              <div style={cardHeadStyle}>
                <span style={{ fontSize: 15 }}>📋</span>
                <span style={cardTitleStyle}>기본 정보</span>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{selectedOrder.order_number}</span>
                  <StatusBadge status={selectedOrder.status} map={STATUS_MAP} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 20px' }}>
                  <InfoItem label="시리얼 번호"   value={selectedOrder.serial_number}  mono />
                  <InfoItem label="제품명"         value={selectedOrder.product_name} />
                  <InfoItem label="작업 유형"      value={selectedOrder.work_type} />
                  <InfoItem label="생성일"         value={fmtDt(selectedOrder.created_at)} />
                  <InfoItem label="완료 예정일"    value={fmtDate(selectedOrder.completion_date)} />
                  <InfoItem label="진행률"         value={`${doneCount} / ${totalCount} 공정 (${pct}%)`} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#059669' : '#2563eb', borderRadius: 99, transition: 'width .5s ease' }} />
                  </div>
                </div>
              </div>
            </div>

            {selectedDetails.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeadStyle}>
                  <span style={{ fontSize: 15 }}>⚙️</span>
                  <span style={cardTitleStyle}>공정 진행 현황</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>총 {totalCount}개 공정</span>
                </div>
                <div style={{ padding: '0 0 4px' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['#', '공정명', '부서', '상태', '예정일', '완료일시'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDetails.map((d, i) => {
                          const st = getStatus(d.status);
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                              onMouseLeave={e => e.currentTarget.style.background = ''}>
                              <td style={{ padding: '11px 14px', color: '#9ca3af', fontFamily: 'monospace', fontSize: 12 }}>{d.sequence_order ?? i + 1}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ fontWeight: 500, color: d.process_name ? '#111827' : '#d1d5db' }}>{d.process_name || '미지정'}</div>
                                {d.process_code && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontFamily: 'monospace' }}>{d.process_code}</div>}
                              </td>
                              <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: 12 }}>{d.department || '-'}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                                  {st.label}
                                </span>
                              </td>
                              <td style={{ padding: '11px 14px', color: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}>{fmtDate(d.planned_date)}</td>
                              <td style={{ padding: '11px 14px', color: d.end_time ? '#374151' : '#d1d5db', fontSize: 12, fontFamily: 'monospace' }}>{fmtDt(d.end_time)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#111827', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '-'}</div>
    </div>
  );
}

function StatusBadge({ status, map }) {
  const st = map[status] || { label: status || '-', color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
  );
}

const cardStyle     = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const cardHeadStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' };
const cardTitleStyle = { fontSize: 13, fontWeight: 700, color: '#374151' };
