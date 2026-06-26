"use client";

import React from "react";

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        opacity: visible ? 1 : 0,
        transition: "all 0.3s ease",
        background: "#1B4332",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 22px",
        fontSize: 14,
        fontWeight: 700,
        zIndex: 200,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {message}
    </div>
  );
}

export default Toast;
