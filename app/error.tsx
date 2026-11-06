"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1C2636] px-6 text-[#F4EFE4]">
      <h1 className="text-3xl" style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}>
        The lap broke
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#E8E2D4]/70">
        {error.message || "Something in the scene failed to render."}
      </p>
      <Button className="mt-6" onClick={reset}>
        Restart the lap
      </Button>
    </main>
  );
}
