'use client';
import { useEffect, useState } from 'react';

const REASON_CODES  = ['불량이슈', '고객이슈'];
const JUDGMENTS     = ['합격판정', '조건부합격', '재작업', '폐기처분'];
const DEFECT_TYPES  = ['스크래치', '치핑', '마킹', '오염', '크랙', '파손', 'SPEC OUT', '기타', '등'];

const EMPTY_REWORK = {
  reason_code: '', found_process: '', issue_detail: '', occurred_date: '',
  defect_type: '', action_taken: '', judgment: '', judge_name: '',
  judge_date: '', final_judgment: '', memo: '',
  before_date: '', after_date: '', deadline_reason: ''
};

function getDday(dateStr) {
  if (!dateStr) return null;
  const today  = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function DdayBadge({ dateStr }) {
  const d = getDday(dateStr);
  if (d === null) return null;
  let bg, color, text;
  if (d < 0)        { bg = '#fee2e2'; color = '#991b1b'; text = `D+${Math.abs(d)} 초과!`; }
  else if (d === 0) { bg = '#fef3c7'; color = '#92400e'; text = 'D-day!'; }
  else if (d <= 3)  { bg = '#fef3c7'; color = '#92400e'; text = `D-${d} 임박`; }
  else              { bg = '#d1fae5'; color = '#065f46'; text = `D-${d}`; }
  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 'bold', background: bg, color }}>{text}</span>;
}

function JudgmentModal({ rework, onClose, onSaved }) {
  const [form, setForm] = useState({
    judgment:       rework.judgment       || '',
    judge_name:     rework.judge_name     || '',
    judge_date:     rework.judge_date ? rework.judge_date.slice(0, 10) : '',
    final_judgment: rework.final_judgment || ''
  });
  const [loading, setLoading] = useState(false);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.judgment) { alert('판정을 선택해주세요.'); return; }
    setLoading(true);
    const res  = await fetch(`http://10.10.10.15:4000/api/rework/${rework.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) { alert('저장 완료!'); onSaved(); onClose(); }
    else { alert('오류: ' + data.error); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>✅ 판정 입력</h2>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{rework.serial_number} · {rework.rework_count}차 재작업</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: '#374151' }}>
          <div><b>불량코드:</b> {rework.reason_code}</div>
          {rework.found_process && <div><b>발견공정:</b> {rework.found_process}</div>}
          {rework.issue_detail  && <div><b>이슈내용:</b> {rework.issue_detail}</div>}
          {rework.defect_type   && <div><b>불량분류:</b> {rework.defect_type}</div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>판정 *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {JUDGMENTS.map(j => (
              <button key={j} onClick={() => set('judgment', j)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
                  borderColor: form.judgment === j ? '#2563eb' : '#e5e7eb',
                  background:  form.judgment === j ? '#eff6ff' : 'white',
                  color:       form.judgment === j ? '#2563eb' : '#374151' }}>
                {j}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>최종판정내용</label>
          <input value={form.final_judgment} onChange={e => set('final_judgment', e.target.value)} placeholder="예: 재작업, 조건부출하, 폐기" style={inp} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={lbl}>판정자</label>
            <input value={form.judge_name} onChange={e => set('judge_name', e.target.value)} placeholder="이름" style={inp} />
          </div>
          <div>
            <label style={lbl}>판정일자</label>
            <input type="date" value={form.judge_date} onChange={e => set('judge_date', e.target.value)} style={inp} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>닫기</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
            {loading ? '저장 중...' : '판정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReworkHistoryModal({ order, onClose }) {
  const [reworks,         setReworks]         = useState([]);
  const [deadlines,       setDeadlines]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [judgmentTarget,  setJudgmentTarget]  = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    const res  = await fetch(`http://10.10.10.15:4000/api/rework/${order.serial_number}`);
    const data = await res.json();
    setReworks(data.reworks   || []);
    setDeadlines(data.deadlines || []);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const reasonColor = (code) => {
    if (!code) return { bg: '#f3f4f6', color: '#6b7280' };
    if (code.includes('불량')) return { bg: '#fee2e2', color: '#dc2626' };
    if (code.includes('고객')) return { bg: '#fef3c7', color: '#92400e' };
    return { bg: '#ede9fe', color: '#7c3aed' };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>🔄 재작업 이력</h2>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>S/N: {order.serial_number}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>불러오는 중...</p>
        ) : reworks.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>재작업 이력이 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reworks.map((r) => (
              <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#1e40af', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 }}>{r.rework_count}</span>
                    <span style={{ fontWeight: 'bold', fontSize: 15 }}>{r.rework_count}차 재작업</span>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: reasonColor(r.reason_code).bg, color: reasonColor(r.reason_code).color }}>{r.reason_code}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {r.found_process && <div><b>발견공정:</b> {r.found_process}</div>}
                  {r.issue_detail  && <div><b>이슈내용:</b> {r.issue_detail}</div>}
                  {r.defect_type   && <div><b>불량분류:</b> {r.defect_type}</div>}
                  {r.action_taken  && <div><b>조치내용:</b> {r.action_taken}</div>}
                  {r.memo          && <div><b>메모:</b> {r.memo}</div>}
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {r.judgment ? (
                    <div style={{ fontSize: 13 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: '#d1fae5', color: '#065f46', fontWeight: 'bold' }}>✅ {r.judgment}</span>
                      {r.final_judgment && <span style={{ marginLeft: 8, color: '#6b7280' }}>결과: {r.final_judgment}</span>}
                      {r.judge_name     && <span style={{ marginLeft: 8, color: '#9ca3af' }}>{r.judge_name}</span>}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 'bold' }}>⏳ 판정 대기 중</span>
                  )}
                  <button onClick={() => setJudgmentTarget(r)}
                    style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
                    {r.judgment ? '판정 수정' : '판정하기'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {deadlines.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>📅 납기 변경 이력</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deadlines.map((d, i) => (
                <div key={i} style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  <span style={{ fontWeight: 'bold' }}>{new Date(d.before_date).toLocaleDateString('ko-KR')}</span>
                  <span style={{ margin: '0 8px', color: '#92400e' }}>→</span>
                  <span style={{ fontWeight: 'bold', color: '#dc2626' }}>{new Date(d.after_date).toLocaleDateString('ko-KR')}</span>
                  {d.reason && <span style={{ marginLeft: 8, color: '#6b7280' }}>({d.reason})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {judgmentTarget && (
        <JudgmentModal rework={judgmentTarget} onClose={() => setJudgmentTarget(null)} onSaved={fetchHistory} />
      )}
    </div>
  );
}

function ReworkModal({ order, onClose, onSaved }) {
  const [form,         setForm]         = useState(EMPTY_REWORK);
  const [loading,      setLoading]      = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.reason_code) { alert('불량코드는 필수입니다.'); return; }
    setLoading(true);
    const res  = await fetch('http://10.10.10.15:4000/api/rework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial_number: order.serial_number, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) { alert(`재작업 접수 완료! (${data.rework_count}차 재작업)`); onSaved(); onClose(); }
    else { alert('오류: ' + data.error); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>🔧 재작업 접수</h2>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>S/N: {order.serial_number}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>불량코드 *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {REASON_CODES.map(code => (
              <button key={code} onClick={() => set('reason_code', code)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontSize: 14, fontWeight: 'bold',
                  borderColor: form.reason_code === code ? '#dc2626' : '#e5e7eb',
                  background:  form.reason_code === code ? '#fee2e2' : 'white',
                  color:       form.reason_code === code ? '#dc2626' : '#374151' }}>
                {code}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>발견공정</label>
            <input value={form.found_process} onChange={e => set('found_process', e.target.value)} placeholder="예: 수입검사, 본딩" style={inp} />
          </div>
          <div>
            <label style={lbl}>발생일자</label>
            <input type="date" value={form.occurred_date} onChange={e => set('occurred_date', e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>불량분류</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DEFECT_TYPES.map(type => (
              <button key={type} onClick={() => set('defect_type', type)}
                style={{ padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer', fontSize: 13,
                  borderColor: form.defect_type === type ? '#7c3aed' : '#e5e7eb',
                  background:  form.defect_type === type ? '#ede9fe' : 'white',
                  color:       form.defect_type === type ? '#7c3aed' : '#374151' }}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>이슈내용</label>
          <input value={form.issue_detail} onChange={e => set('issue_detail', e.target.value)} placeholder="예: 전극 SPEC OUT, 플레이트 스크래치" style={inp} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>조치내용</label>
          <textarea value={form.action_taken} onChange={e => set('action_taken', e.target.value)} placeholder="조치내용을 입력하세요" rows={2} style={{ ...inp, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>메모 (비고)</label>
          <textarea value={form.memo} onChange={e => set('memo', e.target.value)} placeholder="특이사항, 추가 메모" rows={2} style={{ ...inp, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowDeadline(!showDeadline)}
            style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#6b7280', fontSize: 14, width: '100%' }}>
            {showDeadline ? '▲' : '▼'} 납기 변경 이력 {showDeadline ? '닫기' : '추가하기'}
          </button>
          {showDeadline && (
            <div style={{ marginTop: 12, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>변경 전 납기일</label>
                  <input type="date" value={form.before_date} onChange={e => set('before_date', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>변경 후 납기일</label>
                  <input type="date" value={form.after_date} onChange={e => set('after_date', e.target.value)} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>변경 사유</label>
                <input value={form.deadline_reason} onChange={e => set('deadline_reason', e.target.value)} placeholder="예: 재작업 공정추가로 인한 납기 연장" style={inp} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>닫기</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
            {loading ? '접수 중...' : '재작업 접수'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrderListPage() {
  const [orders,        setOrders]        = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [details,       setDetails]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [reworkTarget,  setReworkTarget]  = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);

  const fetchOrders = () => {
    fetch('http://10.10.10.15:4000/api/workorder')
      .then(r => r.json())
      .then(data => setOrders(data.list || []));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleClick = async (header_id) => {
    if (selected === header_id) { setSelected(null); setDetails([]); return; }
    setSelected(header_id);
    setLoading(true);
    const res  = await fetch(`http://10.10.10.15:4000/api/workorder/detail/${header_id}`);
    const data = await res.json();
    setDetails(data.steps || []);
    setLoading(false);
  };

  const statusColor = (status) => {
    if (status === 'Completed') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'PROC')      return { bg: '#dbeafe', color: '#1e40af' };
    return { bg: '#f3f4f6', color: '#374151' };
  };

  const statusLabel = (status) => {
    if (status === 'Completed') return '완료';
    if (status === 'PROC')      return '진행중';
    if (status === 'Scheduled') return '대기';
    if (status === 'Handover')  return '인수인계';
    return status;
  };

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 32 }}>📋 작업지시 목록</h1>
      {orders.length === 0 ? (
        <p style={{ color: '#6b7280' }}>등록된 작업지시가 없습니다!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => (
            <div key={order.order_number}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: selected === order.header_id ? '12px 12px 0 0' : 12, padding: 20, background: selected === order.header_id ? '#eff6ff' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleClick(order.header_id)} style={{ flex: 1, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 18 }}>{order.order_number}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 'bold',
                      background: order.status === '완료' ? '#d1fae5' : order.status === '진행중' ? '#dbeafe' : '#f3f4f6',
                      color:      order.status === '완료' ? '#065f46' : order.status === '진행중' ? '#1e40af'  : '#374151' }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', marginTop: 4 }}>{order.product_name} · S/N: {order.serial_number} · TYPE: {order.work_type}</div>
                  <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
                    현재공정: {order.current_process || '-'} · 완료: {order.completed_steps}/{order.total_steps}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={e => { e.stopPropagation(); setHistoryTarget(order); }}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #93c5fd', background: '#eff6ff', color: '#2563eb', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
                    📋 이력보기
                  </button>
                  <button onClick={e => { e.stopPropagation(); setReworkTarget(order); }}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff1f1', color: '#dc2626', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
                    🔧 재작업
                  </button>
                  <div onClick={() => handleClick(order.header_id)} style={{ cursor: 'pointer', textAlign: 'right', minWidth: 40 }}>
                    <div style={{ marginTop: 4, fontSize: 20 }}>{selected === order.header_id ? '▲' : '▼'}</div>
                  </div>
                </div>
              </div>
              {selected === order.header_id && (
                <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 16, background: '#f9fafb' }}>
                  {loading ? <p style={{ color: '#6b7280' }}>불러오는 중...</p> : details.length === 0 ? <p style={{ color: '#6b7280' }}>공정 정보가 없습니다!</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {details.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                          <span style={{ fontWeight: 'bold', color: '#6b7280', minWidth: 24 }}>{d.sequence_order || i+1}</span>
                          <span style={{ flex: 1, fontWeight: 'bold' }}>{d.process_name || '-'}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>{d.department_name || ''}</span>
                          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 'bold', background: statusColor(d.status).bg, color: statusColor(d.status).color }}>
                            {statusLabel(d.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {reworkTarget  && <ReworkModal         order={reworkTarget}  onClose={() => setReworkTarget(null)}  onSaved={fetchOrders} />}
      {historyTarget && <ReworkHistoryModal  order={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: 14 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' };
