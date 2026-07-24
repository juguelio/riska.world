import Image from "next/image";

type RiskaLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

export function RiskaLogo({ className = "", markClassName = "h-8 w-8", showWordmark = true }: RiskaLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        alt=""
        aria-hidden="true"
        className={markClassName}
        height={128}
        src="/riska-mark.svg"
        width={128}
      />
      {showWordmark && <span className="font-semibold tracking-[0.24em] text-[#f5f7fb]">RISKA</span>}
    </span>
  );
}
