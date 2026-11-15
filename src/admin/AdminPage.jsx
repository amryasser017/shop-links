import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LampLogin from './LampLogin.jsx'
import { getToken, setToken, saveCategories } from '../lib/api.js'
import { useData } from '../lib/DataContext.jsx'

const ERRORS = {
  invalid_credentials: 'Wrong email or password.',
  admin_not_configured: 'Admin is not configured on the server (set ADMIN_EMAIL / ADMIN_PASSWORD).',
  unauthorized: 'Session expired. Please sign in again.',
  storage_not_configured: 'Storage is not configured on the server (connect Upstash Redis).',
  invalid_data: 'Some fields are invalid. Check names and URLs (must start with http/https).',
}
const msg = (e) => ERRORS[e.message] || 'Something went wrong. Please try again.'

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  )
}

function CategoryForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ name: initial?.name || '', icon: initial?.icon || '🛍️' })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f) }} className="form">
      <label className="field">Icon (emoji)
        <input value={f.icon} maxLength={8} onChange={(e) => setF({ ...f, icon: e.target.value })} />
      </label>
      <label className="field">Category name
        <input required autoFocus maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary">Save</button>
      </div>
    </form>
  )
}

function StoreForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ name: '', url: '', description: '', logo: '', phone: '', address: '', ...initial })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f) }} className="form">
      <label className="field">Store name *<input required autoFocus maxLength={80} value={f.name} onChange={set('name')} /></label>
      <label className="field">Store link *<input required type="url" placeholder="https://" value={f.url} onChange={set('url')} /></label>
      <label className="field">Description<textarea rows={3} maxLength={400} value={f.description} onChange={set('description')} /></label>
      <label className="field">Logo image URL<input type="url" placeholder="https://…/logo.png" value={f.logo} onChange={set('logo')} /></label>
      <div className="row2">
        <label className="field">Phone<input type="tel" maxLength={40} value={f.phone} onChange={set('phone')} /></label>
        <label className="field">Address<input maxLength={200} value={f.address} onChange={set('address')} /></label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary">Save store</button>
      </div>
    </form>
  )
}

function Dashboard({ onLogout }) {
  const { categories, setCategories } = useData()
  const [selected, setSelected] = useState(null) // category slug
  const [modal, setModal] = useState(null) // {type, item}
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const category = categories.find((c) => c.slug === selected)

  async function commit(next, okMsg) {
    setBusy(true); setError(''); setStatus('')
    try {
      setCategories(await saveCategories(next))
      setStatus(okMsg)
      setModal(null)
    } catch (err) {
      if (err.message === 'unauthorized') { setToken(null); onLogout(); return }
      setError(msg(err))
    } finally { setBusy(false) }
  }

  function saveCategory(f) {
    const name = f.name.trim()
    if (modal.item) {
      return commit(categories.map((c) => (c.slug === modal.item.slug ? { ...c, name, icon: f.icon || '🛍️' } : c)), 'Category updated.')
    }
    let slug = slugify(name) || `cat-${Date.now()}`
    const base = slug
    for (let i = 2; categories.some((c) => c.slug === slug); i++) slug = `${base}-${i}`
    return commit([...categories, { slug, name, icon: f.icon || '🛍️', stores: [] }], 'Category added.')
  }

  function deleteCategory(c) {
    if (!confirm(`Delete "${c.name}" and its ${c.stores.length} stores?`)) return
    setSelected(null)
    commit(categories.filter((x) => x.slug !== c.slug), 'Category deleted.')
  }

  function saveStore(f) {
    const store = { ...f, id: f.id || uid() }
    const stores = modal.item
      ? category.stores.map((s) => (s.id === modal.item.id ? store : s))
      : [...category.stores, store]
    return commit(categories.map((c) => (c.slug === category.slug ? { ...c, stores } : c)), modal.item ? 'Store updated.' : 'Store added.')
  }

  function deleteStore(s) {
    if (!confirm(`Delete store "${s.name}"?`)) return
    commit(categories.map((c) => (c.slug === category.slug ? { ...c, stores: c.stores.filter((x) => x.id !== s.id) } : c)), 'Store deleted.')
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <a href="/" className="brand" title="View public site">🛍️ <b>Shop</b>Links <span className="tag">Admin</span></a>
        <button className="btn btn-ghost sm" onClick={() => { setToken(null); onLogout() }}>Sign out</button>
      </header>
      <main className="container">
        {status && <p className="toast ok" role="status">{status}</p>}
        {error && <p className="alert" role="alert">{error}</p>}

        {!category ? (
          <>
            <div className="admin-title">
              <h1>Categories</h1>
              <button className="btn btn-primary" onClick={() => setModal({ type: 'cat' })}>＋ Add category</button>
            </div>
            {categories.length === 0 && <p className="empty">No categories yet.</p>}
            <ul className="list">
              {categories.map((c) => (
                <li key={c.slug} className="panel row">
                  <button className="row-main" onClick={() => { setSelected(c.slug); setStatus('') }}>
                    <span className="category-icon" aria-hidden="true">{c.icon}</span>
                    <span className="category-info">
                      <span className="category-name">{c.name}</span>
                      <span className="category-count">{c.stores.length} stores · manage →</span>
                    </span>
                  </button>
                  <div className="row-actions">
                    <button className="btn btn-ghost sm" onClick={() => setModal({ type: 'cat', item: c })}>Edit</button>
                    <button className="btn btn-danger sm" onClick={() => deleteCategory(c)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <button className="back" onClick={() => { setSelected(null); setStatus('') }}>← All categories</button>
            <div className="admin-title">
              <h1>{category.icon} {category.name}</h1>
              <button className="btn btn-primary" onClick={() => setModal({ type: 'store' })}>＋ Add store</button>
            </div>
            {category.stores.length === 0 && <p className="empty">No stores in this category yet.</p>}
            <ul className="list">
              {category.stores.map((s) => (
                <li key={s.id} className="panel row">
                  <div className="row-main static">
                    {s.logo ? <img className="store-logo" src={s.logo} alt="" /> : <span className="store-logo store-initial">{s.name.charAt(0).toUpperCase()}</span>}
                    <span className="category-info">
                      <span className="category-name">{s.name}</span>
                      <span className="category-count">{s.url}</span>
                    </span>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost sm" onClick={() => setModal({ type: 'store', item: s })}>Edit</button>
                    <button className="btn btn-danger sm" onClick={() => deleteStore(s)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {modal?.type === 'cat' && (
        <Modal title={modal.item ? 'Edit category' : 'New category'} onClose={() => setModal(null)}>
          <CategoryForm initial={modal.item} onSave={saveCategory} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'store' && (
        <Modal title={modal.item ? 'Edit store' : 'New store'} onClose={() => setModal(null)}>
          <StoreForm initial={modal.item} onSave={saveStore} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {busy && <div className="saving">Saving…</div>}
    </div>
  )
}

export default function AdminPage() {
  const nav = useNavigate()
  const [authed, setAuthed] = useState(!!getToken())
  return (
    <Routes>
      <Route
        path="login"
        element={authed
          ? <Navigate to="/admin" replace />
          : <LampLogin onDone={() => { setAuthed(true); nav('/admin', { replace: true }) }} />}
      />
      <Route
        index
        element={authed
          ? <Dashboard onLogout={() => { setAuthed(false); nav('/admin/login', { replace: true }) }} />
          : <Navigate to="/admin/login" replace />}
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
