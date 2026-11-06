export function SiteFooter() {
  return (
    <footer className="border-t border-[#E8E2D4]/10 bg-[#020203]/85 px-5 py-3 text-[10px] leading-4 text-[#E8E2D4]/45 backdrop-blur-sm">
      <p>
        Unofficial fan site, unaffiliated with Formula 1.{" "}
        <a
          className="underline decoration-[#E8E2D4]/30 underline-offset-2 hover:text-[#E8E2D4]"
          href="https://www.formula1.com/en/information/guidelines.4EOKE9RRqevL4niTK9kWyt"
        >
          F1 fan-site guidelines
        </a>
        . Static Jolpica / OpenF1 data. No live car_data.
      </p>
    </footer>
  );
}
