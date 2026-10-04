type BrandIconProps = {
  size: number;
  className?: string;
};

export function BrandIconMark({ size, className }: Readonly<BrandIconProps>) {
  return (
    <img
      src="/icons/brand.png"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
