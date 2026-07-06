import Image from "next/image";

type AllerMealLogoProps = {
  variant?: "mark" | "full";
  className?: string;
};

const logoMarkSrc = "/brand/allermeal-logo.png";

function AllerMealMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src={logoMarkSrc}
      alt=""
      width={1280}
      height={1280}
      className={`block object-contain ${className}`}
      priority
    />
  );
}

export function AllerMealLogo({
  variant = "full",
  className = "",
}: AllerMealLogoProps) {
  if (variant === "mark") {
    return <AllerMealMark className={className} />;
  }

  return (
    <span className={`inline-flex items-center gap-[3px] ${className}`}>
      <AllerMealMark className="h-6 w-6 shrink-0" />
      <span className="text-[23px] font-bold leading-none tracking-[-0.04em] text-zinc-950 dark:text-zinc-50">
        AllerMeal
      </span>
    </span>
  );
}
