'use client';
import { useEffect, useState } from 'react';

export default function WorkOrderPage() {
  const [products,  setProducts]  = useState([]);
  const [types,     setTypes]     = useState([]);
  const [processes, setProcesses] = useState([]);
  const [form, setForm] = useState({
    product_id: '',
    product_name: '',
    type: '',
    serial_number: '',
    start_date: '',
    estimated_completion_date: '',
  });
  const [loading,      setLoading]      = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [result,       setResult]       = useState(null);

  useEffect(() => {
    fetch('https://mes-backend-production-3a22.up.railway.app/api/workorder/products')
      .then(r => r.json())
      .then(data => setProducts(data.list || []));
  }, []);

  useEffect(() => {
    if (!form.product_id) { setTypes([]); setProcesses([]); return; }
    setTypesLoading(true);
    setForm(f => ({ ...f, type: '' }));
    setProcesses([]);
    fetch(`https://mes-backend-production-3a22.up.railway.app/api/workorder/types/${form.product_id}`)
      .then(r => r.json())
      .then(data => setTypes(data.list || []))
      .finally(() => setTypesLoading(false));
  }, [form.product_id]);

  useEffect(() => {
    if (!form.product_id || !form.type) { setProcesses([]); return; }
    fetch(`https://mes-backend-production-3a22.up.railway.app/api/workorder/processes/${form.product_id}?type=${form.type}`)
      .then(r => r.json())
      .then(data => setProcesses(data.list || []));
  }, [form.product_id, form.type]);

  const handleProductChange = (e) => {
    const selected = products.find(p => p.id === Number(e.target.value));
    setForm(f => ({ ...f, product_id: e.target.value, product_name: selected?.product_name || '', type: '' }));
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.type || !form.serial_number || !form.start_date) {
      alert('모든 필수 항목을 입력해주세요!'); return;
    }
    if (processes.length === 0) {
      alert('공정이 없습니다. 제품/타입을 확인해주세요.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://mes-backend-production-3a22.up.railway.app/api/workorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id:   form.product_id,
          serial_number: form.serial_number,
          work_type:    form.type,
          scheduled_date: form.start_date,
          estimated_completion_date: form.estimated_completion_date,
          processes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.work_order_number);
        setForm({ product_id: '', product_name: '', type: '', serial_number: '', start_date: '', estimated_completion_date: '' });
        setTypes([]); setProcesses([]);
      } else {
        alert('오류: ' + data.error);
      }
    } catch {
      alert('서버 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  const resetResult = () => setResult(null);

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span style={{ fontSize: 22 }}>📋</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>작업지시 등록</h1>
        </div>

        {result && (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#065f46', fontSize: 16 }}>✅ 등록 완료!</div>
            <div style={{ color: '#065f46', marginTop: 4, fontSize: 14 }}>
              작업지시 번호: <strong>{result}</strong>
            </div>
            <button onClick={resetResult} style={{ marginTop: 12, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#10b981', color: 'white', fontWeight: 600, fontSize: 13 }}>
              새 작업지시 등록
            </button>
          </div>
        )}

        <div style={cardStyle}>
          <div style={cardHeadStyle}>
            <span>📦</span>
            <span style={cardTitleStyle}>기본 정보</span>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>제품 선택 <Required /></label>
              <select value={form.product_id} onChange={handleProductChange} style={selectStyle}>
                <option value="">제품을 선택하세요</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.product_name} ({p.product_code})</option>)}
              </select>
            </div>

            {form.product_id && (
              <div style={fieldStyle}>
                <label style={labelStyle}>
                  작업 타입 선택 <Required />
                  {typesLoading && <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>로딩중...</span>}
                </label>
                {!typesLoading && types.length === 0 && (
                  <div style={{ padding: '12px 14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, color: '#854d0e', fontSize: 13 }}>
                    ⚠ 이 제품에 등록된 작업 타입이 없습니다. 공정 순서를 먼저 등록해주세요.
                  </div>
                )}
                {types.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {types.map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                        style={{ padding: '10px 20px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all .15s', borderColor: form.type === t ? '#2563eb' : '#e5e7eb', background: form.type === t ? '#eff6ff' : 'white', color: form.type === t ? '#2563eb' : '#374151' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={fieldStyle}>
              <label style={labelStyle}>시리얼 번호 <Required /></label>
              <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} placeholder="예: SN-005" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>작업 시작일 <Required /></label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>완료예정일 <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>(선택)</span></label>
                <input type="date" value={form.estimated_completion_date} onChange={e => setForm(f => ({ ...f, estimated_completion_date: e.target.value }))} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {processes.length > 0 && (
          <div style={cardStyle}>
            <div style={cardHeadStyle}>
              <span>⚙</span>
              <span style={cardTitleStyle}>자동 배정 공정</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: 99, fontWeight: 500 }}>
                {form.product_name} · 타입 {form.type} · {processes.length}개 공정
              </span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {processes.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                  <span style={{ background: '#1e3a5f', color: 'white', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontWeight: 600, color: '#111827', flex: 1 }}>{p.process_name || '미지정인공정'}</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{p.department_name || ''}</span>
                  {p.step_type && <span style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 99 }}>{p.step_type}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || processes.length === 0}
          style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', cursor: processes.length === 0 ? 'not-allowed' : 'pointer', background: loading || processes.length === 0 ? '#9ca3af' : '#1e3a5f', color: 'white', fontWeight: 700, fontSize: 16, transition: 'background .15s' }}>
          {loading ? '등록 중...' : processes.length === 0 ? '제품과 타입을 먼저 선택하세요' : '작업지시 등록'}
        </button>
      </div>
    </div>
  );
}

function Required() {
  return <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>;
}

const cardStyle     = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const cardHeadStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' };
const cardTitleStyle = { fontSize: 14, fontWeight: 700, color: '#374151' };
const fieldStyle     = { marginBottom: 18 };
const labelStyle     = { display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 8 };
const inputStyle     = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', color: '#111827' };
const selectStyle    = { ...inputStyle, cursor: 'pointer' };
