"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Lenis from "lenis";
import { LightsOut, hasSeenLights } from "@/components/lights-out";
import { Hud } from "@/components/hud";
import { PodiumDock } from "@/components/podium";
import { ReducedJourney } from "@/components/reduced-journey";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { loadCircuit, loadPaddock } from "@/lib/load-data";
import { publishHud, setLap } from "@/lib/lap-store";
import { buildStops } from "@/lib/stops";
import type { Circuit, PaddockData } from "@/lib/types";

const CircuitCanvas = dynamic(() => import("@/components/circuit-canvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0E141C]" />,
});

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const update = () => {
      setMobile(window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return mobile;
}

export function Experience() {
  const reducedMotion = usePrefersReducedMotion();
  const mobile = useMobile();
  const [data, setData] = useState<PaddockData | null>(null);
  const [circuit, setCircuit] = useState<Circuit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [circuitLoading, setCircuitLoading] = useState(false);
  const [phase, setPhase] = useState<"boot" | "lights" | "drive">("boot");

  useEffect(() => {
    setPhase(hasSeenLights() ? "drive" : "lights");
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPaddock("spa")
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setCircuit(payload.circuit);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Season data failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stops = useMemo(() => (data ? buildStops(data.season) : []), [data]);

  useEffect(() => {
    if (phase !== "drive" || reducedMotion) return;
    const lenis = new Lenis({
      lerp: mobile ? 0.14 : 0.1,
      wheelMultiplier: mobile ? 1.05 : 1.28,
      touchMultiplier: 1.2,
      autoRaf: false,
    });
    let frame = 0;
    let hudClock = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
      const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const t = window.scrollY / limit;
      const v = lenis.velocity;
      setLap(t, v);
      if (time - hudClock > 80) {
        hudClock = time;
        publishHud(t, v);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [phase, reducedMotion, mobile, circuit?.circuitId]);

  const selectCircuit = useCallback(async (id: string) => {
    setCircuitLoading(true);
    try {
      const next = await loadCircuit(id);
      setCircuit(next);
      window.scrollTo({ top: 0, behavior: "auto" });
      setLap(0, 0);
      publishHud(0, 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "That circuit line failed to load");
    } finally {
      setCircuitLoading(false);
    }
  }, []);

  if (error && !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0E141C] px-6 text-[#F4EFE4]">
        <h1 className="text-3xl" style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}>
          Data did not arrive
        </h1>
        <p className="mt-3 max-w-md text-sm text-[#E8E2D4]/70">{error}</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </main>
    );
  }

  const ready = Boolean(data && circuit);

  return (
    <div className="bg-[#0E141C] text-[#F4EFE4]">
      <a
        href="#season-copy"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[#E8E2D4] focus:px-3 focus:py-2 focus:text-[#020203]"
      >
        Skip to season text
      </a>
      {phase === "lights" && !reducedMotion ? (
        <LightsOut ready={ready} onComplete={() => setPhase("drive")} />
      ) : null}
      {phase === "drive" && !ready ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0E141C]">
          <p className="font-mono text-xs tracking-[0.22em] text-[#E8E2D4]/60">FORMATION LAP</p>
        </div>
      ) : null}
      {data && circuit && reducedMotion ? (
        <>
          <ReducedJourney data={data} circuit={circuit} onSelectCircuit={selectCircuit} />
          <SiteFooter />
        </>
      ) : null}
      {data && circuit && !reducedMotion ? (
        <>
          <div className="h-[920vh]" aria-hidden="true" />
          <div className="fixed inset-0 flex flex-col bg-[#0E141C]">
            <div className="relative min-h-0 flex-1">
              <CircuitCanvas circuit={circuit} stops={stops} mobile={mobile} />
              {phase === "drive" ? (
                <Hud
                  data={data}
                  circuit={circuit}
                  stops={stops}
                  onSelectCircuit={selectCircuit}
                  circuitLoading={circuitLoading}
                />
              ) : null}
            </div>
            {phase === "drive" ? <PodiumDock data={data} stops={stops} /> : null}
            {phase === "drive" ? (
              <div className="pointer-events-auto shrink-0">
                <SiteFooter />
              </div>
            ) : null}
          </div>
          <div id="season-copy" className="sr-only">
            <ReducedJourney data={data} circuit={circuit} onSelectCircuit={selectCircuit} />
          </div>
        </>
      ) : null}
    </div>
  );
}
