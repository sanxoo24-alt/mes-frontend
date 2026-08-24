'use client';
import { useState, useEffect, useCallback } from 'react';

const API = 'https://mes-backend-production-3a22.up.railway.app';
const fmt = (v) => v ? String(v).slice(0,10) : '-';

export default function SalesRegisterPage() {
  const [products,   setProducts]   = useState([]);
  const [types,      setTypes]      = useState([]);
  const [list,       setList]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [slideOpen,  setSlideOpen]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    product_id: '', template_name: '', serial_number: '',
    receipt_date: new Date().toISOString().slice(0,10),
    desired_delivery_date: '', note: ''
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/sales/list`);
      const data = await res.json();
      if (data.success) setList(data.list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    fetch(`${API}/api/sales/products`).then(r => r.json()).then(d => {
      if (d.success) setProducts(d.list);
    }).catch(console.error);
  }, []);

  const handleProductChange = async (product_id) => {
    setForm(f => ({ ...f, product_id, template_name: '' }));
    setTypes([]);
    if (!product_id) return;
    try {
      const res  = await fetch(`${API}/api/sales/types/${product_id}`);
      const data = await res.json();
      if (data.success) setTypes(data.list);
    } catch (e) { console.error(e); }
  };

  const closePanel = () => {
    setSlideOpen(false);
    setTypes([]);
    setForm({
      product_id: '', template_name: '', serial_number: '',
      receipt_date: new Date().toISOString().slice(0,10),
      desired_delivery_date: '', note: ''
    });
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.serial_number) { alert('제품과 S/N은 필수입니다.'); return; }
    if (!form.template_name) { alert('타입을 선택해주세요.'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/api/sales/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 입고 등록 완료\n접수번호: ${data.work_request_number}`);
        closePanel(); fetchList();
      } else { alert('등록 실패: ' + data.error); }
    } catch (e) { alert('오류가 발생했습니다.'); }
    finally { setSubmitting(false); }
  };

  const isValid = form.product_id && form.serial_number && form.template_name;

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:'#f8fafc', position:'relative' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', transition:'margin .3s', marginRight: slideOpen ? 460 : 0 }}>
        <div style={{ padding:'20px 24px 12px', fontSize:13, color:'#9ca3af' }}>
          영업 관리 <span style={{ margin:'0 4px' }}>›</span>
          <span style={{ color:'#374151', fontWeight:600 }}>제품 입고 등록</span>
        </div>
        <div style={{ padding:'0 24px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setSlideOpen(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#1e293b', color:'#fff', borderStyle:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <span style={{ fontSize:16 }}>+</span> 신규 입고 등록
          </button>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:12, color:'#9ca3af' }}>{list.length}건</span>
        </div>
        <div style={{ flex:1, overflow:'auto', padding:'0 24px 24px' }}>
          <div style={{ background:'#fff', borderRadius:12, borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.2fr 0.8fr 1fr 1fr 1fr 1.4fr', gap:8, padding:'11px 20px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
              {['접수번호','제품명','타입','S/N','입고일','납기희망일','특이사항'].map(h => (
                <span key={h} style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</span>
              ))}
            </div>
            {loading && <div style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>불러오는 중...</div>}
            {!loading && list.length === 0 && <div style={{ padding:60, textAlign:'center', color:'#9ca3af' }}>등록된 입고 이력이 없습니다</div>}
            {!loading && list.map((row, i) => (
              <div key={row.id}
                style={{ display:'grid', gridTemplateColumns:'1.2fr 1.2fr 0.8fr 1fr 1fr 1fr 1.4fr', gap:8, padding:'12px 20px', alignItems:'center', borderBottom: i < list.length-1 ? '1px solid #f8fafc' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize:12, fontWeight:600, color:'#2563eb', fontFamily:'monospace' }}>{row.work_request_number}</span>
                <span style={{ fontSize:12, color:'#374151' }}>{row.product_name || '-'}</span>
                <span style={{ fontSize:12, color:'#374151' }}>
                  {row.template_name ? (
                    <span style={{ background:'#eff6ff', color:'#2563eb', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600 }}>{row.template_name}</span>
                  ) : '-'}
                </span>
                <span style={{ fontSize:12, fontFamily:'monospace', color:'#6b7280' }}>{row.serial_number || '-'}</span>
                <span style={{ fontSize:12, color:'#374151' }}>{fmt(row.receipt_date)}</span>
                <span style={{ fontSize:12, color:'#374151' }}>{fmt(row.desired_delivery_date)}</span>
                <span style={{ fontSize:12, color:'#9ca3af', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{row.note || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position:'fixed', right:0, top:0, height:'100%', width:460, background:'#fff', borderLeft:'1px solid #e5e7eb', display:'flex', flexDirection:'column', boxShadow:'-4px 0 20px rgba(0,0,0,0.08)', transform: slideOpen ? 'translateX(0)' : 'translateX(100%)', transition:'transform .3s', zIndex:50 }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>신규 입고 등록</div>
          <button onClick={closePanel} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af' }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={lbl}>제품 <span style={{ color:'#dc2626' }}>*</span></label>
            <select value={form.product_id} onChange={e => handleProductChange(e.target.value)} style={inp}>
              <option value="">제품을 선택하세요</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.product_name} ({p.product_code})</option>)}
            </select>
          </div>

          {form.product_id && (
            <div>
              <label style={lbl}>타입 <span style={{ color:'#dc2626' }}>*</span></label>
              <select value={form.template_name} onChange={e => setForm(f => ({ ...f, template_name: e.target.value }))} style={inp}>
                <option value="">타입을 선택하세요</option>
                {types.map(t => <option key={t.id} value={t.type_name}>{t.type_name}</option>)}
              </select>
              {types.length === 0 && (
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>등록된 타입이 없습니다 (공정 순서 관리에서 추가)</div>
              )}
            </div>
          )}

          <div>
            <label style={lbl}>S/N <span style={{ color:'#dc2626' }}>*</span></label>
            <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number:e.target.value }))} placeholder="시리얼 번호 입력" style={inp} />
          </div>

          <div>
            <label style={lbl}>입고일</label>
            <input type="date" value={form.receipt_date} onChange={e => setForm(f => ({ ...f, receipt_date:e.target.value }))} style={inp} />
          </div>

          <div>
            <label style={lbl}>납기 희망일</label>
            <input type="date" value={form.desired_delivery_date} onChange={e => setForm(f => ({ ...f, desired_delivery_date:e.target.value }))} style={inp} />
          </div>

          <div>
            <label style={lbl}>특이사항</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note:e.target.value }))} placeholder="특이사항 입력 (선택)" rows={4} style={{ ...inp, resize:'none', fontFamily:'inherit' }} />
          </div>
        </div>

        <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={closePanel} style={{ flex:1, padding:'10px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', background:'#f9fafb', color:'#374151' }}>취소</button>
          <button onClick={handleSubmit} disabled={submitting || !isValid}
            style={{ flex:2, padding:'10px', borderRadius:8, fontSize:13, fontWeight:600, cursor: isValid ? 'pointer' : 'not-allowed', borderStyle:'none', background: isValid ? '#1e293b' : '#d1d5db', color:'#fff' }}>
            {submitting ? '등록 중...' : '입고 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 };
const inp = { width:'100%', padding:'10px 12px', borderRadius:8, borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' };
