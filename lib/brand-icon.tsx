type BrandIconProps = {
  size: number;
};

export function BrandIconMark({ size }: BrandIconProps) {
  const ring = size * 0.075;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: size * 0.22,
        background: "linear-gradient(135deg, #2563eb 0%, #6366f1 100%)",
      }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx="32" cy="32" r="28" stroke="white" strokeWidth={ring} />
        <circle cx="32" cy="32" r="18" stroke="white" strokeWidth={ring} />
        <circle cx="32" cy="32" r="8" fill="white" />
      </svg>
    </div>
  );
}
