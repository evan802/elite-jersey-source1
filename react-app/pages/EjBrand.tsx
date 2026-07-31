/**
 * Shared Elite Jersey brand mark — used on the storefront and the Seller Hub
 * so the logo always stays in sync across both sides of the product.
 */

export const EJ_LOGO_URL =
  "https://r2-pub.rork.com/projects/yjqgibkbwlxfph55bsglg/assets/2c7af047-e1cc-4812-93d4-13aea076aab2.png";

const VOLT = "#C8F231";

interface EjBrandProps {
  /** "dark" renders light text for dark backgrounds; "light" renders dark text. */
  tone?: "dark" | "light";
  /** Pixel size of the crest mark. */
  size?: number;
  /** Optional badge rendered after the wordmark (e.g. "Seller Hub"). */
  badge?: string;
  onClick?: () => void;
}

export const EjBrand = ({ tone = "dark", size = 40, badge, onClick }: EjBrandProps) => {
  const textColor = tone === "dark" ? "#F2F4EF" : "#101310";
  const content = (
    <span className="flex select-none items-center gap-2.5">
      <img
        src={EJ_LOGO_URL}
        alt="Elite Jersey crest"
        style={{ height: size, width: size }}
        className="shrink-0 object-contain drop-shadow-[0_2px_10px_rgba(200,242,49,0.35)] transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"
        draggable={false}
      />
      <span className="font-display uppercase leading-none tracking-wide" style={{ color: textColor, fontSize: size * 0.52 }}>
        Elite<span style={{ color: tone === "dark" ? VOLT : "#7A9A0E" }}>Jersey</span>
      </span>
      {badge && (
        <span
          className="rounded-full px-2 py-0.5 font-monotb text-[9px] font-bold uppercase tracking-[0.15em]"
          style={tone === "dark" ? { backgroundColor: VOLT, color: "#0B0D0B" } : { backgroundColor: "#101310", color: VOLT }}
        >
          {badge}
        </span>
      )}
    </span>
  );

  if (!onClick) return <span className="group inline-flex items-center">{content}</span>;

  return (
    <button type="button" onClick={onClick} className="group inline-flex items-center">
      {content}
    </button>
  );
};
