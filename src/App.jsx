import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'
import { Analytics } from "@vercel/analytics/react"

const scenes = [
  { file: 'Parte 1 escena 1.mp4', part: 1, scene: 1, type: 'video' },
  { file: 'Parte 1 escena 2 final.mp4', part: 1, scene: 2, type: 'video' },
  { file: 'Parte 1 escena 3.mp4', part: 1, scene: 3, type: 'video' },
  { file: 'Parte 1 escena 4.mp4', part: 1, scene: 4, type: 'video' },
  { file: 'Parte 1 escena 5 final.mp4', part: 1, scene: 5, type: 'video' },

  { file: 'Parte 2 escena 1.mp4', part: 2, scene: 1, type: 'video' },
  { file: 'Parte 2 escena 2 final.mp4', part: 2, scene: 2, type: 'video' },
  { file: 'Parte 2 escena 3.mp4', part: 2, scene: 3, type: 'video' },
  { file: 'Parte 2 escena 4.mp4', part: 2, scene: 4, type: 'video' },
  { file: 'Parte 2 escena 5.mp4', part: 2, scene: 5, type: 'video' },
  { file: 'Parte 2 escena 6.mp4', part: 2, scene: 6, type: 'video' },
  { file: 'Parte 2 escena 7.mp4', part: 2, scene: 7, type: 'video' },
  { file: 'Parte 2 escena 8.mp4', part: 2, scene: 8, type: 'video' },
  { file: 'Parte 2 escena 9.mp4', part: 2, scene: 9, type: 'video' },
  { file: 'Parte 2 escena 10.mp4', part: 2, scene: 10, type: 'video' },
  { file: 'Parte 2 escena 11.mp4', part: 2, scene: 11, type: 'video' },

  { file: 'Parte 3 escena 1 .mp4', part: 3, scene: 1, type: 'video' },
  { file: 'Parte 3 escena 2.mp4', part: 3, scene: 2, type: 'video' },

  // Parte 3 escena 3: video de fondo + overlay animado
  {
    file: 'Parte 3 escena 3.mp4',
    part: 3,
    scene: 3,
    type: 'video-overlay',
    overlayFile: 'Caminata final.png',
  },

  // Nueva Parte 3 escena 4
  {
    file: 'Parte 3 escena 4.mp4',
    part: 3,
    scene: 4,
    type: 'video',
  },
]

const P3E3_PHRASES = [
  'Escuchar mis necesidades',
  'Pedir ayuda',
]

const P3E3_COLORS = [
  '#d4a574',
  '#7eb8a0',
  '#b07db5',
  '#e08686',
  '#6ba3c9',
  '#c9b95a',
]

function Typewriter({ active, paused }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState('typing')
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

function patternUrl(part, scene) {
  return `/P${part}E${scene}.png`
}

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
  const [soundEnabled, setSoundEnabled] = useState(false)

  const lockRef = useRef(false)
  const touchStartY = useRef(0)
  const currentRef = useRef(current)
  const videosRef = useRef({})
  const loopCountRef = useRef({})
  const slowTailAppliedRef = useRef({})

  currentRef.current = current

  const goTo = useCallback((index) => {
    const clamped = Math.max(0, Math.min(TOTAL - 1, index))
    if (clamped === currentRef.current || lockRef.current) return

    lockRef.current = true
    setTransitioning(true)
    loopCountRef.current = {}
    slowTailAppliedRef.current = {}

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

  const applyScenePlaybackRules = useCallback((video, scene) => {
    if (!video || !scene) return

    // default
    video.playbackRate = 1

    // Parte 2 escena 5 y 7: toda la escena a 0.75x
    if (scene.part === 2 && (scene.scene === 5 || scene.scene === 7)) {
      video.playbackRate = 0.75
    }
  }, [])

  useEffect(() => {
    Object.entries(videosRef.current).forEach(([key, video]) => {
      if (!video) return

      const idx = parseInt(key, 10)
      const scene = idx >= 2 && idx < 2 + scenes.length ? scenes[idx - 2] : null

      video.muted = !soundEnabled
      applyScenePlaybackRules(video, scene)

      if (idx === current) {
        if (paused) {
          video.pause()
        } else if (!video.ended) {
          video.play().catch(() => {})
        }
      } else {
        video.pause()
        slowTailAppliedRef.current[idx] = false
        if (!transitioning) {
          video.currentTime = 0
          video.playbackRate = 1
        }
      }
    })
  }, [current, paused, transitioning, soundEnabled, applyScenePlaybackRules])

  useEffect(() => {
    if (!soundEnabled) return

    Object.entries(videosRef.current).forEach(([key, video]) => {
      if (!video) return
      const idx = parseInt(key, 10)
      const scene = idx >= 2 && idx < 2 + scenes.length ? scenes[idx - 2] : null
      video.muted = false
      applyScenePlaybackRules(video, scene)
    })

    const currentVideo = videosRef.current[current]
    if (currentVideo && !paused) {
      currentVideo.play().catch(() => {})
    }
  }, [soundEnabled, current, paused, applyScenePlaybackRules])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#' + slideSlug(0))
    }
  }, [])

  const togglePause = useCallback(() => {
    setPaused(p => !p)
  }, [])

  const enableSound = useCallback(() => {
    setSoundEnabled(true)
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

  const handleVideoTimeUpdate = useCallback((sceneIdx, slideIdx) => {
    const video = videosRef.current[slideIdx]
    if (!video) return

    const s = scenes[sceneIdx]
    if (!s) return

    // Parte 2 escena 6: solo el último segundo a 0.75x
    if (s.part === 2 && s.scene === 6) {
      const duration = video.duration || 0
      if (!duration) return

      const shouldSlowTail = video.currentTime >= Math.max(0, duration - 1)

      if (shouldSlowTail && !slowTailAppliedRef.current[slideIdx]) {
        video.playbackRate = 0.75
        slowTailAppliedRef.current[slideIdx] = true
      } else if (!shouldSlowTail && slowTailAppliedRef.current[slideIdx]) {
        video.playbackRate = 1
        slowTailAppliedRef.current[slideIdx] = false
      }
    }
  }, [])

  const handleVideoLoadedMetadata = useCallback((sceneIdx, slideIdx) => {
    const video = videosRef.current[slideIdx]
    if (!video) return
    const s = scenes[sceneIdx]
    if (!s) return

    slowTailAppliedRef.current[slideIdx] = false
    applyScenePlaybackRules(video, s)
  }, [applyScenePlaybackRules])

  const handleVisualEnd = useCallback((slideIdx) => {
    goTo(slideIdx + 1)
  }, [goTo])

  const handleVideoEnd = useCallback((sceneIdx, slideIdx) => {
    const video = videosRef.current[slideIdx]
    if (!video) return

    const s = scenes[sceneIdx]

    if (s.part === 1 && s.scene === 5) {
      const count = loopCountRef.current[sceneIdx] || 0
      if (count < 2) {
        loopCountRef.current[sceneIdx] = count + 1
        video.currentTime = Math.max(0, video.duration - 2)
        video.play().catch(() => {})
        return
      }
    }

    if (s.part === 2 && s.scene === 5) {
      const count = loopCountRef.current[sceneIdx] || 0
      if (count < 2) {
        loopCountRef.current[sceneIdx] = count + 1
        video.currentTime = 0
        video.play().catch(() => {})
        return
      }
    }

    video.pause()
    video.playbackRate = 1
    slowTailAppliedRef.current[slideIdx] = false
    loopCountRef.current[sceneIdx] = 0
    goTo(slideIdx + 1)
  }, [goTo])

  const sceneIndex = current - 2

  const registerVideo = (index) => (el) => {
    videosRef.current[index] = el
  }

  return (
    <div className="app">
      <Analytics/>
      <div className={`pause-indicator ${paused ? 'pause-visible' : ''}`}>
        &#10074;&#10074;
      </div>

      <nav className="dots">
        {Array.from({ length: TOTAL }, (_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </nav>

      {/* 0 - Portada */}
      <section className={`panel hero ${current === 0 ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}>
        <div className="hero-video-wrapper">
          <video
            ref={registerVideo(0)}
            src="/videos/Portada.mp4"
            muted={!soundEnabled}
            onClick={togglePause}
            loop
            playsInline
          />
          <div className="hero-overlay" />
          <div className="hero-title">
            <h1>Los Demonios Que Habito</h1>
            <p>por Fran</p>
          </div>
        </div>
        <div className="scroll-indicator">&#x25BE;</div>
      </section>

      {/* 1 - Trigger Warning */}
      <section className={`panel tw-panel ${current === 1 ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}>
        <div className="tw-content">
          <div className="tw-icon">&#9888;</div>
          <h2 className="tw-title">Trigger Warning</h2>
          <div className="tw-line" />
          <ul className="tw-list">
            <li>Padecimiento psicológico</li>
            <li>Crisis, despersonalización, distorsión de la realidad</li>
            <li>Depresión, autolesiones, ideaciones suicidas</li>
          </ul>
          <p className="tw-sub">
            Este proyecto busca mostrar la lucha por la supervivencia en un pozo depresivo,
            la construcción de una esperanza, los deseos de un futuro en un mundo mejor.
          </p>

          <button
            className="sound-button"
            onClick={enableSound}
            type="button"
          >
            {soundEnabled ? '🔊 Sonido activado' : '🔇 Activar sonido'}
          </button>
        </div>
      </section>

      {/* Escenas */}
      {scenes.map((s, i) => {
        const slideIdx = i + 2
        const isActive = current === slideIdx
        const shouldMountMedia = Math.abs(sceneIndex - i) <= 1

        return (
          <section
            key={`${s.part}-${s.scene}`}
            className={`panel scene-panel scene-has-pattern ${isActive ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}
            style={{ backgroundImage: `url('${patternUrl(s.part, s.scene)}')` }}
          >
            <div className="scene-video-wrapper">
              {shouldMountMedia && s.type === 'video' && (
                <video
                  ref={registerVideo(slideIdx)}
                  src={`/videos/${s.file}`}
                  muted={!soundEnabled}
                  playsInline
                  onClick={togglePause}
                  onLoadedMetadata={() => handleVideoLoadedMetadata(i, slideIdx)}
                  onTimeUpdate={() => handleVideoTimeUpdate(i, slideIdx)}
                  onEnded={() => handleVideoEnd(i, slideIdx)}
                />
              )}

            {shouldMountMedia && s.type === 'video-overlay' && (
  <>
    <video
      ref={registerVideo(slideIdx)}
      onClick={togglePause}
      src={`/videos/${s.file}`}
      muted={!soundEnabled}
      playsInline
      onLoadedMetadata={() => handleVideoLoadedMetadata(i, slideIdx)}
      onTimeUpdate={() => handleVideoTimeUpdate(i, slideIdx)}
      onEnded={() => handleVideoEnd(i, slideIdx)}
    />
    <img
      className={`walking-overlay ${isActive && !paused ? 'walking-overlay-active' : ''}`}
      src={`/${s.overlayFile}`}
      alt=""
      aria-hidden="true"
    />
  </>
)}

            </div>

            {/* {s.part === 3 && s.scene === 3 && <Typewriter active={isActive} paused={paused} />} */}

            {s.type === 'gif' && isActive && (
              <button
                type="button"
                className="gif-next-hitarea"
                onClick={() => handleVisualEnd(slideIdx)}
                aria-label="Continuar"
                title="Continuar"
              />
            )}
          </section>
        )
      })}

      {/* Last - Sobre Fran */}
      <section className={`panel about-panel ${current === TOTAL - 1 ? 'panel-active' : ''} ${transitioning ? 'panel-out' : ''}`}>
        <div className="about-content">
          <h2>Sobre Fran</h2>
          <div className="about-divider" />
          <p>
            Artista visual, ocacionalmente animador, que explora los rincones
            más oscuros de la imaginación para darle entidad y batalla a ese dolor.
          </p>
          <p>
            "Los Demonios Que Habito" es un proyecto audiovisual que nace de la
            necesidad de transformar y sanar a traves del arte.
          </p>
          <p>
            Esperamos que sea un mensaje alentador en la lucha contra sus propios demonios.
          </p>
          <p className="about-social">Redes: @las3furias</p>
        </div>
      </section>
    </div>
  )
}

export default App