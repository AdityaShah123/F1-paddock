import { Suspense } from "react";
import { Experience } from "@/components/experience";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020203]" />}>
      <Experience />
    </Suspense>
  );
}
