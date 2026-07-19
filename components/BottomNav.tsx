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
        borderTop: "1px solid #E7E5E0",
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
              color: active === t.id ? "#5C8C76" : "#A8A29E",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s ease, transform 0.2s ease",
              transform: active === t.id ? "scale(1.1)" : "scale(1)",
            }}
          >
            {t.icon}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: active === t.id ? 600 : 400,
              color: active === t.id ? "#5C8C76" : "#A8A29E",
              letterSpacing: "0.3px",
              transition: "color 0.2s ease",
            }}
          >
            {t.label}
          </span>
          <div
            style={{
              width: 20,
              height: 2,
              background: "#5C8C76",
              borderRadius: 1,
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
