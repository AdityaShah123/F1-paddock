import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#020203] px-6 text-[#E8E2D4]">
      <p className="font-mono text-xs tracking-[0.2em] text-[#E8E2D4]/50">OUT OF THE PIT LANE</p>
      <h1 className="mt-4 text-4xl" style={{ fontVariationSettings: '"wdth" 72', fontWeight: 650 }}>
        No such corner
      </h1>
      <Link href="/" className="mt-6 underline underline-offset-4">
        Back to the line
      </Link>
    </main>
  );
}
