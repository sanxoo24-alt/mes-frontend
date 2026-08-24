'use client';
import { useState, useEffect, useCallback } from 'react';

const API = 'https://mes-backend-production-3a22.up.railway.app/api/issues';

const JUDGMENTS = ['현장조치', '재작업', '부적합', '폐기'];
const JUDGMENT_STYLE = {
  '현장조치': { text: '#2563eb', bg: '#dbeafe' },
  '재작업':   { text: '#d97706', bg: '#fef3c7' },
  '부적합':   { text: '#dc2626', bg: '#fee2e2' },
  '폐기':     { text: '#7c3aed', bg: '#ede9fe' },
};
const SEV_STYLE = {
  Critical: { text: '#dc2626', bg: '#fee2e2' },
  Major:    { text: '#d97706', bg: '#fef3c7' },
  Minor:    { text: '#6b7280', bg: '#f3f4f6' },
  General:  { text: '#2563eb', bg: '#dbeafe' },
};

const fmt   = (v) => v ? String(v).slice(0,10) : '-';
const fmtDt = (v) => v ? new Date(v).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';

function Badge({ label, style }) {
  if (!label) return <span style={{ fontSize: 11, color: '#9ca3af' }}>-</span>;
  const s = style || { text: '#6b7280', bg: '#f3f4f6' };
  return <span style={{ display:'inline-flex', padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.text }}>{label}</span>;
}

function Spinner() {
  return <div style={{ textAlign:'center', padding:40, color:'#9ca3af', fontSize:13 }}>불러오는 중...</div>;
}

export default function IssuesPage() {
  const [tab,       setTab]       = useState('pending');
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [templates, setTemplates] = useState([]);
  const [form,      setForm]      = useState({ judgment: '', root_cause: '', countermeasures: '', template_name: '' });
  const [templateSteps, setTemplateSteps] = useState([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [keyword, setKeyword] = useState('');
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/pending`);
      const data = await res.json();
      if (data.success) setList(data.list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (from)    params.set('from', from);
      if (to)      params.set('to', to);
      const res  = await fetch(`${API}/history?${params}`);
      const data = await res.json();
      if (data.success) setList(data.list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [keyword, from, to]);

  useEffect(() => {
    setList([]);
    if (tab === 'pending') fetchPending();
    else fetchHistory();
  }, [tab]);

  useEffect(() => {
    fetch(`${API}/templates`).then(r => r.json()).then(d => {
      if (d.success) setTemplates(d.list);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!form.template_name) { setTemplateSteps([]); return; }
    fetch(`${API}/templates/${encodeURIComponent(form.template_name)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTemplateSteps(d.list); })
      .catch(console.error);
  }, [form.template_name]);

  const handleJudge = async () => {
    if (!form.judgment) { alert('판정을 선택해주세요.'); return; }
    if ((form.judgment === '재작업' || form.judgment === '현장조치') && !form.template_name) {
      if (!confirm('템플릿 없이 진행하시겠습니까?')) return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/${selected.id}/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgment:              form.judgment,
          root_cause:            form.root_cause,
          countermeasures:       form.countermeasures,
          template_name:         form.template_name || null,
          work_order_id:         selected.work_order_id,
          insert_after_sequence: selected.current_sequence || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 판정 완료\nNC번호: ${data.nc_number}${form.template_name ? '\n추가 공정이 삽입되었습니다' : ''}`);
        setSelected(null);
        setForm({ judgment: '', root_cause: '', countermeasures: '', template_name: '' });
        fetchPending();
      } else {
        alert('오류: ' + data.error);
      }
    } catch (e) { alert('오류가 발생했습니다.'); }
    finally { setSubmitting(false); }
  };

  const closePanel = () => {
    setSelected(null);
    setForm({ judgment: '', root_cause: '', countermeasures: '', template_name: '' });
    setTemplateSteps([]);
  };

  const needTemplate = form.judgment === '재작업' || form.judgment === '현장조치';

  return (
    <div style={{ display:'flex', height:'100%', position:'relative', overflow:'hidden', background:'#f8fafc' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', transition:'margin .3s', marginRight: selected ? 480 : 0 }}>
        <div style={{ padding:'20px 24px 12px', fontSize:13, color:'#9ca3af' }}>
          생산 관리 <span style={{ margin:'0 4px' }}>›</span>
          <span style={{ color:'#374151', fontWeight:600 }}>작업 이슈 현황</span>
        </div>

        <div style={{ padding:'0 24px', display:'flex', gap:4, marginBottom:16 }}>
          {[
            { key:'pending', label:'⚠ 미처리 이슈' },
            { key:'history', label:'📋 처리 이력' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
              borderStyle:'none',
              background: tab === t.key ? '#1e293b' : '#fff',
              color:      tab === t.key ? '#fff'    : '#6b7280',
              boxShadow:  tab === t.key ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
            }}>{t.label}</button>
          ))}
          <div style={{ flex:1 }} />
          {tab === 'pending' && (
            <button onClick={fetchPending} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', background:'#fff', color:'#6b7280' }}>새로고침</button>
          )}
        </div>

        {tab === 'history' && (
          <div style={{ padding:'0 24px 12px', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchHistory()}
                placeholder="작업지시번호, S/N, 제품명 검색..."
                style={{ width:'100%', padding:'8px 32px 8px 12px', borderRadius:8, borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box' }} />
              {keyword && <button onClick={() => setKeyword('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}>✕</button>}
            </div>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={dateInput} />
            <span style={{ color:'#9ca3af' }}>~</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={dateInput} />
            <button onClick={fetchHistory} style={btnPrimary}>검색</button>
          </div>
        )}

        <div style={{ flex:1, overflow:'auto', padding:'0 24px 24px' }}>
          <div style={{ background:'#fff', borderRadius:12, borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'grid', gridTemplateColumns: tab === 'pending' ? '0.8fr 1.3fr 1fr 0.7fr 1fr 0.8fr 1.4fr 1fr' : '0.8fr 1.3fr 1fr 0.7fr 1fr 0.8fr 1fr 1.4fr 1fr', gap:8, padding:'11px 20px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
              {(tab === 'pending'
                ? ['심각도','작업지시번호','제품명','S/N','공정명','발생시간','이슈 내용','보고자']
                : ['판정','작업지시번호','제품명','S/N','공정명','발생시간','이슈 내용','처리 결과','보고자']
              ).map(h => (
                <span key={h} style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</span>
              ))}
            </div>

            {loading && <Spinner />}

            {!loading && list.length === 0 && (
              <div style={{ padding:60, textAlign:'center', color:'#9ca3af', fontSize:14 }}>
                {tab === 'pending' ? '미처리 이슈가 없습니다 ✅' : '표시할 데이터가 없습니다'}
              </div>
            )}

            {!loading && list.map((row, i) => {
              const sevSt = SEV_STYLE[row.severity] || SEV_STYLE.General;
              const judSt = JUDGMENT_STYLE[row.judgment] || { text:'#6b7280', bg:'#f3f4f6' };
              const isSelected = selected?.id === row.id;
              return (
                <div key={row.id} onClick={() => { if (tab === 'pending') { setSelected(row); setForm({ judgment:'', root_cause:'', countermeasures:'', template_name:'' }); } }}
                  style={{
                    display:'grid',
                    gridTemplateColumns: tab === 'pending' ? '0.8fr 1.3fr 1fr 0.7fr 1fr 0.8fr 1.4fr 1fr' : '0.8fr 1.3fr 1fr 0.7fr 1fr 0.8fr 1fr 1.4fr 1fr',
                    gap:8, padding:'12px 20px', alignItems:'center',
                    borderBottom: i < list.length - 1 ? '1px solid #f8fafc' : 'none',
                    cursor: tab === 'pending' ? 'pointer' : 'default',
                    background: isSelected ? '#eff6ff' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {tab === 'pending' ? <Badge label={row.severity} style={sevSt} /> : <Badge label={row.judgment} style={judSt} />}
                  <span style={{ fontSize:12, fontWeight:600, color:'#1e3a5f', fontFamily:'monospace' }}>{row.work_order_number || '-'}</span>
                  <span style={{ fontSize:12, color:'#374151' }}>{row.product_name || '-'}</span>
                  <span style={{ fontSize:12, fontFamily:'monospace', color:'#6b7280' }}>{row.serial_number || '-'}</span>
                  <span style={{ fontSize:12, color:'#374151' }}>{row.process_name || '-'}</span>
                  <span style={{ fontSize:11, color:'#9ca3af' }}>{fmtDt(row.occurred_at)}</span>
                  {tab === 'history' && <span style={{ fontSize:11, color:'#6b7280', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{row.countermeasures || '-'}</span>}
                  <span style={{ fontSize:12, color:'#374151', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{row.issue_content || '-'}</span>
                  <span style={{ fontSize:12, color:'#6b7280' }}>{row.reporter_name || '-'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ position:'fixed', right:0, top:0, height:'100%', width:480, background:'#fff', borderLeft:'1px solid #e5e7eb', display:'flex', flexDirection:'column', boxShadow:'-4px 0 20px rgba(0,0,0,0.08)', transform: selected ? 'translateX(0)' : 'translateX(100%)', transition:'transform .3s', zIndex:50 }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>이슈 판정</div>
            {selected && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{selected.work_order_number} · {selected.process_name}</div>}
          </div>
          <button onClick={closePanel} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af', padding:4 }}>✕</button>
        </div>

        {selected && (
          <>
            <div style={{ flex:1, overflowY:'auto', padding:20 }}>
              <div style={{ background:'#fffbeb', borderRadius:10, padding:'14px', marginBottom:20, borderWidth:'1px', borderStyle:'solid', borderColor:'#fde047' }}>
                <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>이슈 내용</div>
                <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{selected.issue_content || '-'}</div>
                <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                  <Badge label={selected.severity} style={SEV_STYLE[selected.severity] || SEV_STYLE.General} />
                  <span style={{ fontSize:11, color:'#9ca3af' }}>S/N: {selected.serial_number}</span>
                  <span style={{ fontSize:11, color:'#9ca3af' }}>{fmtDt(selected.occurred_at)}</span>
                </div>
              </div>

              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:8 }}>판정 <span style={{ color:'#dc2626' }}>*</span></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {JUDGMENTS.map(j => {
                    const s = JUDGMENT_STYLE[j];
                    const on = form.judgment === j;
                    return (
                      <button key={j} onClick={() => setForm(f => ({ ...f, judgment:j, template_name:'' }))} style={{
                        padding:'10px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                        borderWidth:'2px', borderStyle:'solid',
                        borderColor: on ? s.text : '#e5e7eb',
                        background: on ? s.bg : '#fff',
                        color: on ? s.text : '#6b7280',
                      }}>{j}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>원인 분석</div>
                <textarea value={form.root_cause} onChange={e => setForm(f => ({ ...f, root_cause:e.target.value }))} placeholder="원인 분석 내용 입력" rows={3}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>대책사항</div>
                <textarea value={form.countermeasures} onChange={e => setForm(f => ({ ...f, countermeasures:e.target.value }))} placeholder="대책사항 입력" rows={3}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>

              {needTemplate && (
                <div style={{ marginBottom:14, background:'#f0fdf4', borderRadius:10, padding:14, borderWidth:'1px', borderStyle:'solid', borderColor:'#bbf7d0' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#166534', marginBottom:8 }}>추가 공정 템플릿 선택</div>
                  <select value={form.template_name} onChange={e => setForm(f => ({ ...f, template_name:e.target.value }))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', fontSize:13, outline:'none', background:'#fff', boxSizing:'border-box' }}>
                    <option value="">템플릿 선택 (선택 시 공정 삽입)</option>
                    {templates.map(t => <option key={t.template_name} value={t.template_name}>{t.template_name} ({t.step_count}단계)</option>)}
                  </select>
                  {templateSteps.length > 0 && (
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:11, color:'#6b7280', marginBottom:6 }}>추가될 공정</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {templateSteps.map((s, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#374151' }}>
                            <span style={{ width:18, height:18, borderRadius:'50%', background:'#166534', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                            <span>{s.process_name}</span>
                            <span style={{ fontSize:11, color:'#9ca3af' }}>({s.department_name})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', display:'flex', gap:10, flexShrink:0 }}>
              <button onClick={closePanel} style={{ flex:1, padding:'10px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', background:'#f9fafb', color:'#374151' }}>취소</button>
              <button onClick={handleJudge} disabled={submitting || !form.judgment} style={{ flex:2, padding:'10px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', borderStyle:'none', background: !form.judgment ? '#d1d5db' : '#1e293b', color:'#fff', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? '처리 중...' : '판정 완료'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const dateInput = { borderWidth:'1px', borderStyle:'solid', borderColor:'#e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#374151', background:'#fff', outline:'none' };
const btnPrimary = { background:'#1e293b', color:'#fff', borderStyle:'none', borderRadius:8, padding:'8px 20px', fontSize:13, fontWeight:600, cursor:'pointer' };
