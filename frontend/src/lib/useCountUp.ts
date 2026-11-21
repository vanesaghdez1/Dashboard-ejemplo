import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Anima un número desde el valor que se ve en pantalla hasta el nuevo (efecto "contador").
 * Respeta "reducir movimiento" del sistema: en ese caso salta directo al valor.
 */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(() => (reducedMotion() ? target : 0))
  const shownRef = useRef(value) // lo que se ve ahora (punto de partida de la próxima animación)

  useEffect(() => {
    const from = shownRef.current
    if (reducedMotion() || from === target) {
      shownRef.current = target
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4) // ease-out: rápido al inicio, suave al final
      shownRef.current = from + (target - from) * eased
      setValue(shownRef.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
