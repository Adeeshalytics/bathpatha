import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";
import nayantha from "@/images/nayantha.webp";
import lahiru from "@/images/lahiru.webp";

// Profile photos keyed by user name (lowercased). Names without a photo
// fall back to a coloured circle showing the first letter.
const PHOTOS: Record<string, StaticImageData> = {
  nayantha,
  lahiru,
};

export function Avatar({
  name,
  className,
  textClassName,
}: {
  name: string;
  /** Size + shape of the circle, e.g. "h-12 w-12". */
  className?: string;
  /** Font size for the fallback initial, e.g. "text-lg". */
  textClassName?: string;
}) {
  const photo = PHOTOS[name.trim().toLowerCase()];

  if (photo) {
    return (
      <span className={cn("relative overflow-hidden rounded-full", className)}>
        <Image
          src={photo}
          alt={name}
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 text-primary",
        textClassName,
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
