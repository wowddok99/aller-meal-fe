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
    <span className={`inline-flex items-center gap-[2px] ${className}`}>
      <AllerMealMark className="h-8 w-8 shrink-0" />
      <span className="text-[24px] font-extrabold leading-none tracking-[-0.035em] text-zinc-950 dark:text-zinc-50">
        AllerMeal
      </span>
    </span>
  );
}
