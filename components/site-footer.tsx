export function SiteFooter() {
  return (
    <footer className="border-t border-[#F4EFE4]/15 bg-[#1C2636]/92 px-5 py-3 text-[10px] leading-4 text-[#F4EFE4]/60 backdrop-blur-sm">
      <p>
        Unofficial fan site, unaffiliated with Formula 1.{" "}
        <a
          className="underline decoration-[#F4EFE4]/35 underline-offset-2 hover:text-[#F4EFE4]"
          href="https://www.formula1.com/en/information/guidelines.4EOKE9RRqevL4niTK9kWyt"
        >
          F1 fan-site guidelines
        </a>
        . Results and fastest laps from Jolpica. Portraits from Wikimedia Commons / Wikipedia
        (typically CC BY-SA), cached locally and shown in greyscale. Colour lives on the podium. No live car_data.
      </p>
    </footer>
  );
}
