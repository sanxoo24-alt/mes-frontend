'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ProductPage() {
  const [products,   setProducts]   = useState([]);
  const [keyword,    setKeyword]    = useState('');
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState({ product_code: '', product_name: '', note: '' });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res  = await fetch('http://10.10.10.15:4000/api/products');
      const data = await res.json();
      setProducts(data.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p =>
    p.product_code.toLowerCase().includes(keyword.toLowerCase()) ||
    p.product_name.toLowerCase().includes(keyword.toLowerCase())
  );

  const openNew = () => {
    setEditTarget(null);
    setForm({ product_code: '', product_name: '', note: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditTarget(p);
    setForm({ product_code: p.product_code, product_name: p.product_name, note: p.note || '' });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSave = async () => {
    if (!form.product_code || !form.product_name) {
      setError('제품코드와 제품명은 필수입니다.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url    = editTarget ? `http://10.10.10.15:4000/api/products/${editTarget.id}` : 'http://10.10.10.15:4000/api/products';
      const method = editTarget ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, is_active: editTarget?.is_active ?? 1 }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      await fetchProducts();
      closeModal();
    } catch (e) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    await fetch(`http://10.10.10.15:4000/api/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, is_active: p.is_active ? 0 : 1 }),
    });
    fetchProducts();
  };

  return (
    <div className="relative min-h-full">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <span>등록/관리</span>
        <span>&gt;</span>
        <span className="text-slate-700 font-medium">제품 등록</span>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="제품명, 코드로 검색..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
        />
        {keyword && (
          <button onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-left font-semibold text-slate-600">제품 코드</th>
              <th className="px-5 py-3 text-left font-semibold text-slate-600">제품명</th>
              <th className="px-5 py-3 text-left font-semibold text-slate-600">비고</th>
              <th className="px-5 py-3 text-center font-semibold text-slate-600">사용유무</th>
              <th className="px-5 py-3 text-center font-semibold text-slate-600">수정</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-16 text-slate-400">불러오는 중...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16 text-slate-400">표시할 데이터가 없습니다.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!p.is_active ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-3 font-mono font-semibold text-slate-700">{p.product_code}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{p.product_name}</td>
                  <td className="px-5 py-3 text-slate-500">{p.note || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => toggleActive(p)}>
                      {p.is_active
                        ? <ToggleRight size={24} className="text-blue-500 mx-auto" />
                        : <ToggleLeft  size={24} className="text-slate-300 mx-auto" />
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2 px-1">총 {filtered.length}개</p>

      <button onClick={openNew} className="fixed bottom-8 right-8 w-14 h-14 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 transition flex items-center justify-center z-40">
        <Plus size={24} />
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">
                {editTarget ? '제품 수정' : '신규 제품 등록'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg transition">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  제품코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.product_code}
                  onChange={e => setForm({ ...form, product_code: e.target.value })}
                  placeholder="예: 136ESC"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  제품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.product_name}
                  onChange={e => setForm({ ...form, product_name: e.target.value })}
                  placeholder="예: 136 ESC"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">비고</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="비고 입력 (선택)"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                취소
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50">
                {saving ? '저장중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
