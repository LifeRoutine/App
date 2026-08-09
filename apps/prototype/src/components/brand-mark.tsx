import Image from "next/image";

export function BrandMark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/logo-full.png"
      alt=""
      width={size}
      height={size}
      className={`object-contain ${className}`}
      aria-hidden
      unoptimized
    />
  );
}

/** Volles Logo (Icon + Wordmark + Claim), zentriert. */
export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  const width = compact ? 168 : 220;
  const height = compact ? 72 : 96;

  return (
    <div className="flex w-full justify-center">
      <Image
        src="/brand/logo-full.png"
        alt="LifeRoutine — Dein Alltag. Einfacher."
        width={width}
        height={height}
        className="h-auto w-auto max-w-[70%] object-contain"
        priority
        unoptimized
      />
    </div>
  );
}
