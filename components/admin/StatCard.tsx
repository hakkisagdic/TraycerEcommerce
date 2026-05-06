"use client";
import React from "react";

export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white/5 p-4 rounded-md shadow-sm">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}
