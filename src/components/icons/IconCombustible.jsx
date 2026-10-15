export function IconCombustible({ size = 24, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
      <path d="M2 22h14" />
      <path d="M7 7h4" />
      <path d="M15 12h2a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0V9l-4-4" />
    </svg>
  )
}
