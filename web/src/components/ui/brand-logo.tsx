interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${sizeMap[size]} ${className}`}
    >
      <img src="/openflag.png" alt="OpenFlag" className="w-full h-full" />
    </span>
  );
}
