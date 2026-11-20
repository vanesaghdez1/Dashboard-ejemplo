/** Marca "Ventas MX": monograma con una línea de tendencia + nombre en serif. */
export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-10' : 'size-8'
  return (
    <span className="flex items-center gap-2.5">
      <span className={`bg-ink ${box} grid shrink-0 place-items-center rounded-[10px]`}>
        <svg viewBox="0 0 24 24" className="size-[62%]" aria-hidden>
          <path
            d="M3 17 L9 11 L13 14 L21 5"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="5" r="2.2" fill="var(--bg)" />
        </svg>
      </span>
      <span className={`text-ink hidden leading-none sm:inline ${size === 'lg' ? 'text-3xl' : 'text-[22px]'}`}>
        <span className="font-serif">Ventas</span>
        <span className="font-serif text-accent italic"> mx</span>
      </span>
    </span>
  )
}
