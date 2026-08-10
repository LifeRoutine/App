import {
  wasteBinColor,
  wasteBinLabel,
  type WasteBinKind,
} from "@/lib/waste-bins";

/** Kompaktes Tonnen-Symbol (SVG), farblich nach Abfallart. */
export function WasteBinIcon({
  kind,
  size = 22,
  className = "",
}: {
  kind: WasteBinKind;
  size?: number;
  className?: string;
}) {
  const fill = wasteBinColor[kind];
  const label = wasteBinLabel[kind];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label={label}
      role="img"
    >
      <title>{label}</title>
      {/* Deckel */}
      <path
        d="M7 7h10l-1-2H8L7 7Z"
        fill={fill}
        opacity={0.9}
      />
      <rect x="5.5" y="7" width="13" height="1.5" rx="0.5" fill={fill} />
      {/* Korpus */}
      <path
        d="M7 9h10l-1 11H8L7 9Z"
        fill={fill}
      />
      {/* Riffel / Griff-Linien */}
      <path
        d="M10 11.5v6M12 11.5v6M14 11.5v6"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.45}
      />
    </svg>
  );
}

/** Kleiner Farbpunkt für die Wochenleiste. */
export function WasteBinDot({
  kind,
  active = false,
}: {
  kind: WasteBinKind;
  active?: boolean;
}) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{
        backgroundColor: active ? "#fff" : wasteBinColor[kind],
        boxShadow: active ? "0 0 0 1px rgba(255,255,255,0.4)" : undefined,
      }}
      title={wasteBinLabel[kind]}
    />
  );
}
