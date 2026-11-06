import { Suspense } from "react";
import { Experience } from "@/components/experience";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#151B26]" />}>
      <Experience />
    </Suspense>
  );
}
