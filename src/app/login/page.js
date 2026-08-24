'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [empNo, setEmpNo]   = useState('');
  const [pw,    setPw]      = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!empNo || !pw) { setError('사번과 비밀번호를 입력하세요.'); return; }
    setLoading(true);
    setError('');
    try {
  const res  = await fetch('http://10.10.10.15:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ emp_id: empNo, password: pw }),  // employee_number → emp_id
});
const json = await res.json();
if (!res.ok) { setError(json.message || '로그인 실패'); return; }  // success → res.ok
localStorage.setItem('token', json.token);
localStorage.setItem('user',  JSON.stringify(json.user));
router.push('/dashboard');
    } catch (e) {
      setError('서버 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">

        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <img src="/LOGO.PNG" alt="THE SUN" className="h-16 object-contain mb-3"
            onError={e => { e.target.style.display='none'; }} />
          <h1 className="text-lg font-bold text-slate-800">MES System</h1>
          <p className="text-xs text-slate-400 mt-1">THE SUN CO., LTD.</p>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">사번</label>
            <input
              type="text"
              value={empNo}
              onChange={e => setEmpNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="사번을 입력하세요"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
