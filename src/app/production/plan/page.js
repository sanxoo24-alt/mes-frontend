'use client';
import { useState, useEffect, useCallback } from 'react';

const API = 'http://10.10.10.15:4000';

const DAYS = ['일','월','화','수','목','금','토'];

const toYMD = (v) => {
  if (!v) return '';
  const d = new Date(new Date(v).getTime() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
};
const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('ko-KR') : '-';

const WORK_HOURS = 9;
function isWeekend(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === 0 || d.getDay() === 6;
}
function nextWorkDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function calcSchedule(startDate, steps) {
  let currentDate = startDate;
  while (isWeekend(currentDate)) currentDate = nextWorkDay(currentDate);
  let remainHours = WORK_HOURS;
  const result = [];
  for (const step of steps) {
    const tat = Number(step.tat) || 0;
    const scheduledDate = currentDate;
    if (tat === 0) { result.push({ ...step, scheduled_date: scheduledDate }); continue; }
    if (tat <= remainHours) {
      remainHours -= tat;
      if (remainHours <= 0) { currentDate = nextWorkDay(currentDate); remainHours = WORK_HOURS; }
      result.push({ ...step, scheduled_date: scheduledDate });
    } else {
      let hoursLeft = tat - remainHours;
      currentDate = nextWorkDay(currentDate);
      remainHours = WORK_HOURS;
      while (hoursLeft > WORK_HOURS) { hoursLeft -= WORK_HOURS; currentDate = nextWorkDay(currentDate); }
      remainHours -= hoursLeft;
      if (remainHours <= 0) { currentDate = nextWorkDay(currentDate); remainHours = WORK_HOURS; }
      result.push({ ...step, scheduled_date: currentDate });
    }
  }
  return result;
}

const DEPT_COLOR = {
  '검사 파트': { dot: '#2563eb', bg: '#dbeafe', color: '#1d4ed8', label: '검사' },
  '본딩 파트': { dot: '#d97706', bg: '#fef3c7', color: '#b45309', label: '본딩' },
  '가공 파트': { dot: '#dc2626', bg: '#fee2e2', color: '#b91c1c', label: '가공' },
  '자재팀':    { dot: '#7c3aed', bg: '#ede9fe', color: '#6d28d9', label: '자재' },
};
const getDeptColor = (deptName) => DEPT_COLOR[deptName] || { dot: '#6b7280', bg: '#f3f4f6', color: '#4b5563', label: deptName || '-' };

const STATUS_STEP = {
  'Scheduled': { label: '대기',     color: '#6b7280', bg: '#f3f4f6' },
  'PROC':      { label: '진행중',   color: '#2563eb', bg: '#dbeafe' },
  'Completed': { label: '완료',     color: '#059669', bg: '#d1fae5' },
  'Handover':  { label: '인수인계', color: '#d97706', bg: '#fef3c7' },
  'Pending':   { label: '예정',     color: '#9ca3af', bg: '#f9fafb' },
};

export default function PlanPage() {
  const [pending,      setPending]      = useState([]);
  const [cursor,       setCursor]       = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [newModal,     setNewModal]     = useState(null);
  const [inputDate,    setInputDate]    = useState('');
  const [previewSteps, setPreviewSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [dayPopup,     setDayPopup]     = useState(null);
  const [editModal,    setEditModal]    = useState(null);
  const [editSteps,    setEditSteps]    = useState([]);
  const [editReason,   setEditReason]   = useState('');
  const [editSaving,   setEditSaving]   = useState(false);
  const [showLogs,     setShowLogs]     = useState(false);

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  const loadPending = useCallback(async () => {
    const res  = await fetch(`${API}/api/production/plan`);
    const json = await res.json();
    if (json.success) setPending(json.pending);
  }, []);

  const loadCalendar = useCallback(async () => {
    const res  = await fetch(`${API}/api/production/plan/calendar?year=${year}&month=${month + 1}`);
    const json = await res.json();
    if (json.success) setCalendarData(json.list);
  }, [year, month]);

  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const load = () => { loadPending(); loadCalendar(); };

  const loadSteps = async (request, startDate) => {
    if (!request.product_id || !request.work_type) return;
    setLoadingSteps(true);
    try {
      const res  = await fetch(`${API}/api/production/plan/steps?product_id=${request.product_id}&type_name=${encodeURIComponent(request.work_type)}`);
      const json = await res.json();
      if (json.success) setPreviewSteps(calcSchedule(startDate, json.steps));
    } catch (e) { console.error(e); }
    finally { setLoadingSteps(false); }
  };

  const handleInputDateChange = (date) => {
    setInputDate(date);
    if (newModal && date) setPreviewSteps(calcSchedule(date, previewSteps));
  };

  const handleStepDateChange = (idx, date) => {
    setPreviewSteps(prev => prev.map((s, i) => i === idx ? { ...s, scheduled_date: date } : s));
  };

  const openNewModal = async (request) => {
    const start = todayYMD();
    setNewModal({ request });
    setInputDate(start);
    setPreviewSteps([]);
    await loadSteps(request, start);
  };

  const handleSchedule = async () => {
    if (!inputDate) { alert('투입일을 선택하세요.'); return; }
    if (previewSteps.length === 0) { alert('공정 정보가 없습니다.'); return; }
    setSubmitting(true);
    try {
      const lastDate = previewSteps[previewSteps.length - 1]?.scheduled_date || null;
      const res = await fetch(`${API}/api/production/plan/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id:      newModal.request.request_id,
          input_date:      inputDate,
          completion_date: lastDate,
          steps: previewSteps.map(s => ({
            sequence_order: s.sequence_order,
            process_id:     s.process_id,
            department_id:  s.department_id,
            scheduled_date: s.scheduled_date,
          })),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      alert(`✅ 작업지시 생성 완료!\n번호: ${json.work_order_number}`);
      setNewModal(null);
      load();
    } catch (e) {
      alert('오류: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (header_id, order_number) => {
    if (!confirm(`"${order_number}" 작업지시를 삭제하시겠습니까?\n삭제 후 대기 목록으로 돌아갑니다.`)) return;
    try {
      const res = await fetch(`${API}/api/production/plan/delete/${header_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      alert('✅ 작업지시가 삭제되었습니다.');
      setEditModal(null);
      setDayPopup(null);
      load();
    } catch (e) {
      alert('삭제 오류: ' + e.message);
    }
  };

  const handleDeleteRequest = async (request_id, work_request_number) => {
    if (!confirm(`"${work_request_number}" 입고 요청을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`${API}/api/production/plan/request/${request_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      alert('✅ 삭제되었습니다.');
      load();
    } catch (e) {
      alert('삭제 오류: ' + e.message);
    }
  };

  const getDateStr = (d) => d ? `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : '';

  const processesOnDay = (d) => {
    const ds = getDateStr(d);
    return calendarData.filter(c => toYMD(c.scheduled_date) === ds);
  };

  const groupByDept = (items) => {
    const groups = {};
    for (const item of items) {
      const dept = item.department_name || '기타';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(item);
    }
    return groups;
  };

  const handleDayClick = (d) => {
    const items = processesOnDay(d);
    if (items.length === 0) return;
    setDayPopup({ dateStr: getDateStr(d), items });
  };

  const openEditModal = async (header_id) => {
    setDayPopup(null);
    try {
      const [detailRes, logRes] = await Promise.all([
        fetch(`${API}/api/production/plan/detail/${header_id}`),
        fetch(`${API}/api/production/plan/logs/${header_id}`),
      ]);
      const detailJson = await detailRes.json();
      const logJson    = await logRes.json();
      if (detailJson.success) {
        setEditModal({ header: detailJson.header, logs: logJson.logs || [] });
        setEditSteps(detailJson.steps.map(s => ({ ...s, scheduled_date: toYMD(s.scheduled_date) })));
        setEditReason('');
        setShowLogs(false);
      }
    } catch (e) { alert('불러오기 오류: ' + e.message); }
  };

  const handleEditSave = async () => {
    if (!editReason.trim()) { alert('수정 사유를 입력해주세요.'); return; }
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/api/production/plan/update-schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          header_id:  editModal.header.id,
          steps:      editSteps.map(s => ({ detail_id: s.detail_id, scheduled_date: s.scheduled_date })),
          reason:     editReason,
          changed_by: 'admin',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      alert('✅ 일정 수정 완료!');
      setEditModal(null);
      load();
    } catch (e) {
      alert('오류: ' + e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells    = Array.from({ length: firstDay + lastDate }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  while (cells.length % 7 !== 0) cells.push(null);
  const todayStr     = todayYMD();
  const lastStepDate = previewSteps.length > 0 ? previewSteps[previewSteps.length - 1].scheduled_date : null;

  return (
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>📅</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>작업 계획</h1>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={cardStyle}>
            <div style={{ ...cardHeadStyle, justifyContent: 'space-between' }}>
              <span style={cardTitleStyle}>📦 대기중인 작업</span>
              <span style={{ background: '#dbeafe', color: '#2563eb', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{pending.length}건</span>
            </div>
            {pending.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>대기중인 작업이 없습니다</div>
            ) : (
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                {pending.map(p => (
                  <div key={p.request_id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 99 }}>{p.work_request_number}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>{p.work_type}</span>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteRequest(p.request_id, p.work_request_number); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', fontSize: 14, padding: '1px 3px', borderRadius: 4 }}
                          title="삭제"
                        >🗑️</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{p.product_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>S/N: {p.serial_number}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
                      입고: {fmtDate(p.receipt_date)}
                      {p.desired_delivery_date && ` · 납기: ${fmtDate(p.desired_delivery_date)}`}
                    </div>
                    <button onClick={() => openNewModal(p)} style={{ width: '100%', padding: '7px', borderRadius: 7, border: 'none', background: '#1e3a5f', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      작업지시 실행
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...cardStyle, marginTop: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 10 }}>부서 색상</div>
            {Object.entries(DEPT_COLOR).map(([name, c]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#374151' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={cardStyle}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={navBtn}>◀</button>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>📅 {year}년 {month+1}월</span>
                <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={navBtn}>▶</button>
              </div>
              <button onClick={loadCalendar} style={navBtn}>🔄 새로고침</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
              {DAYS.map((d, i) => (
                <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 600, color: i === 0 ? '#ef4444' : i === 6 ? '#2563eb' : '#6b7280' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((d, idx) => {
                const items    = d ? processesOnDay(d) : [];
                const grouped  = groupByDept(items);
                const depts    = Object.keys(grouped);
                const isToday  = getDateStr(d) === todayStr;
                const isSun    = idx % 7 === 0;
                const isSat    = idx % 7 === 6;
                const hasItems = items.length > 0;
                return (
                  <div key={idx}
                    onClick={() => d && hasItems && handleDayClick(d)}
                    style={{ minHeight: 100, borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', padding: '6px', background: d ? '#fff' : '#fafafa', cursor: hasItems ? 'pointer' : 'default', transition: 'background .1s' }}
                    onMouseEnter={e => { if (hasItems) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (d) e.currentTarget.style.background = d ? '#fff' : '#fafafa'; }}
                  >
                    {d && (
                      <>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isToday ? '#2563eb' : 'transparent', color: isToday ? '#fff' : isSun ? '#ef4444' : isSat ? '#2563eb' : '#374151', fontSize: 12, fontWeight: isToday ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>{d}</div>
                        {depts.map(dept => {
                          const dc    = getDeptColor(dept);
                          const procs = grouped[dept];
                          return (
                            <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, padding: '2px 5px', background: dc.bg, borderRadius: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dc.dot, flexShrink: 0 }} />
                              <span style={{ fontSize: 9, fontWeight: 700, color: dc.color, flex: 1 }}>{dc.label}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: dc.color, background: '#fff', padding: '0px 4px', borderRadius: 99 }}>{procs.length}건</span>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 날짜 클릭 팝업 */}
      {dayPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setDayPopup(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: 500, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', borderRadius: '14px 14px 0 0' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>📅 {dayPopup.dateStr} 작업 일정</span>
              <button onClick={() => setDayPopup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: 16 }}>
              {Object.entries(groupByDept(dayPopup.items)).map(([dept, procs]) => {
                const dc = getDeptColor(dept);
                const byOrder = procs.reduce((acc, p) => {
                  if (!acc[p.order_number]) acc[p.order_number] = { ...p, procs: [] };
                  acc[p.order_number].procs.push(p);
                  return acc;
                }, {});
                return (
                  <div key={dept} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: dc.bg, borderRadius: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dc.dot }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: dc.color }}>{dept}</span>
                      <span style={{ fontSize: 11, color: dc.color, marginLeft: 'auto' }}>{procs.length}건</span>
                    </div>
                    {Object.values(byOrder).map((order, oi) => (
                      <div key={oi}
                        onClick={() => openEditModal(order.header_id)}
                        style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', background: '#f9fafb' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={ev => ev.currentTarget.style.background = '#f9fafb'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{order.order_number}</span>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{order.product_name} · S/N {order.serial_number}</span>
                        </div>
                        {order.procs.map((proc, pi) => (
                          <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderTop: pi > 0 ? '1px solid #f3f4f6' : 'none' }}>
                            <span style={{ fontSize: 10, color: dc.color, background: dc.bg, padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{proc.process_name}</span>
                            <span style={{ fontSize: 10, color: '#9ca3af' }}>{proc.work_type}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 10, color: '#2563eb', marginTop: 6 }}>✏️ 클릭하여 일정 수정</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 일정 수정 모달 */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>✏️ 일정 수정</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {editModal.header.work_order_number} · {editModal.header.product_name} · S/N {editModal.header.serial_number}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => handleDeleteOrder(editModal.header.id, editModal.header.work_order_number)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff5f5', fontSize: 12, cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}
                >🗑️ 삭제</button>
                <button onClick={() => setShowLogs(!showLogs)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: showLogs ? '#f3f4f6' : '#fff', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}>
                  📋 수정 이력 {editModal.logs.length > 0 ? `(${editModal.logs.length})` : ''}
                </button>
                <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderBottom: '1px solid #f3f4f6', background: '#fffbeb', flexShrink: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                수정 사유 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                value={editReason}
                onChange={e => setEditReason(e.target.value)}
                placeholder="예: 야근으로 일정 단축, 자재 지연으로 일정 연기..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {showLogs && (
                <div style={{ marginBottom: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb', padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>📋 수정 이력</div>
                  {editModal.logs.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>수정 이력이 없습니다</div>
                  ) : (
                    editModal.logs.map((log, i) => (
                      <div key={i} style={{ padding: '10px 0', borderBottom: i < editModal.logs.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{log.process_name || '인수인계'}</span>
                          <span style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '1px 7px', borderRadius: 99 }}>
                            {log.before_date ? toYMD(log.before_date) : '-'}
                          </span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>→</span>
                          <span style={{ fontSize: 11, color: '#059669', background: '#d1fae5', padding: '1px 7px', borderRadius: 99 }}>
                            {log.after_date ? toYMD(log.after_date) : '-'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {log.reason && (
                            <span style={{ fontSize: 11, color: '#d97706', background: '#fef3c7', padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}>
                              📝 {log.reason}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>
                            {new Date(log.changed_at).toLocaleDateString('ko-KR')} {new Date(log.changed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>공정별 예정일 수정</div>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 130px', gap: 8, padding: '6px 10px', background: '#f9fafb', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                <span>#</span><span>공정명</span><span style={{ textAlign: 'center' }}>상태</span><span style={{ textAlign: 'center' }}>예정일</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {editSteps.map((s, i) => {
                  const st = STATUS_STEP[s.status] || STATUS_STEP['Pending'];
                  const isCompleted = s.status === 'Completed' || s.status === 'PROC';
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 130px', gap: 8, padding: '8px 10px', background: isCompleted ? '#f0fdf4' : '#f9fafb', borderRadius: 6, border: `1px solid ${isCompleted ? '#bbf7d0' : '#f3f4f6'}`, alignItems: 'center' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: isCompleted ? '#059669' : '#1e3a5f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{i+1}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{s.process_name || '인수인계'}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.department_name || '-'}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.bg, padding: '2px 6px', borderRadius: 99 }}>{st.label}</span>
                      </div>
                      <input
                        type="date"
                        value={s.scheduled_date || ''}
                        disabled={isCompleted}
                        onChange={e => setEditSteps(prev => prev.map((step, idx) => idx === i ? { ...step, scheduled_date: e.target.value } : step))}
                        style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', boxSizing: 'border-box', background: isCompleted ? '#f3f4f6' : '#fff', color: isCompleted ? '#9ca3af' : '#111827' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleEditSave} disabled={editSaving || !editReason.trim()}
                style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: (!editReason.trim() || editSaving) ? '#9ca3af' : '#1e3a5f', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {editSaving ? '저장 중...' : '💾 일정 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신규 작업지시 모달 */}
      {newModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setNewModal(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>📋 작업지시 실행</div>
              <button onClick={() => setNewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  <InfoRow label="제품명"   value={newModal.request.product_name} />
                  <InfoRow label="S/N"      value={newModal.request.serial_number} />
                  <InfoRow label="타입"     value={newModal.request.work_type} />
                  <InfoRow label="요청번호" value={newModal.request.work_request_number} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>투입 시작일 <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" value={inputDate} onChange={e => handleInputDateChange(e.target.value)} style={inputStyle} />
                {lastStepDate && <div style={{ fontSize: 12, color: '#2563eb', marginTop: 6, fontWeight: 600 }}>📅 예상 완료일: {lastStepDate}</div>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
                  공정별 일정 <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(날짜 직접 수정 가능)</span>
                </div>
                {loadingSteps ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>공정 정보 불러오는 중...</div>
                ) : previewSteps.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>등록된 공정 순서가 없습니다</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 120px', gap: 8, padding: '6px 10px', background: '#f9fafb', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>
                      <span>#</span><span>공정명</span><span style={{ textAlign: 'center' }}>TAT</span><span style={{ textAlign: 'center' }}>예정일</span>
                    </div>
                    {previewSteps.map((s, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 120px', gap: 8, padding: '8px 10px', background: !s.process_name ? '#fef9c3' : '#f9fafb', borderRadius: 6, border: '1px solid #f3f4f6', alignItems: 'center' }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: !s.process_name ? '#d97706' : '#1e3a5f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{i+1}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{s.process_name || '인수인계'}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.department_name || '-'}</div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280' }}>{s.tat ? `${s.tat}h` : '-'}</div>
                        <input type="date" value={s.scheduled_date || ''} onChange={e => handleStepDateChange(i, e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => setNewModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSchedule} disabled={submitting || previewSteps.length === 0}
                style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: (submitting || previewSteps.length === 0) ? '#9ca3af' : '#1e3a5f', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {submitting ? '생성 중...' : '작업지시 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value || '-'}</div>
    </div>
  );
}

const cardStyle      = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const cardHeadStyle  = { padding: '13px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', alignItems: 'center' };
const cardTitleStyle = { fontSize: 13, fontWeight: 700, color: '#374151' };
const navBtn         = { background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#374151' };
const labelStyle     = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle     = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#111827' };
