import { useState } from 'react'

function StoreCard({ name, url, description, logo, phone, address }) {
  const [logoFailed, setLogoFailed] = useState(false)
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url } })()
  return (
    <article className="store-card">
      <div className="store-head">
        {logo && !logoFailed ? (
          <img className="store-logo" src={logo} alt="" loading="lazy" onError={() => setLogoFailed(true)} />
        ) : (
          <span className="store-logo store-initial" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
        )}
        <div className="store-title">
          <h3>{name}</h3>
          <span className="store-host">{host}</span>
        </div>
      </div>
      {description && <p className="store-desc">{description}</p>}
      {(phone || address) && (
        <ul className="store-meta">
          {phone && <li><a href={`tel:${phone.replace(/\s/g, '')}`}>📞 {phone}</a></li>}
          {address && <li>📍 {address}</li>}
        </ul>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary store-visit">
        Visit Store <span aria-hidden="true">↗</span>
      </a>
    </article>
  )
}
export default StoreCard
