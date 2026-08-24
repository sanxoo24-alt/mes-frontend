'use client';
import { useState, useEffect, useCallback } from 'react';

const API       = 'http://10.10.10.15:4000/api/workstation';
const ISSUE_API = 'http://10.10.10.15:4000/api/issues';

const DEPTS = [
  { id: 1, name: '가공파트' },
  { id: 2, name: '검사파트' },
  { id: 3, name: '본딩파트' },
];

const SYMPTOMS   = ['치수불량', '외관불량', '이물질', '미접합', '박리', '기타'];
const SEVERITIES = ['General', 'Minor', 'Major', 'Critical'];

const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const fmtTime = (v) => v ? new Date(v).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// ✅ issue_memo 파싱 함수
const parseIssueMemo = (memo) => {
  if (!memo) return null;
  try { return JSON.parse(memo); } catch { return null; }
};

function IssueModal({ item, onClose, onSubmit }) {
  const [symptoms,   setSymptoms]   = useState([]);
  const [detail,     setDetail]     = useState('');
  const [severity,   setSeverity]   = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const toggleSymptom = (s) =>
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const SEV_COLOR = {
    General:  { bg: '#dbeafe', color: '#2563eb' },
    Minor:    { bg: '#f3f4f6', color: '#6b7280' },
    Major:    { bg: '#fef3c7', color: '#d97706' },
    Critical: { bg: '#fee2e2', color: '#dc2626' },
  };

  const handleSubmit = async () => {
    if (!symptoms.length && !detail.trim()) {
      alert('증상 또는 상세 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    const issue_content = [
      symptoms.length ? `[증상] ${symptoms.join(', ')}` : '',
      detail.trim()   ? `[내용] ${detail.trim()}`       : '',
    ].filter(Boolean).join(' / ');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(ISSUE_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_order_id: item.header_id,
          process_id:    item.process_id,
          product_id:    item.product_id,
          issue_content,
          severity,
          issue_type: '작업이슈',
          created_by_id: user.emp_id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`⚠️ 이슈 접수 완료\n코드: ${data.issue_code}\n생산관리 담당자에게 전달되었습니다.`);
        onSubmit();
        onClose();
      } else {
        alert('오류: ' + data.error);
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 14, width: 480, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>⚠️ 이슈 보고</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {item.order_number} · {item.process_name} · S/N {item.serial_number}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>증상 선택 (복수 가능)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SYMPTOMS.map(s => {
                const on = symptoms.includes(s);
                return (
                  <button key={s} onClick={() => toggleSymptom(s)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    borderWidth: '1.5px', borderStyle: 'solid',
                    borderColor: on ? '#f59f00' : '#e5e7eb',
                    background: on ? '#fef3c7' : '#fff',
                    color: on ? '#d97706' : '#6b7280',
                  }}>{s}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>상세 내용</div>
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="이슈 발생 상황 및 상세 내용을 입력하세요.."
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, borderWidth: '1px', borderStyle: 'solid', borderColor: '#e5e7eb', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>심각도</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SEVERITIES.map(sv => {
                const on = severity === sv;
                const c  = SEV_COLOR[sv];
                return (
                  <button key={sv} onClick={() => setSeverity(sv)} style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    borderWidth: '1.5px', borderStyle: 'solid',
                    borderColor: on ? c.color : '#e5e7eb',
                    background: on ? c.bg : '#fff',
                    color: on ? c.color : '#9ca3af',
                  }}>{sv}</button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', borderWidth: '1px', borderStyle: 'solid', borderColor: '#e5e7eb', background: '#f9fafb', color: '#374151' }}>취소</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', borderStyle: 'none', background: '#f59f00', color: '#fff', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? '접수 중..' : '⚠️ 이슈 접수'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ 이슈 메모 팝업 모달
function IssueMemoModal({ memo, onClose }) {
  if (!memo) return null;
  const JUDGMENT_COLOR = {
    '현장조치': { bg: '#dbeafe', color: '#2563eb' },
    '재작업':   { bg: '#fef3c7', color: '#d97706' },
    '부적합':   { bg: '#fee2e2', color: '#dc2626' },
    '폐기':     { bg: '#ede9fe', color: '#7c3aed' },
  };
  const jc = JUDGMENT_COLOR[memo.judgment] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 14, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a3412' }}>📋 이슈 처리 정보</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>✕</button>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>이슈 내용</div>
            <div style={{ fontSize: 13, color: '#374151', background: '#fef3c7', padding: '10px 12px', borderRadius: 8, lineHeight: 1.6 }}>
              {memo.issue_content || '-'}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>판정 결과</div>
            <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: jc.bg, color: jc.color }}>
              {memo.judgment || '-'}
            </span>
          </div>
          {memo.template_name && (
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>적용 템플릿</div>
              <div style={{ fontSize: 13, color: '#374151' }}>{memo.template_name}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <div style={S.tHead}>
      {['작업지시번호', '타입', '제품명', 'S/N', '공정', '예정일', '작업 수행'].map(h => (
        <span key={h} style={S.thCell}>{h}</span>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return <div style={S.empty}>{text}</div>;
}

function Row({ item, section, onAction, onIssue, onMemo }) {
  const showWarn = section === 'waiting' || section === 'inProgress' || section === 'handover';
  const memo = parseIssueMemo(item.issue_memo);

  return (
    <div style={S.tRow}>
      <span style={{ ...S.td, fontWeight: 500 }}>{item.order_number || '-'}</span>
      <span style={S.td}>
        <span style={S.badge}>{item.work_type || item.process_code || '-'}</span>
      </span>
      <span style={S.td}>{item.product_name || '-'}</span>
      <span style={S.td}>{item.serial_number || '-'}</span>
      <span style={{ ...S.td, color: '#3b5bdb' }}>
        {item.process_name || (section === 'handover' ? '인수인계' : '-')}
      </span>
      <span style={S.td}>{fmtDate(item.planned_date)}</span>
      <span style={{ ...S.td, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* ✅ 이슈로 삽입된 공정 - 이슈 정보 배지 표시 */}
        {memo && (
          <button
            onClick={() => onMemo(memo)}
            title="이슈 처리 정보 보기"
            style={{
              fontSize: 11, fontWeight: 600, color: '#d97706',
              background: '#fef3c7', padding: '3px 8px',
              borderRadius: 20, border: '1px solid #fde68a',
              cursor: 'pointer'
            }}
          >📋 이슈작업</button>
        )}

        {section === 'handover' && (
          <button onClick={() => onAction('accept', item.detail_id)} style={S.btnAccept}>수락</button>
        )}
        {section === 'waiting' && (
          <button onClick={() => onAction('start', item.detail_id)} style={S.btnStart}>시작</button>
        )}
        {section === 'inProgress' && (
          <button onClick={() => onAction('end', item.detail_id)} style={S.btnEnd}>완료</button>
        )}
        {section === 'done' && (
          <span style={S.doneTime}>{fmtTime(item.end_time)}</span>
        )}
        {/* ✅ 이슈중 섹션은 버튼 없이 배지만 표시 */}
        {section === 'issue' && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#dc2626',
            background: '#fee2e2', padding: '3px 10px',
            borderRadius: 20, border: '1px solid #fca5a5'
          }}>🔴 이슈처리중</span>
        )}
        {showWarn && (
          <button
            onClick={() => onIssue(item)}
            title="이슈 보고"
            style={{ background: 'none', borderStyle: 'none', cursor: 'pointer', fontSize: 15, color: '#f59f00', padding: '2px 4px', borderRadius: 4, lineHeight: 1 }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >⚠️</button>
        )}
      </span>
    </div>
  );
}

function Section({ title, icon, count, variant = 'default', children }) {
  const wrapV  = { yellow: S.secWrapY, blue: S.secWrapB, green: S.secWrapG, red: S.secWrapR }[variant] || {};
  const countV = { default: S.cntGray, blue: S.cntBlue, green: S.cntGreen, red: S.cntRed }[variant] || S.cntBlue;
  const titleC = { blue: '#3b5bdb', green: '#2f9e44', red: '#dc2626' }[variant] || '#1a1a2e';
  return (
    <div style={{ ...S.secWrap, ...wrapV }}>
      <div style={S.secHead}>
        <span style={{ ...S.secTitle, color: titleC }}>{icon} {title}</span>
        <span style={{ ...S.secCnt, ...countV }}>{count}건</span>
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

export default function WorkstationPage() {
  const [deptId,    setDeptId]    = useState(2);
  const [data,      setData]      = useState({
    stats: { goal: 0, inProgress: 0, completed: 0 },
    handovers: [], waiting: [], inProgress: [], completed: [], issues: [],
  });
  const [loading,   setLoading]   = useState(false);
  const [issueItem, setIssueItem] = useState(null);
  const [memoData,  setMemoData]  = useState(null); // ✅ 이슈 메모 팝업

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/today?department_id=${deptId}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [deptId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (type, id) => {
    const msg = { start: '작업을 시작하시겠습니까?', end: '작업을 완료하시겠습니까?', accept: '인수인계를 수락하시겠습니까?' };
    if (!confirm(msg[type])) return;
    const ep = { start: 'start', end: 'end', accept: 'accept' }[type];
    await post(`${API}/${ep}`, { detail_id: id });
    load();
  };

  const { stats, handovers, waiting, inProgress, completed, issues } = data;
  const pct    = stats.goal > 0 ? Math.round((stats.completed / stats.goal) * 100) : 0;
  const R      = 20;
  const circ   = 2 * Math.PI * R;
  const offset = circ * (1 - pct / 100);

  return (
    <div style={S.page}>
      {issueItem && (
        <IssueModal item={issueItem} onClose={() => setIssueItem(null)} onSubmit={load} />
      )}
      {memoData && (
        <IssueMemoModal memo={memoData} onClose={() => setMemoData(null)} />
      )}

      <div style={S.deptRow}>
        {DEPTS.map(d => (
          <button key={d.id} onClick={() => setDeptId(d.id)} style={deptId === d.id ? S.deptOn : S.deptBtn}>
            {d.name}
          </button>
        ))}
      </div>

      <div style={S.statsCard}>
        {[['목표', stats.goal, '#1a1a2e'], ['진행', stats.inProgress, '#3b5bdb'], ['완료', stats.completed, '#2f9e44']].map(([lbl, val, c]) => (
          <div key={lbl} style={S.statItem}>
            <div style={S.statLbl}>{lbl}</div>
            <div style={{ ...S.statVal, color: c }}>{val}</div>
          </div>
        ))}
        <div style={S.circWrap}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={R} fill="none" stroke="#eee" strokeWidth="4"/>
            <circle cx="26" cy="26" r={R} fill="none" stroke="#3b5bdb" strokeWidth="4"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 26 26)"/>
          </svg>
          <span style={S.circTxt}>{pct}%</span>
        </div>
      </div>

      {loading && <div style={S.loadingTxt}>불러오는 중..</div>}

      {/* ✅ 이슈처리중 섹션 */}
      {issues && issues.length > 0 && (
        <Section title="이슈 처리중" icon="🔴" count={issues.length} variant="red">
          <TableHeader />
          {issues.map(i => <Row key={i.detail_id} item={i} section="issue" onAction={handleAction} onIssue={setIssueItem} onMemo={setMemoData} />)}
        </Section>
      )}

      <Section title="인수인계 대기" icon="🔄" count={handovers.length} variant="yellow">
        <TableHeader />
        {handovers.length === 0
          ? <Empty text="없음" />
          : handovers.map(i => <Row key={i.detail_id} item={i} section="handover" onAction={handleAction} onIssue={setIssueItem} onMemo={setMemoData} />)}
      </Section>

      <Section title="대기중" icon="⏳" count={waiting.length}>
        <TableHeader />
        {waiting.length === 0
          ? <Empty text="작업 없음" />
          : waiting.map(i => <Row key={i.detail_id} item={i} section="waiting" onAction={handleAction} onIssue={setIssueItem} onMemo={setMemoData} />)}
      </Section>

      <Section title="진행중" icon="🔧" count={inProgress.length} variant="blue">
        <TableHeader />
        {inProgress.length === 0
          ? <Empty text="작업 없음" />
          : inProgress.map(i => <Row key={i.detail_id} item={i} section="inProgress" onAction={handleAction} onIssue={setIssueItem} onMemo={setMemoData} />)}
      </Section>

      <Section title="금일 완료" icon="✅" count={completed.length} variant="green">
        <TableHeader />
        {completed.length === 0
          ? <Empty text="완료된 작업 없음" />
          : completed.map(i => <Row key={i.detail_id} item={i} section="done" onAction={handleAction} onIssue={setIssueItem} onMemo={setMemoData} />)}
      </Section>
    </div>
  );
}

const S = {
  page:      { padding: '16px 20px', background: '#f4f5f7', minHeight: '100vh' },
  deptRow:   { display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 14 },
  deptBtn:   { padding: '7px 18px', borderRadius: 20, borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#ddd', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#666' },
  deptOn:    { padding: '7px 18px', borderRadius: 20, borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#1a1a2e', background: '#1a1a2e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  statsCard: { background: '#fff', borderRadius: 10, borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#e8e8ee', padding: '14px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 28 },
  statItem:  { textAlign: 'left' },
  statLbl:   { fontSize: 10, color: '#aaa', marginBottom: 2 },
  statVal:   { fontSize: 24, fontWeight: 700 },
  circWrap:  { position: 'relative', width: 52, height: 52, marginLeft: 8 },
  circTxt:   { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 11, fontWeight: 600, color: '#3b5bdb' },
  loadingTxt: { textAlign: 'center', padding: 20, color: '#888', fontSize: 13 },
  secWrap:   { background: '#fff', borderRadius: 10, borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#e8e8ee', marginBottom: 12, overflow: 'hidden' },
  secWrapY:  { background: '#fffdf0', borderColor: '#f5e070' },
  secWrapB:  { borderColor: '#c0d0ff' },
  secWrapG:  { background: '#f0fff4', borderColor: '#69db7c' },
  secWrapR:  { background: '#fff5f5', borderColor: '#fca5a5' },
  secHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottomWidth: '0.5px', borderBottomStyle: 'solid', borderBottomColor: 'rgba(0,0,0,0.06)' },
  secTitle:  { fontSize: 13, fontWeight: 600 },
  secCnt:    { fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 },
  cntGray:   { background: '#f0f0f0', color: '#888' },
  cntBlue:   { background: '#e8eeff', color: '#3b5bdb' },
  cntGreen:  { background: '#ebfbee', color: '#2f9e44' },
  cntRed:    { background: '#fee2e2', color: '#dc2626' },
  tHead:     { display: 'grid', gridTemplateColumns: '2fr 0.7fr 1.5fr 0.8fr 1.2fr 1fr 1.5fr', gap: 8, padding: '8px 16px', background: 'rgba(0,0,0,0.02)', borderBottomWidth: '0.5px', borderBottomStyle: 'solid', borderBottomColor: '#eee' },
  thCell:    { fontSize: 11, color: '#888', fontWeight: 500 },
  tRow:      { display: 'grid', gridTemplateColumns: '2fr 0.7fr 1.5fr 0.8fr 1.2fr 1fr 1.5fr', gap: 8, padding: '10px 16px', borderBottomWidth: '0.5px', borderBottomStyle: 'solid', borderBottomColor: '#f5f5f5', alignItems: 'center' },
  td:        { fontSize: 12, color: '#333' },
  badge:     { display: 'inline-flex', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#e8eeff', color: '#3b5bdb' },
  btnStart:  { background: '#1a1a2e', color: '#fff', borderStyle: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 500 },
  btnEnd:    { background: '#2f9e44', color: '#fff', borderStyle: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 500 },
  btnAccept: { background: '#3b5bdb', color: '#fff', borderStyle: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 500 },
  doneTime:  { fontSize: 11, color: '#888' },
  empty:     { padding: '20px', textAlign: 'center', color: '#bbb', fontSize: 12 },
};
