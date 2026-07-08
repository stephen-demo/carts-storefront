'use client'
import { createContext, useContext } from 'react'
import { ZE, ZN, ZC } from '../lib/styles'

const HeadingFontCtx = createContext(null)
function useHeadingStyle() {
  const f = useContext(HeadingFontCtx)
  return f ? { fontFamily: f } : ZE
}

export const BANNER_TEMPLATES = [
  { id: 'bold-split',    name: 'Bold Split'    },
  { id: 'dark-bold',     name: 'Dark & Bold'   },
  { id: 'diagonal',      name: 'Diagonal'      },
  { id: 'editorial',     name: 'Editorial'     },
  { id: 'gradient-glow', name: 'Gradient Glow' },
  { id: 'lifestyle',     name: 'Lifestyle'     },
  { id: 'sale-badge',    name: 'Sale Badge'    },
  { id: 'pastel',        name: 'Soft & Warm'   },
]

function contrast(hex) {
  if (!hex?.startsWith('#')) return '#111111'
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.55 ? '#111111' : '#ffffff'
}
function alpha(hex, a) {
  if (!hex?.startsWith('#')) return `rgba(0,0,0,${a})`
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}
function pastelOf(hex) {
  if (!hex?.startsWith('#')) return '#f0ede8'
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgb(${Math.round(r*0.15+255*0.85)},${Math.round(g*0.15+255*0.85)},${Math.round(b*0.15+255*0.85)})`
}

function Img({ src, style }) {
  if (src) return <img src={src} alt="" style={{ objectFit: 'contain', pointerEvents: 'none', ...style }} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.06)', borderRadius: 8, ...style }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" opacity="0.2">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 15l5-4 4 3 3-2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}
function ImgCover({ src, style }) {
  if (src) return <img src={src} alt="" style={{ objectFit: 'cover', objectPosition: 'center', pointerEvents: 'none', ...style }} />
  return <div style={{ background: '#ccc', ...style }} />
}

function BoldSplit({ heading, description, actionText, color, imageUrl }) {
  const cc = contrast(color)
  const HS = useHeadingStyle()
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '52%', background: color, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 7%' }}>
        <p style={{ ...HS, fontWeight: 800, fontSize: 15, color: cc, lineHeight: 1.1, marginBottom: 3 }}>
          {heading || 'New Collection'}
        </p>
        {description && <p style={{ ...ZN, fontSize: 9, color: cc, opacity: 0.8, marginBottom: 6, lineHeight: 1.4 }}>{description}</p>}
        {actionText && (
          <span style={{ ...ZN, fontWeight: 700, fontSize: 9, background: cc, color, padding: '3px 10px', borderRadius: 100, alignSelf: 'flex-start' }}>
            {actionText}
          </span>
        )}
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Img src={imageUrl} style={{ width: '80%', height: '80%' }} />
      </div>
    </>
  )
}

function DarkBold({ heading, description, actionText, color, imageUrl }) {
  const cc = contrast(color)
  const HS = useHeadingStyle()
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: '#0f0f0f' }} />
      <div style={{ position: 'absolute', right: '15%', top: '50%', transform: 'translate(50%, -50%)', width: 120, height: 120, borderRadius: '50%', background: color, opacity: 0.18, filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '55%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6%', zIndex: 2 }}>
        <p style={{ ...HS, fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.1, marginBottom: 3 }}>
          {heading || 'New Collection'}
        </p>
        {description && <p style={{ ...ZN, fontSize: 9, color: 'var(--w-50)', marginBottom: 6, lineHeight: 1.4 }}>{description}</p>}
        {actionText && (
          <span style={{ ...ZN, fontWeight: 700, fontSize: 9, background: color, color: cc, padding: '3px 10px', borderRadius: 6, alignSelf: 'flex-start' }}>
            {actionText}
          </span>
        )}
      </div>
      <Img src={imageUrl} style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', width: '47%', objectPosition: 'bottom right', zIndex: 1 }} />
    </>
  )
}

function Diagonal({ heading, description, actionText, color, imageUrl }) {
  const cc = contrast(color)
  const HS = useHeadingStyle()
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: '#fff' }} />
      <div style={{ position: 'absolute', left: '-5%', top: 0, bottom: 0, width: '62%', background: color, clipPath: 'polygon(0 0, 82% 0, 100% 100%, 0 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 7%', zIndex: 2 }}>
        <p style={{ ...HS, fontWeight: 800, fontSize: 15, color: cc, lineHeight: 1.1, marginBottom: 3 }}>
          {heading || 'New Collection'}
        </p>
        {description && <p style={{ ...ZN, fontSize: 9, color: cc, opacity: 0.8, marginBottom: 5, lineHeight: 1.4 }}>{description}</p>}
        {actionText && (
          <span style={{ ...ZN, fontWeight: 700, fontSize: 9, background: cc, color, padding: '3px 9px', borderRadius: 4, alignSelf: 'flex-start' }}>
            {actionText}
          </span>
        )}
      </div>
      <Img src={imageUrl} style={{ position: 'absolute', right: '1%', bottom: 0, height: '95%', width: '40%', objectPosition: 'bottom right', zIndex: 1 }} />
    </>
  )
}

function Editorial({ heading, description, actionText, color, imageUrl }) {
  const cc = contrast(color)
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: '#f8f6f1' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '54%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6%', zIndex: 2 }}>
        <p style={{ ...ZC, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: 3 }}>
          New In
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16, color: '#111', lineHeight: 1.05, marginBottom: 3 }}>
          {heading || 'New Collection'}
        </p>
        {description && <p style={{ ...ZN, fontSize: 9, color: '#666', marginBottom: 6, lineHeight: 1.4 }}>{description}</p>}
        {actionText && (
          <span style={{ ...ZN, fontWeight: 700, fontSize: 9, background: color, color: cc, padding: '3px 10px', borderRadius: 100, alignSelf: 'flex-start' }}>
            {actionText}
          </span>
        )}
      </div>
      <Img src={imageUrl} style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', width: '48%', objectPosition: 'bottom right' }} />
    </>
  )
}

function GradientGlow({ heading, description, actionText, color, imageUrl }) {
  const HS = useHeadingStyle()
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 100%)' }} />
      <div style={{ position: 'absolute', right: '25%', top: '50%', transform: 'translate(50%, -50%)', width: 100, height: 100, borderRadius: '50%', background: color, opacity: 0.18, filter: 'blur(25px)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '55%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6%', zIndex: 2 }}>
        <span style={{ ...ZN, fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: alpha(color, 0.2), color, padding: '2px 7px', borderRadius: 4, alignSelf: 'flex-start', marginBottom: 5 }}>
          Limited Drop
        </span>
        <p style={{ ...HS, fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.1, marginBottom: 3 }}>
          {heading || 'New Collection'}
        </p>
        {description && <p style={{ ...ZN, fontSize: 9, color: 'var(--w-45)', marginBottom: 6, lineHeight: 1.4 }}>{description}</p>}
        {actionText && (
          <span style={{ ...ZN, fontWeight: 700, fontSize: 9, color, border: `1.5px solid ${alpha(color, 0.5)}`, padding: '3px 9px', borderRadius: 100, alignSelf: 'flex-start', background: 'transparent' }}>
            {actionText}
          </span>
        )}
      </div>
      <Img src={imageUrl} style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', width: '47%', objectPosition: 'bottom right', zIndex: 1 }} />
    </>
  )
}

function Lifestyle({ heading, description, actionText, color, imageUrl }) {
  const cc = contrast(color)
  return (
    <>
      <ImgCover src={imageUrl} style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #fff 52%, rgba(255,255,255,0) 100%)', zIndex: 1 }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '53%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6%', zIndex: 2 }}>
        <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16, color: '#111', lineHeight: 1.05, marginBottom: 3 }}>
          {heading || 'New Collection'}
        </p>
        {description && <p style={{ ...ZN, fontSize: 9, color: '#555', marginBottom: 6, lineHeight: 1.4 }}>{description}</p>}
        {actionText && (
          <span style={{ ...ZN, fontWeight: 700, fontSize: 9, background: color, color: cc, padding: '3px 10px', borderRadius: 100, alignSelf: 'flex-start' }}>
            {actionText}
          </span>
        )}
      </div>
    </>
  )
}

function SaleBadge({ heading, description, actionText, color, imageUrl }) {
  const cc = contrast(color)
  const HS = useHeadingStyle()
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: color }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '58%', display: 'flex', alignItems: 'center', gap: '4%', padding: '0 4%', zIndex: 2 }}>
        <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.2)' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 13, color, lineHeight: 1 }}>50%</span>
          <span style={{ ...ZN, fontWeight: 700, fontSize: 6, letterSpacing: '0.06em', textTransform: 'uppercase', color }}>OFF</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...HS, fontWeight: 800, fontSize: 14, color: cc, lineHeight: 1.1, marginBottom: 2 }}>
            {heading || 'Big Sale'}
          </p>
          {description && <p style={{ ...ZN, fontSize: 8, color: cc, opacity: 0.75, marginBottom: 5, lineHeight: 1.4 }}>{description}</p>}
          {actionText && (
            <span style={{ ...ZN, fontWeight: 700, fontSize: 8, background: cc, color, padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
              {actionText}
            </span>
          )}
        </div>
      </div>
      <Img src={imageUrl} style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', width: '44%', objectPosition: 'bottom right', zIndex: 1 }} />
    </>
  )
}

function Pastel({ heading, description, actionText, color, imageUrl }) {
  const cc = contrast(color)
  const bg = pastelOf(color)
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: bg }} />
      <div style={{ position: 'absolute', left: '48%', top: '50%', transform: 'translate(-15%, -50%)', width: '46%', height: '140%', borderRadius: '50%', background: 'var(--w-28)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '48%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6%', zIndex: 3 }}>
        <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16, color: '#111', lineHeight: 1.05, marginBottom: 3 }}>
          {heading || 'New Collection'}
        </p>
        {description && <p style={{ ...ZN, fontSize: 9, color: 'rgba(0,0,0,0.55)', marginBottom: 6, lineHeight: 1.4 }}>{description}</p>}
        {actionText && (
          <span style={{ ...ZN, fontWeight: 700, fontSize: 9, background: color, color: cc, padding: '3px 10px', borderRadius: 100, alignSelf: 'flex-start' }}>
            {actionText}
          </span>
        )}
      </div>
      <Img src={imageUrl} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-15%, -50%)', height: '88%', width: '40%', zIndex: 2 }} />
    </>
  )
}

const TEMPLATE_MAP = {
  'bold-split':    BoldSplit,
  'dark-bold':     DarkBold,
  'diagonal':      Diagonal,
  'editorial':     Editorial,
  'gradient-glow': GradientGlow,
  'lifestyle':     Lifestyle,
  'sale-badge':    SaleBadge,
  'pastel':        Pastel,
}

export function BannerPreview({ banner, headingFont, style }) {
  const T = TEMPLATE_MAP[banner?.templateId] || BoldSplit
  return (
    <HeadingFontCtx.Provider value={headingFont || null}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/6', overflow: 'hidden', borderRadius: 12, flexShrink: 0, ...style }}>
        <T
          heading={banner?.heading || ''}
          description={banner?.description || ''}
          actionText={banner?.actionText || ''}
          color={banner?.color || 'var(--accent)'}
          imageUrl={banner?.imageUrl || ''}
        />
      </div>
    </HeadingFontCtx.Provider>
  )
}
