import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

const scenes = [
  { file: 'Parte 1 escena 1.mp4', part: 1, scene: 1 },
  { file: 'Parte 1 escena 2 final.mp4', part: 1, scene: 2 },
  { file: 'Parte 1 escena 3.mp4', part: 1, scene: 3 },
  { file: 'Parte 1 escena 4.mp4', part: 1, scene: 4 },
  { file: 'Parte 1 escena 5 final.mp4', part: 1, scene: 5 },
  { file: 'Parte 2 escena 1.mp4', part: 2, scene: 1 },
  { file: 'Parte 2 escena 2 final.mp4', part: 2, scene: 2 },
  { file: 'Parte 2 escena 3.mp4', part: 2, scene: 3 },
  { file: 'Parte 2 escena 4.mp4', part: 2, scene: 4 },
  { file: 'Parte 2 escena 5.mp4', part: 2, scene: 5 },
  { file: 'Parte 2 escena 6.mp4', part: 2, scene: 6 },
  { file: 'Parte 2 escena 7.mp4', part: 2, scene: 7 },
  { file: 'Parte 2 escena 8.mp4', part: 2, scene: 8 },
  { file: 'Parte 2 escena 9.mp4', part: 2, scene: 9 },
  { file: 'Parte 2 escena 10.mp4', part: 2, scene: 10 },
  { file: 'Parte 2 escena 11.mp4', part: 2, scene: 11 },
  { file: 'Parte 3 escena 1 .mp4', part: 3, scene: 1 },
  { file: 'Parte 3 escena 2.mp4', part: 3, scene: 2 },
  { file: 'Parte 3 escena 3.mp4', part: 3, scene: 3 },
]

// ── Typewriter phrases for P3E3 ──
// Add more phrases here freely
const P3E3_PHRASES = [
  'Escuchar mis necesidades',
  'Pedir ayuda',
]

const P3E3_COLORS = [
  '#d4a574',  // warm tan
  '#7eb8a0',  // sage green
  '#b07db5',  // soft purple
  '#e08686',  // muted rose
  '#6ba3c9',  // steel blue
  '#c9b95a',  // gold
]

function Typewriter({ active, paused }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState('typing') // typing | hold | fading | waiting
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setPhraseIndex(0)
      setDisplayed('')
      setPhase('typing')
      return
    }
    if (paused) return

    const phrase = P3E3_PHRASES[phraseIndex % P3E3_PHRASES.length]

    if (phase === 'typing') {
      if (displayed.length < phrase.length) {
        intervalRef.current = setTimeout(() => {
          setDisplayed(phrase.slice(0, displayed.length + 1))
        }, 70)
      } else {
        timeoutRef.current = setTimeout(() => setPhase('fading'), 1500)
      }
    } else if (phase === 'fading') {
      timeoutRef.current = setTimeout(() => setPhase('waiting'), 800)
    } else if (phase === 'waiting') {
      setPhraseIndex(prev => prev + 1)
      setDisplayed('')
      setPhase('typing')
    }

    return () => {
      clearTimeout(intervalRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [active, paused, phase, displayed, phraseIndex])

  const color = P3E3_COLORS[phraseIndex % P3E3_COLORS.length]

  return (
    <div className="typewriter-overlay">
      <p
        className={`typewriter-text ${phase === 'fading' ? 'typewriter-fade' : ''}`}
        style={{ color }}
      >
        {displayed}
        <span className="typewriter-cursor">|</span>
      </p>
    </div>
  )
}

// Pattern image per scene: /P{part}E{scene}.png — if the file exists it shows as background
function patternUrl(part, scene) {
  return `/P${part}E${scene}.png`
}

// Slug for each section (used in URL hash)
function slideSlug(index) {
  if (index === 0) return 'portada'
  if (index === 1) return 'trigger-warning'
  if (index >= 2 && index < 2 + scenes.length) {
    const s = scenes[index - 2]
    return `parte-${s.part}-escena-${s.scene}`
  }
  return 'sobre-fran'
}

function slugToIndex(hash) {
  const slug = hash.replace('#', '')
  if (!slug) return 0
  for (let i = 0; i < TOTAL; i++) {
    if (slideSlug(i) === slug) return i
  }
  return 0
}

const TOTAL = 2 + scenes.length + 1

function App() {
  const [current, setCurrent] = useState(() => slugToIndex(window.location.hash))
  const [transitioning, setTransitioning] = useState(false)
  const [paused, setPaused] = useState(false)
  const lockRef = useRef(false)
  const touchStartY = useRef(0)
  const currentRef = useRef(current)
  const videosRef = useRef({})
  currentRef.current = current

  const goTo = useCallback((index) => {
    const clamped = Math.max(0, Math.min(TOTAL - 1, index))
    if (clamped === currentRef.current || lockRef.current) return

    lockRef.current = true
    setTransitioning(true)

    setTimeout(() => {
      setCurrent(clamped)
      setPaused(false)
      window.history.replaceState(null, '', '#' + slideSlug(clamped))
      setTimeout(() => {
        setTransitioning(false)
        lockRef.current = false
      }, 700)
    }, 300)
  }, [])

  useEffect(() => {
    Object.entries(videosRef.current).forEach(([key, video]) => {
      if (!video) return
      const idx = parseInt(key)
      if (idx === current) {
        if (paused) {
          video.pause()
        } else {
          video.play().catch(() => {})
        }
      } else {
        video.pause()
        video.currentTime = 0
      }
    })
  }, [current, paused, transitioning])

  // Set initial hash
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#' + slideSlug(0))
    }
  }, [])

  const togglePause = useCallback(() => {
    setPaused(p => !p)
  }, [])

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault()
      if (lockRef.current) return
      if (e.deltaY > 20) goTo(currentRef.current + 1)
      else if (e.deltaY < -20) goTo(currentRef.current - 1)
    }

    const onKeyDown = (e) => {
      if (e.key === ' ') {
        e.preventDefault()
        togglePause()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        goTo(currentRef.current + 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        goTo(currentRef.current - 1)
      }
    }

    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchEnd = (e) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY
      if (Math.abs(diff) < 50) return
      if (diff > 0) goTo(currentRef.current + 1)
      else goTo(currentRef.current - 1)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [goTo, togglePause])

  const sceneIndex = current - 2

  const registerVideo = (index) => (el) => {
    videosRef.current[index] = el
  }

  return (
    <div className="app">
      {/* Pause indicator */}
      <div className={`pause-indicator ${paused ? 'pause-visible' : ''}`}>
        &#10074;&#10074;
      </div>

      {/* Progress dots */}
      <nav className="dots">
        {Array.from({ length: TOTAL }, (_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </nav>

      {/* 0 - Hero / Portada (loops forever) */}
      <section className={`panel hero ${current === 0 ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}>
        <video
          ref={registerVideo(0)}
          src="/videos/Portada.mp4"
          muted
          loop
          playsInline
        />
        <div className="hero-overlay" />
        <div className="hero-title">
          <h1>Los Monstruos Que Habito</h1>
          <p>por Fran</p>
        </div>
        <div className="scroll-indicator">&#x25BE;</div>
      </section>

      {/* 1 - Trigger Warning */}
      <section className={`panel tw-panel ${current === 1 ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}>
        <div className="tw-content">
          <div className="tw-icon">&#9888;</div>
          <h2 className="tw-title">Trigger Warning</h2>
          <div className="tw-line" />
          <p className="tw-text">
            Este proyecto contiene imágenes y temáticas que pueden resultar
            perturbadoras o sensibles para algunas personas.
          </p>
          <ul className="tw-list">
            <li>Representaciones de monstruos y criaturas oscuras</li>
            <li>Temáticas de angustia y emociones intensas</li>
            <li>Contenido visual de carácter expresionista</li>
          </ul>
          <p className="tw-sub">Se recomienda discreción del espectador.</p>
        </div>
      </section>

      {/* 2..N+1 - Scenes */}
      {scenes.map((s, i) => {
        const isP3E3 = s.part === 3 && s.scene === 3
        const isActive = current === i + 2
        return (
          <section
            key={i}
            className={`panel scene-panel scene-has-pattern ${isActive ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}
            style={{ backgroundImage: `url('${patternUrl(s.part, s.scene)}')` }}
          >
            <div className={`scene-video-wrapper`}>
              {Math.abs(sceneIndex - i) <= 1 && (
                <video
                  ref={registerVideo(i + 2)}
                  src={`/videos/${s.file}`}
                  muted
                  playsInline
                  onEnded={() => goTo(i + 3)}
                />
              )}
            </div>
            {/*isP3E3 && <Typewriter active={isActive} paused={paused} />*/}
          </section>
        )
      })}

      {/* Last - Sobre Fran */}
      <section className={`panel about-panel ${current === TOTAL - 1 ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}>
        <div className="about-content">
          <h2>Sobre Fran</h2>
          <div className="about-divider" />
          <p>
            Artista visual y animadora que explora los rincones más oscuros de la
            imaginación humana. A través de la animación y el diseño de personajes,
            Fran da vida a criaturas que habitan entre lo bello y lo monstruoso.
          </p>
          <p>
            "Los Monstruos Que Habito" es un proyecto audiovisual que nace de la
            necesidad de externalizar los demonios internos, transformándolos en
            seres tangibles a través del arte y la animación.
          </p>
        </div>
      </section>
    </div>
  )
}

export default App
