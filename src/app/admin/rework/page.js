'use client';
import { useState, useEffect } from 'react';

const STEP_TYPES = ['작업', '검사', '인수인계', '외주'];

export default function AdditionalProcessPage() {
  const [list,         setList]         = useState([]);
  const [keyword,      setKeyword]      = useState('');
  const [allProcesses, setAllProcesses] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [modal,        setModal]        = useState(null);
  const [tplName,      setTplName]      = useState('');
  const [steps,        setSteps]        = useState([]);
  const [saving,       setSaving]       = useState(false);

  const load = async (kw = '') => {
    setLoading(true);
    const res  = await fetch(`https://mes-backend-production-3a22.up.railway.app/api/additional-process${kw ? `?keyword=${kw}` : ''}`);
    const json = await res.json();
    if (json.success) setList(json.list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch('https://mes-backend-production-3a22.up.railway.app/api/process-flow/all-processes')
      .then(r => r.json()).then(d => setAllProcesses(d.list || []));
  }, []);

  const loadDetail = async (template_name) => {
    const res  = await fetch(`https://mes-backend-production-3a22.up.railway.app/api/additional-process/${encodeURIComponent(template_name)}`);
    const json = await res.json();
    return json.list || [];
  };

  const openCreate = () => {
    setTplName('');
    setSteps([]);
    setModal({ mode: 'create' });
  };

  const openEdit = async (row) => {
    const detail = await loadDetail(row.template_name);
    setTplName(row.template_name);
    setSteps(detail.map((s, i) => ({
      process_id:      s.process_id,
      process_name:    s.process_name,
      process_code:    s.process_code,
      department_name: s.department_name,
      step_type:       s.step_type,
      sequence_order:  i + 1,
    })));
    setModal({ mode: 'edit', template_name: row.template_name });
  };

  const handleDelete = async (template_name) => {
    if (!confirm(`"${template_name}" 템플릿을 삭제하시겠습니까?`)) return;
    await fetch(`https://mes-backend-production-3a22.up.railway.app/api/additional-process/${encodeURIComponent(template_name)}`, { method: 'DELETE' });
    load(keyword);
  };

  const addStep = (proc) => {
    setSteps(prev => [...prev, {
      process_id:      proc.id,
      process_name:    proc.process_name,
      process_code:    proc.process_code,
      department_name: proc.department_name,
      step_type:       '작업',
      sequence_order:  prev.length + 1,
    }]);
  };

  const removeStep = (idx) => {
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequence_order: i + 1 })));
  };

  const moveStep = (idx, dir) => {
    setSteps(prev => {
      const next   = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, sequence_order: i + 1 }));
    });
  };

  const handleStepType = (idx, val) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, step_type: val } : s));
  };

  const handleSave = async () => {
    if (!tplName.trim()) { alert('템플릿명을 입력하세요.'); return; }
    if (steps.length === 0) { alert('공정을 최소 1개 추가하세요.'); return; }
    setSaving(true);
    try {
      const body = {
        template_name: tplName.trim(),
        steps: steps.map((s, i) => ({
          process_id:     s.process_id,
          step_type:      s.step_type,
          sequence_order: i + 1,
        })),
      };
      let res;
      if (modal.mode === 'create') {
        res = await fetch('https://mes-backend-production-3a22.up.railway.app/api/additional-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`https://mes-backend-production-3a22.up.railway.app/api/additional-process/${encodeURIComponent(modal.template_name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, new_name: tplName.trim() }),
        });
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setModal(null);
      load(keyword);
    } catch (e) {
      alert('오류: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (v) => v ? new Date(v).toLocaleDateString('ko-KR') : '-';

  const grouped = allProcesses.reduce((acc, p) => {
    const d = p.department_name || '기타';
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 20 }}>🔧</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>추가 작업 순서 관리</h1>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <span style={{ color: '#9ca3af' }}>🔍</span>
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(keyword)}
          placeholder="템플릿명 검색..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111827', background: 'transparent' }}
        />
        {keyword && (
          <button onClick={() => { setKeyword(''); load(''); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.5fr 1fr 0.8fr', padding: '11px 20px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
          {['템플릿명', '공정 수', '최종 수정일', ''].map(h => (
            <span key={h} style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>불러오는 중...</div>}
        {!loading && list.length === 0 && <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>등록된 템플릿이 없습니다.</div>}

        {!loading && list.map((row, i) => (
          <div
            key={row.template_name}
            style={{ display: 'grid', gridTemplateColumns: '1fr 0.5fr 1fr 0.8fr', padding: '13px 20px', alignItems: 'center', borderBottom: i < list.length - 1 ? '1px solid #f9fafb' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{row.template_name}</span>
            <span style={{ display: 'inline-flex', background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, width: 'fit-content' }}>
              {row.process_count}개
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{fmtDate(row.last_updated)}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(row)} style={btnEdit}>수정</button>
              <button onClick={() => handleDelete(row.template_name)} style={btnDel}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={openCreate} style={{ position: 'fixed', bottom: 32, right: 32, width: 52, height: 52, borderRadius: '50%', background: '#1e3a5f', color: '#fff', border: 'none', fontSize: 24, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: 820, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                {modal.mode === 'create' ? '✨ 새 템플릿 만들기' : '✏️ 템플릿 수정'}
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
            </div>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                템플릿명 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                value={tplName}
                onChange={e => setTplName(e.target.value)}
                placeholder="예: 스크래치 제거, 재본딩, 외주 가공..."
                autoFocus
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', borderRight: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                  공정 순서
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 99 }}>{steps.length}개</span>
                </div>
                {steps.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>오른쪽에서 공정을 추가하세요</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, padding: '10px 12px' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e3a5f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.process_name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.department_name || '-'}</div>
                        </div>
                        <select value={s.step_type} onChange={e => handleStepType(i, e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 11, background: '#fff', cursor: 'pointer', outline: 'none' }}>
                          {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button onClick={() => moveStep(i, -1)} disabled={i === 0} style={mvBtn(i === 0)}>▲</button>
                          <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} style={mvBtn(i === steps.length - 1)}>▼</button>
                        </div>
                        <button onClick={() => removeStep(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ width: 240, flexShrink: 0, padding: '16px', overflowY: 'auto', background: '#fafafa' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>공정 추가</div>
                {Object.entries(grouped).map(([dept, procs]) => (
                  <div key={dept}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 0 4px', marginTop: 4 }}>{dept}</div>
                    {procs.map(proc => (
                      <div key={proc.id} onClick={() => addStep(proc)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: '#fff', border: '1px solid #f3f4f6', cursor: 'pointer', transition: 'all .1s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#bfdbfe'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#f3f4f6'}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{proc.process_name}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{dept}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: 99 }}>+ 추가</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: saving ? '#9ca3af' : '#1e3a5f', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? '저장중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnEdit = { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const btnDel  = { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const mvBtn = (disabled) => ({ background: disabled ? '#f9fafb' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 5px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 10, color: disabled ? '#d1d5db' : '#374151' });
