"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "paddock-2026-lights";

export function hasSeenLights() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLightsSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

type LightsOutProps = {
  ready: boolean;
  onComplete: () => void;
};

export function LightsOut({ ready, onComplete }: LightsOutProps) {
  const [lit, setLit] = useState(0);
  const [out, setOut] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const done = useRef(false);
  const readyRef = useRef(ready);
  const onCompleteRef = useRef(onComplete);
  readyRef.current = ready;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timeline = gsap.timeline();
    for (let count = 1; count <= 5; count += 1) {
      timeline.to({}, { duration: count === 1 ? 0.55 : 0.62, onComplete: () => setLit(count) });
    }
    timeline.to({}, { duration: 1.55, onStart: () => setWaiting(true) });
    timeline.add(() => {
      setOut(true);
      setLit(0);
      setWaiting(false);
    });
    timeline.to({}, { duration: 0.42 });
    timeline.add(() => {
      if (done.current) return;
      const finish = () => {
        if (done.current) return;
        done.current = true;
        markLightsSeen();
        onCompleteRef.current();
      };
      if (readyRef.current) finish();
      else {
        const poll = window.setInterval(() => {
          if (readyRef.current) {
            window.clearInterval(poll);
            finish();
          }
        }, 50);
      }
    });
    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020203] text-[#E8E2D4]"
      role="dialog"
      aria-modal="true"
      aria-label="Start lights"
    >
      <p className="font-mono text-[11px] tracking-[0.22em] text-[#E8E2D4]/55">
        {out && !ready ? "FORMATION LAP" : waiting ? "HOLD" : "LIGHTS"}
      </p>
      <div className="mt-10 flex items-center gap-5 sm:gap-7" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const on = !out && index < lit;
          return (
            <span
              key={index}
              className="relative block size-10 rounded-full sm:size-12"
              style={{
                background: on ? "#D01212" : "#1a0c0c",
                boxShadow: on
                  ? "0 0 18px 6px rgba(208,18,18,0.72), 0 0 60px 12px rgba(208,18,18,0.28)"
                  : "inset 0 0 8px rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "background 80ms linear, box-shadow 80ms linear",
              }}
            />
          );
        })}
      </div>
      <p className="mt-12 max-w-sm text-center font-[family-name:var(--font-archivo)] text-sm text-[#E8E2D4]/70">
        Five reds. Then the pause that is longer than it should be.
      </p>
      <Button
        variant="ghost"
        className="mt-8 text-[#E8E2D4]/70 hover:bg-white/5 hover:text-[#E8E2D4]"
        onClick={() => {
          if (done.current) return;
          done.current = true;
          markLightsSeen();
          onCompleteRef.current();
        }}
      >
        Skip to the line
      </Button>
    </div>
  );
}
