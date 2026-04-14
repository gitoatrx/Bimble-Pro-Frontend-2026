import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
  size?: number;
};

export function BrandMark({
  className,
  priority = false,
  size = 40,
}: BrandMarkProps) {
  return (
    <Image
      src="/bimble-logo.png"
      alt="Bimble logo"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-full object-cover", className)}
    />
  );
}
