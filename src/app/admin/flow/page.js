'use client';
import { useState, useEffect } from 'react';

const STEP_TYPES = ['작업', '검사', '인수인계', '외주'];

export default function ProcessFlowPage() {
  const [products,     setProducts]     = useState([]);
  const [selectedProd, setSelectedProd] = useState(null);
  const [flows,        setFlows]        = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [allProcesses, setAllProcesses] = useState([]);
  const [saving,       setSaving]       = useState(false);

  const [typeModal, setTypeModal] = useState(false);
  const [newType,   setNewType]   = useState('');

  const [editSteps, setEditSteps] = useState([]);
  const [dirty,     setDirty]     = useState(false);

  useEffect(() => {
    fetch('https://mes-backend-production-3a22.up.railway.app/api/process-flow/products')
      .then(r => r.json()).then(d => setProducts(d.list || []));
    fetch('https://mes-backend-production-3a22.up.railway.app/api/process-flow/all-processes')
      .then(r => r.json()).then(d => setAllProcesses(d.list || []));
  }, []);

  const loadFlows = async (prod) => {
    const res  = await fetch(`https://mes-backend-production-3a22.up.railway.app/api/process-flow/${prod.id}`);
    const json = await res.json();
    if (json.success) {
      setFlows(json.list);
      setSelectedFlow(null);
      setEditSteps([]);
      setDirty(false);
    }
  };

  const handleSelectProd = (prod) => {
    setSelectedProd(prod);
    loadFlows(prod);
  };

  const handleSelectFlow = (flow) => {
    if (dirty && !confirm('저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return;
    setSelectedFlow(flow);
    setEditSteps(flow.steps.map((s, i) => ({
      ...s,
      step_id: s.step_id || s.id,
      sequence_order: i + 1,
      tat: s.tat || '',
    })));
    setDirty(false);
  };

  const handleAddType = async () => {
    if (!newType.trim()) return;
    const res  = await fetch('https://mes-backend-production-3a22.up.railway.app/api/process-flow/type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: selectedProd.id, type_name: newType.trim() }),
    });
    const json = await res.json();
    if (!json.success) { alert(json.error); return; }
    setTypeModal(false); setNewType('');
    loadFlows(selectedProd);
  };

  const handleDeleteType = async (flow) => {
    if (!confirm(`"${flow.type_name}" 타입과 모든 공정 순서를 삭제하시겠습니까?`)) return;
    await fetch(`https://mes-backend-production-3a22.up.railway.app/api/process-flow/type/${flow.id}`, { method: 'DELETE' });
    if (selectedFlow?.id === flow.id) { setSelectedFlow(null); setEditSteps([]); }
    loadFlows(selectedProd);
  };

  const handleAddStep = (proc) => {
    const already = editSteps.some(s => s.process_id === proc.id);
    if (already && !confirm(`"${proc.process_name}"이 이미 추가되어 있습니다. 중복 추가하시겠습니까?`)) return;
    const newStep = {
      step_id: `new_${Date.now()}`,
      process_id: proc.id,
      process_name: proc.process_name,
      process_code: proc.process_code,
      department_name: proc.department_name,
      sequence_order: editSteps.length + 1,
      step_type: '작업',
      tat: '',
      isNew: true,
    };
    setEditSteps(prev => [...prev, newStep]);
    setDirty(true);
  };

  const handleRemoveStep = (idx) => {
    setEditSteps(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((s, i) => ({ ...s, sequence_order: i + 1 }));
    });
    setDirty(true);
  };

  const moveStep = (idx, dir) => {
    setEditSteps(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, sequence_order: i + 1 }));
    });
    setDirty(true);
  };

  const handleStepType = (idx, val) => {
    setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, step_type: val } : s));
    setDirty(true);
  };

  const handleTat = (idx, val) => {
    setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, tat: val } : s));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedFlow) return;
    setSaving(true);
    try {
      const finalSteps = [];
      for (const s of editSteps) {
        if (s.isNew) {
          const res  = await fetch(`https://mes-backend-production-3a22.up.railway.app/api/process-flow/${selectedFlow.id}/steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              process_id: s.process_id,
              step_type: s.step_type,
              tat: s.tat !== '' ? Number(s.tat) : null,
            }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
          finalSteps.push({
            step_id: json.step_id || json.id,
            process_id: s.process_id,
            sequence_order: s.sequence_order,
            step_type: s.step_type,
            tat: s.tat !== '' ? Number(s.tat) : null,
          });
        } else {
          finalSteps.push({
            step_id: s.step_id,
            process_id: s.process_id,
            sequence_order: s.sequence_order,
            step_type: s.step_type,
            tat: s.tat !== '' ? Number(s.tat) : null,
          });
        }
      }

      await fetch(`https://mes-backend-production-3a22.up.railway.app/api/process-flow/${selectedFlow.id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: finalSteps }),
      });

      setDirty(false);
      const res  = await fetch(`https://mes-backend-production-3a22.up.railway.app/api/process-flow/${selectedProd.id}`);
      const json = await res.json();
      if (json.success) {
        setFlows(json.list);
        const refreshed = json.list.find(f => f.id === selectedFlow.id);
        if (refreshed) {
          setSelectedFlow(refreshed);
          setEditSteps(refreshed.steps.map((s, i) => ({
            ...s,
            step_id: s.step_id || s.id,
            sequence_order: i + 1,
            tat: s.tat || '',
          })));
        }
      }
      alert('✅ 저장 완료!');
    } catch (e) {
      alert('저장 오류: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeStep = async (idx) => {
    const step = editSteps[idx];
    if (!step.isNew) {
      await fetch(`https://mes-backend-production-3a22.up.railway.app/api/process-flow/step/${step.step_id}`, { method: 'DELETE' });
    }
    handleRemoveStep(idx);
  };

  const groupedProcesses = allProcesses.reduce((acc, p) => {
    const dept = p.department_name || '기타';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(p);
    return acc;
  }, {});

  const totalTat = editSteps.reduce((sum, s) => sum + (Number(s.tat) || 0), 0);

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 20 }}>⚙️</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>공정 순서 관리</h1>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ── 왼쪽: 제품 + 타입 선택 ── */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={cardStyle}>
            <div style={cardHeadStyle}>
              <span style={cardTitleStyle}>제품 선택</span>
            </div>
            <div style={{ padding: 12 }}>
              <select
                value={selectedProd?.id || ''}
                onChange={e => {
                  const prod = products.find(p => p.id === Number(e.target.value));
                  if (prod) handleSelectProd(prod);
                }}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #e5e7eb', fontSize: 13, color: '#111827',
                  outline: 'none', cursor: 'pointer', background: '#f9fafb'
                }}
              >
                <option value="">제품을 선택하세요</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.product_name} ({p.product_code})</option>
                ))}
              </select>
            </div>

            {selectedProd && (
              <>
                <div style={{ ...cardHeadStyle, borderTop: '1px solid #f3f4f6' }}>
                  <span style={cardTitleStyle}>타입 선택</span>
                  <button
                    onClick={() => setTypeModal(true)}
                    style={{
                      background: '#1e3a5f', color: '#fff', border: 'none',
                      borderRadius: 6, padding: '3px 10px', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >+ 추가</button>
                </div>
                <div style={{ padding: '6px 8px' }}>
                  {flows.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                      타입이 없습니다
                    </div>
                  ) : (
                    flows.map(flow => (
                      <div
                        key={flow.id}
                        onClick={() => handleSelectFlow(flow)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                          cursor: 'pointer',
                          background: selectedFlow?.id === flow.id ? '#eff6ff' : '#fff',
                          border: `1px solid ${selectedFlow?.id === flow.id ? '#bfdbfe' : '#f3f4f6'}`,
                        }}
                      >
                        <div>
                          <div style={{
                            fontSize: 14, fontWeight: 700,
                            color: selectedFlow?.id === flow.id ? '#2563eb' : '#111827'
                          }}>{flow.type_name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                            {flow.steps.length}개 공정
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {selectedFlow?.id === flow.id && (
                            <span style={{ color: '#2563eb', fontSize: 14 }}>›</span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteType(flow); }}
                            style={{
                              background: 'none', border: 'none',
                              color: '#fca5a5', cursor: 'pointer', fontSize: 14,
                              padding: '2px 4px', borderRadius: 4
                            }}
                          >✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 중간: 현재 공정 순서 편집 ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedFlow ? (
            <div style={{
              ...cardStyle, padding: '80px 20px',
              textAlign: 'center', color: '#9ca3af'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
              <div style={{ fontSize: 14 }}>
                {selectedProd ? '타입을 선택하면 공정 순서를 편집할 수 있습니다' : '제품과 타입을 선택하세요'}
              </div>
            </div>
          ) : (
            <div style={cardStyle}>
              {/* 헤더 */}
              <div style={{ ...cardHeadStyle, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={cardTitleStyle}>현재 공정 순서</span>
                  <span style={{
                    fontSize: 11, color: '#6b7280',
                    background: '#f3f4f6', padding: '2px 8px', borderRadius: 99
                  }}>{editSteps.length}개</span>
                  {totalTat > 0 && (
                    <span style={{
                      fontSize: 11, color: '#2563eb',
                      background: '#dbeafe', padding: '2px 8px', borderRadius: 99
                    }}>총 TAT: {totalTat}시간</span>
                  )}
                  {dirty && (
                    <span style={{
                      fontSize: 11, color: '#d97706',
                      background: '#fef3c7', padding: '2px 8px', borderRadius: 99
                    }}>● 수정됨</span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  style={{
                    background: dirty ? '#1e3a5f' : '#9ca3af',
                    color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 18px',
                    fontSize: 13, fontWeight: 700,
                    cursor: dirty ? 'pointer' : 'not-allowed'
                  }}
                >
                  {saving ? '저장 중...' : '💾 저장'}
                </button>
              </div>

              {/* 컬럼 헤더 */}
              {editSteps.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 14px', background: '#f9fafb',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: 11, color: '#9ca3af', fontWeight: 600
                }}>
                  <div style={{ width: 26 }}></div>
                  <div style={{ flex: 1 }}>공정명</div>
                  <div style={{ width: 100, textAlign: 'center' }}>타입</div>
                  <div style={{ width: 100, textAlign: 'center' }}>TAT (시간)</div>
                  <div style={{ width: 50, textAlign: 'center' }}>순서</div>
                  <div style={{ width: 32 }}></div>
                </div>
              )}

              <div style={{ padding: '12px 16px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {editSteps.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    오른쪽에서 공정을 추가하세요
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editSteps.map((s, i) => (
                      <div key={s.step_id || `step_${i}`} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: '#f9fafb', border: '1px solid #f3f4f6',
                        borderRadius: 8, padding: '10px 14px'
                      }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: '#1e3a5f', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0
                        }}>{i + 1}</span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                            {s.process_name || '-'}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                            {s.department_name || '-'} · {s.process_code || '-'}
                          </div>
                        </div>

                        <select
                          value={s.step_type || '작업'}
                          onChange={e => handleStepType(i, e.target.value)}
                          style={{
                            width: 100,
                            border: '1px solid #e5e7eb', borderRadius: 6,
                            padding: '4px 8px', fontSize: 11, color: '#374151',
                            background: '#fff', cursor: 'pointer', outline: 'none'
                          }}
                        >
                          {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <div style={{ width: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={s.tat}
                            onChange={e => handleTat(i, e.target.value)}
                            placeholder="0"
                            style={{
                              width: '100%', padding: '4px 8px', borderRadius: 6,
                              border: '1px solid #e5e7eb', fontSize: 12,
                              color: '#374151', outline: 'none', textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>h</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 50, alignItems: 'center' }}>
                          <button
                            onClick={() => moveStep(i, -1)} disabled={i === 0}
                            style={moveBtn(i === 0)}
                          >▲</button>
                          <button
                            onClick={() => moveStep(i, 1)} disabled={i === editSteps.length - 1}
                            style={moveBtn(i === editSteps.length - 1)}
                          >▼</button>
                        </div>

                        <button
                          onClick={() => removeStep(i)}
                          style={{
                            background: '#fee2e2', color: '#dc2626',
                            border: 'none', borderRadius: 6,
                            padding: '5px 8px', cursor: 'pointer', fontSize: 13, width: 32
                          }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 추가 가능한 공정 목록 ── */}
        {selectedFlow && (
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={cardStyle}>
              <div style={cardHeadStyle}>
                <span style={cardTitleStyle}>공정 추가</span>
              </div>
              <div style={{ padding: '8px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <div
                  onClick={() => handleAddStep({ id: null, process_name: '인수인계', process_code: 'HO', department_name: '-' })}
                  style={addProcStyle('#fef9c3', '#d97706')}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>⇄ 인수인계</div>
                  <span style={plusBtnStyle('#d97706')}>+ 추가</span>
                </div>

                {Object.entries(groupedProcesses).map(([dept, procs]) => (
                  <div key={dept}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: '#9ca3af',
                      letterSpacing: '0.08em',
                      padding: '8px 4px 4px', marginTop: 4
                    }}>{dept}</div>
                    {procs.map(proc => (
                      <div
                        key={proc.id}
                        onClick={() => handleAddStep(proc)}
                        style={addProcStyle('#fff', '#374151')}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
                            {proc.process_name}
                          </div>
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                            {dept}
                          </div>
                        </div>
                        <span style={plusBtnStyle('#2563eb')}>+ 추가</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 타입 추가 모달 ── */}
      {typeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={e => { if (e.target === e.currentTarget) setTypeModal(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: 14, padding: '28px',
            width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
              타입 추가
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                타입명 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                value={newType}
                onChange={e => setNewType(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddType()}
                placeholder="예: N, D, R1, CUSTOM ..."
                autoFocus
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 14,
                  boxSizing: 'border-box', outline: 'none'
                }}
              />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                작업지시 등록 시 타입으로 표시됩니다
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setTypeModal(false); setNewType(''); }} style={{
                flex: 1, padding: '10px', borderRadius: 8,
                border: '1px solid #e5e7eb', background: '#f9fafb',
                color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>취소</button>
              <button onClick={handleAddType} style={{
                flex: 2, padding: '10px', borderRadius: 8,
                border: 'none', background: '#1e3a5f',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 10, overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};
const cardHeadStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa'
};
const cardTitleStyle = { fontSize: 13, fontWeight: 700, color: '#374151' };

const moveBtn = (disabled) => ({
  background: disabled ? '#f9fafb' : '#f3f4f6',
  border: '1px solid #e5e7eb', borderRadius: 4,
  padding: '1px 6px', cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 10, color: disabled ? '#d1d5db' : '#374151'
});

const addProcStyle = (bg, color) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '9px 10px', borderRadius: 8, marginBottom: 4,
  background: bg, cursor: 'pointer', border: '1px solid #f3f4f6',
  transition: 'all .1s', color,
});

const plusBtnStyle = (color) => ({
  fontSize: 11, fontWeight: 700, color,
  background: color === '#d97706' ? '#fef3c7' : '#eff6ff',
  padding: '2px 8px', borderRadius: 99, flexShrink: 0
});
