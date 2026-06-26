"use client";

import React from "react";
import { Upload, Clock, Settings } from "lucide-react";

interface BottomNavProps {
  active: string;
  onChange: (tab: string) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const tabs = [
    { id: "upload", label: "Upload", icon: <Upload size={20} /> },
    { id: "history", label: "History", icon: <Clock size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1.5px solid #D8F3DC",
        display: "flex",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom,8px)",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            padding: "10px 0 6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              color: active === t.id ? "#2D6A4F" : "#95D5B2",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s ease, transform 0.2s ease",
              transform: active === t.id ? "scale(1.15)" : "scale(1)",
            }}
          >
            {t.icon}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: active === t.id ? "#2D6A4F" : "#95D5B2",
              letterSpacing: "0.3px",
              transition: "color 0.2s ease",
            }}
          >
            {t.label}
          </span>
          <div
            style={{
              width: 20,
              height: 3,
              background: "#52B788",
              borderRadius: 2,
              opacity: active === t.id ? 1 : 0,
              transform: active === t.id ? "scaleX(1)" : "scaleX(0)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          />
        </button>
      ))}
    </div>
  );
}

export default BottomNav;
