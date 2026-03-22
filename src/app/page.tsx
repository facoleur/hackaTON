"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      {/* Therapist — 30% */}
      <button
        className="flex flex-3 cursor-pointer flex-col items-center justify-center gap-2 transition-opacity active:opacity-90"
        style={{
          background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)",
        }}
        onClick={() => router.push("/therapist")}
      >
        <span className="text-4xl">💆</span>
        <span className="text-xl font-bold tracking-tight text-slate-100">
          I&apos;m a therapist
        </span>
        <span className="text-sm font-medium text-slate-400">
          Manage your schedule & clients
        </span>
      </button>
      {/* Client — 70% */}
      <button
        className="flex flex-7 cursor-pointer flex-col items-center justify-center gap-3 transition-opacity active:opacity-90"
        style={{
          background: "linear-gradient(160deg, #f5e6d3 0%, #e8c9a8 100%)",
        }}
        onClick={() => router.push("/client")}
      >
        <span className="text-6xl">🤲</span>
        <span className="text-3xl font-bold tracking-tight text-stone-800">
          Book a massage
        </span>
        <span className="text-base font-medium text-stone-500">
          Find and book a therapist near you
        </span>
      </button>

      {/* Divider */}
      <div className="h-px shrink-0 bg-stone-300/60" />
    </div>
  );
}
