"use client";

import dynamic from "next/dynamic";

const GameArena = dynamic(() => import("@/components/GameArena"), { ssr: false });

export default function GamePage() {
  return <GameArena />;
}

