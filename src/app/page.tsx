"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex h-dvh w-full flex-col gap-4 overflow-hidden bg-slate-100 p-2">
      {/* Therapist — 30% */}
      <button
        className="flex flex-3 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-8 border-white bg-cover bg-center bg-no-repeat shadow-2xl transition-opacity active:opacity-90"
        style={{ backgroundImage: "url('/therapist.jpg')" }}
        onClick={() => router.push("/therapist")}
      >
        <span className="text-7xl font-bold tracking-tight text-black">
          I want to earn money
        </span>
      </button>

      {/* Client — 70% */}
      <button
        className="flex flex-7 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-8 border-white bg-cover bg-center transition-opacity active:opacity-90"
        style={{ backgroundImage: "url('/client.jpg')" }}
        onClick={() => router.push("/client")}
      >
        <span className="text-7xl font-bold tracking-tight text-stone-800">
          Book a service
        </span>
      </button>

      {/* Divider */}
      <div className="h-px shrink-0 bg-stone-300/60" />
    </div>
  );
}
