export default function CoinIcon({ size = 16 }) {
  const cx = 50, cy = 50
  const notches = 80
  const outerR = 47, innerR = 41
  const edgePoints = []
  for (let i = 0; i < notches; i++) {
    const a1 = (i / notches) * Math.PI * 2 - Math.PI / 2
    const a2 = ((i + 0.5) / notches) * Math.PI * 2 - Math.PI / 2
    edgePoints.push(`${cx + Math.cos(a1) * outerR},${cy + Math.sin(a1) * outerR}`)
    edgePoints.push(`${cx + Math.cos(a2) * innerR},${cy + Math.sin(a2) * innerR}`)
  }
  const starPts = []
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10 - Math.PI / 2
    const r = i % 2 === 0 ? 20 : 9
    starPts.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`)
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <defs>
        <radialGradient id="coinBg" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="25%" stopColor="#FFE566" />
          <stop offset="60%" stopColor="#FFD700" />
          <stop offset="85%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
        <radialGradient id="starBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFF0" />
          <stop offset="45%" stopColor="#FFF176" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <radialGradient id="shineGrad" cx="33%" cy="25%" r="52%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#78350F" floodOpacity="0.45" />
        </filter>
      </defs>
      <polygon points={edgePoints.join(' ')} fill="url(#coinBg)" filter="url(#dropShadow)" />
      <circle cx={cx} cy={cy} r={38} fill="url(#coinBg)" />
      <circle cx={cx} cy={cy} r={38} fill="none" stroke="#92400E" strokeWidth="1" opacity="0.45" />
      <circle cx={cx} cy={cy} r={34} fill="none" stroke="#F59E0B" strokeWidth="0.6" opacity="0.35" />
      <polygon points={starPts.join(' ')} fill="url(#starBg)" stroke="#B45309" strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={38} fill="url(#shineGrad)" />
      <ellipse cx="37" cy="29" rx="7" ry="3.5" fill="#fff" opacity="0.22" transform="rotate(-38 37 29)" />
    </svg>
  )
}
