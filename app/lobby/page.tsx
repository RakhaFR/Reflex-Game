"use client";

import dynamic from "next/dynamic";

const Lobby = dynamic(() => import("@/components/Lobby"), { ssr: false });

export default function LobbyPage() {
  return <Lobby />;
}

