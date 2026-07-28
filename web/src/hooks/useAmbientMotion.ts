import { useLayoutEffect } from 'react'

export function useAmbientMotion(enabled: boolean): void {
  useLayoutEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const handlePointer = (event: PointerEvent) => {
      if (motionQuery.matches || event.pointerType === 'touch') return
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty('--pointer-x', `${event.clientX}px`)
        root.style.setProperty('--pointer-y', `${event.clientY}px`)
        root.classList.add('has-pointer')
      })
    }

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(
      '.arc-panel, .activity-rail, .markets-section, .simulator-section, .portfolio-section, .mechanics, .safety',
    ))
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })

    for (const target of revealTargets) {
      target.classList.add('reveal-on-scroll')
      observer.observe(target)
    }
    window.addEventListener('pointermove', handlePointer, { passive: true })

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', handlePointer)
      root.classList.remove('has-pointer')
    }
  }, [enabled])
}
