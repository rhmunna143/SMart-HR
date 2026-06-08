import { cn } from '@/lib/utils';

/** The Smart HR mark — a gradient rounded-square with a task checklist + check. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={cn('h-8 w-8', className)}
      role="img"
      aria-label="Smart HR logo"
    >
      <defs>
        <linearGradient id="shGrad" x1="48" y1="48" x2="464" y2="464" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#shGrad)" />
      <rect x="150" y="158" width="150" height="34" rx="17" fill="white" fillOpacity="0.45" />
      <rect x="150" y="320" width="150" height="34" rx="17" fill="white" fillOpacity="0.45" />
      <path
        d="M150 256 L196 302 L300 198"
        stroke="white"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="356" cy="256" r="26" fill="white" />
    </svg>
  );
}

/** Full lockup: mark + "Smart HR" wordmark. */
export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">
          Smart<span className="text-[#7c6cf0] dark:text-[#a99cf7]">HR</span>
        </span>
      )}
    </span>
  );
}
