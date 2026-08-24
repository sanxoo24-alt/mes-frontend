'use client';

import { X } from 'lucide-react';

export function Breadcrumb({ items = [] }) {
  return (
    <div className="flex items-center gap-1.5 text-sm mb-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          <span className={i === items.length - 1 ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
            {item}
          </span>
        </span>
      ))}
    </div>
  );
}

const BASE = 'inline-flex items-center gap-2 text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2';

export const BtnPrimary   = ({ children, ...p }) => <button {...p} className={`${BASE} bg-slate-800 text-white hover:bg-slate-700 ${p.className||''}`}>{children}</button>;
export const BtnSecondary = ({ children, ...p }) => <button {...p} className={`${BASE} bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 ${p.className||''}`}>{children}</button>;
export const BtnSuccess   = ({ children, ...p }) => <button {...p} className={`${BASE} bg-emerald-600 text-white hover:bg-emerald-700 ${p.className||''}`}>{children}</button>;
export const BtnDanger    = ({ children, ...p }) => <button {...p} className={`${BASE} bg-red-600 text-white hover:bg-red-700 ${p.className||''}`}>{children}</button>;

export function Card({ children, className = '' }) {
  return <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = '' }) {
  return <div className={`px-5 py-4 border-b border-slate-100 bg-slate-50/60 ${className}`}>{children}</div>;
}
export function CardTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-700">{children}</h3>;
}
export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

const STATUS_CLS = {
  '완료':     'text-emerald-700 bg-emerald-50 border-emerald-200',
  '진행중':   'text-blue-700 bg-blue-50 border-blue-200',
  '시작전':   'text-slate-500 bg-slate-100 border-slate-200',
  '대기':     'text-slate-500 bg-slate-100 border-slate-200',
  '인수인계': 'text-amber-700 bg-amber-50 border-amber-200',
  '실패':     'text-red-700 bg-red-50 border-red-200',
  '보류':     'text-purple-700 bg-purple-50 border-purple-200',
};

export function StatusBadge({ status }) {
  const cls = STATUS_CLS[status] || 'text-slate-500 bg-slate-100 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}

export function Table({ children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

export function TableEmpty({ colSpan = 5, text = '표시할 데이터가 없습니다' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-16 text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <svg width="40" height="40" className="text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm">{text}</span>
        </div>
      </td>
    </tr>
  );
}

export function TableLoading({ colSpan = 5 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      </td>
    </tr>
  );
}

export function FormField({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 transition-shadow';

export const Input    = ({ className = '', ...p }) => <input    {...p} className={`${inputCls} ${className}`} />;
export const Textarea = ({ className = '', rows = 3, ...p }) => <textarea {...p} rows={rows} className={`${inputCls} resize-none ${className}`} />;
export const Select   = ({ children, className = '', ...p }) => <select  {...p} className={`${inputCls} bg-white ${className}`}>{children}</select>;

export function SearchInput({ value, onChange, placeholder = '검색...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg width="15" height="15" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white shadow-sm"
      />
      {value && (
        <button onClick={() => onChange({ target: { value: '' } })}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
      )}
    </div>
  );
}

export function SlidePanel({ open, onClose, title, children, footer, width = 500 }) {
  return (
    <div
      className="fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 transition-transform duration-300"
      style={{ width, transform: open ? 'translateX(0)' : 'translateX(100%)' }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      {footer && <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function PageWrapper({ children, slideOpen = false, panelWidth = 500 }) {
  return (
    <div className="flex h-full relative overflow-hidden bg-slate-100">
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginRight: slideOpen ? panelWidth : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

export function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-6 bottom-6 w-14 h-14 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 transition-colors flex items-center justify-center text-2xl z-40"
    >+</button>
  );
}

export function Loading({ text = '불러오는 중...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function Empty({ text = '표시할 데이터가 없습니다' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <svg width="40" height="40" className="text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function ErrorMsg({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {text}
    </div>
  );
}
