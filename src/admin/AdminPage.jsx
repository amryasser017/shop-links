import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LampLogin from './LampLogin.jsx'
import {
  getToken, setToken, fetchCategoryStores,
  createCategory, updateCategory, deleteCategory,
  createStore, updateStore, deleteStore,
} from '../lib/api.js'
import { useData } from '../lib/DataContext.jsx'

const ERRORS = {
  invalid_credentials: 'Wrong email or password.',
  admin_not_configured: 'Admin is not configured on the server (set ADMIN_EMAIL / ADMIN_PASSWORD).',
  unauthorized: 'Session expired. Please sign in again.',
  // CHANGED: messages for the error codes your Flask API returns
  name_required: 'Name is required.',
  slug_exists: 'A category with this name already exists.',
  invalid_url: 'The store link must start with http:// or https://',
  invalid_logo: 'The logo link must start with http:// or https://',
  not_found: 'This item no longer exists. Refresh the page.',
  network_error: 'Cannot reach the API. Is your Flask server running?',
}
const msg = (e) => ERRORS[e.message] || 'Something went wrong. Please try again.'

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
  // CHANGED: categories (with store_count) come from the shared context; `reload` re-fetches them
  const { categories, reload } = useData()
  const [selectedId, setSelectedId] = useState(null) // CHANGED: we remember the category id, not a slug
  const [stores, setStores] = useState([])           // CHANGED: stores of the open category, loaded from the API
  const [modal, setModal] = useState(null) // {type, item}
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const category = categories.find((c) => c.id === selectedId)

  // CHANGED: every action now runs through one helper.
  // It shows "Saving…", reports success or the API error, and signs you out if the token expired (401).
  async function run(action, okMsg) {
    setBusy(true); setError(''); setStatus('')
    try {
      await action()
      setStatus(okMsg)
      setModal(null)
    } catch (err) {
      if (err.message === 'unauthorized') { setToken(null); onLogout(); return }
      setError(msg(err))
    } finally { setBusy(false) }
  }

  // CHANGED: opening a category loads ITS stores from GET /api/categories/<slug>/stores
  async function loadStores(slug) {
    try {
      setStores((await fetchCategoryStores(slug)).stores)
    } catch (err) { setError(msg(err)) }
  }
  async function openCategory(c) {
    setSelectedId(c.id); setStatus(''); setError(''); setStores([])
    await loadStores(c.slug)
  }

  // ---- categories: POST / PUT / DELETE ----
  function saveCategory(f) {
    const body = { name: f.name.trim(), icon: f.icon || '🛍️' }
    return run(async () => {
      if (modal.item) await updateCategory(modal.item.id, body)  // CHANGED: PUT /api/categories/<id>
      else await createCategory(body)                             // CHANGED: POST /api/categories (Flask makes the slug)
      await reload()
    }, modal.item ? 'Category updated.' : 'Category added.')
  }

  function removeCategory(c) {
    if (!confirm(`Delete "${c.name}" and its ${c.store_count} stores?`)) return
    run(async () => {
      await deleteCategory(c.id)                                  // CHANGED: DELETE /api/categories/<id> (MySQL cascades the stores)
      setSelectedId(null)
      await reload()
    }, 'Category deleted.')
  }

  // ---- stores: POST / PUT / DELETE ----
  function saveStore(f) {
    const body = {
      name: f.name.trim(), url: f.url.trim(), description: f.description,
      logo: f.logo, phone: f.phone, address: f.address,
    }
    return run(async () => {
      if (modal.item) await updateStore(modal.item.id, body)      // CHANGED: PUT /api/stores/<id>
      else await createStore(category.id, body)                   // CHANGED: POST /api/categories/<id>/stores
      await loadStores(category.slug)
      await reload()                                              // refresh store_count
    }, modal.item ? 'Store updated.' : 'Store added.')
  }

  function removeStore(st) {
    if (!confirm(`Delete store "${st.name}"?`)) return
    run(async () => {
      await deleteStore(st.id)                                    // CHANGED: DELETE /api/stores/<id>
      await loadStores(category.slug)
      await reload()
    }, 'Store deleted.')
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
                <li key={c.id} className="panel row">
                  <button className="row-main" onClick={() => openCategory(c)}>
                    <span className="category-icon" aria-hidden="true">{c.icon}</span>
                    <span className="category-info">
                      <span className="category-name">{c.name}</span>
                      {/* CHANGED: store_count instead of c.stores.length */}
                      <span className="category-count">{c.store_count} stores · manage →</span>
                    </span>
                  </button>
                  <div className="row-actions">
                    <button className="btn btn-ghost sm" onClick={() => setModal({ type: 'cat', item: c })}>Edit</button>
                    <button className="btn btn-danger sm" onClick={() => removeCategory(c)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <button className="back" onClick={() => { setSelectedId(null); setStatus(''); setError('') }}>← All categories</button>
            <div className="admin-title">
              <h1>{category.icon} {category.name}</h1>
              <button className="btn btn-primary" onClick={() => setModal({ type: 'store' })}>＋ Add store</button>
            </div>
            {stores.length === 0 && <p className="empty">No stores in this category yet.</p>}
            <ul className="list">
              {stores.map((st) => (
                <li key={st.id} className="panel row">
                  <div className="row-main static">
                    {st.logo ? <img className="store-logo" src={st.logo} alt="" /> : <span className="store-logo store-initial">{st.name.charAt(0).toUpperCase()}</span>}
                    <span className="category-info">
                      <span className="category-name">{st.name}</span>
                      <span className="category-count">{st.url}</span>
                    </span>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost sm" onClick={() => setModal({ type: 'store', item: st })}>Edit</button>
                    <button className="btn btn-danger sm" onClick={() => removeStore(st)}>Delete</button>
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
