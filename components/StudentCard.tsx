"use client";

import React, { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";

interface ParsedStudent {
  name: string;
  homework: string;
  sp: string | null;
  tx: string | null;
  uncertain: boolean;
}

interface StudentCardProps {
  student: ParsedStudent;
  original?: ParsedStudent;
  onChange: (updated: ParsedStudent) => void;
  onRevert?: () => void;
  isDuplicate?: boolean;
}

const lbl: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#52B788",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 4,
};

const inp: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #D8F3DC",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 16,
  color: "#1B4332",
  outline: "none",
  fontFamily: "inherit",
  background: "#fff",
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  border: "1.5px solid #D8F3DC",
  padding: "14px 16px",
  marginBottom: 10,
};

export function StudentCard({ student, original, onChange, onRevert, isDuplicate }: StudentCardProps) {
  const [localName, setLocalName] = useState(student.name);
  const displayName = localName;

  const borderColor = isDuplicate ? "#E63946" : student.uncertain ? "#FFB703" : "#D8F3DC";
  const avatarBg = isDuplicate ? "#FFE5E7" : student.uncertain ? "#FFF3CD" : "#D8F3DC";
  const avatarColor = isDuplicate ? "#C1121F" : student.uncertain ? "#B07D00" : "#2D6A4F";
  const statusColor = isDuplicate ? "#C1121F" : student.uncertain ? "#B07D00" : "#74C69D";
  const statusIcon = isDuplicate ? (
    <AlertTriangle size={16} />
  ) : student.uncertain ? (
    <AlertTriangle size={16} />
  ) : (
    <Check size={16} />
  );
  const statusText = isDuplicate
    ? "Duplicate name"
    : student.uncertain
    ? "Check this entry"
    : "Parsed";

  return (
    <div
      style={{
        ...card,
        border: `1.5px solid ${borderColor}`,
      }}
    >
      {/* Always-visible summary row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: avatarBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: avatarColor,
            flexShrink: 0,
          }}
        >
          {student.name[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={displayName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={() => {
              if (localName !== student.name) {
                onChange({ ...student, name: localName });
              }
            }}
            placeholder="Student name"
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "#1B4332",
              border: "none",
              borderBottom: "1.5px solid #D8F3DC",
              padding: "2px 0",
              width: "100%",
              background: "transparent",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: statusColor,
              fontWeight: 500,
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {statusIcon}
            {statusText}
          </div>
        </div>
        {onRevert && original && (
          <button
            onClick={onRevert}
            title="Revert to parsed values"
            style={{
              background: "none",
              border: "1px solid #95D5B2",
              borderRadius: 8,
              color: "#52B788",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Revert
          </button>
        )}
      </div>
      {/* Always-visible editable fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={lbl}>Homework</label>
          <input
            value={student.homework || ""}
            onChange={(e) => onChange({ ...student, homework: e.target.value })}
            placeholder="NA"
            style={{ ...inp }}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {(["sp", "tx"] as const).map((f) => (
            <div key={f} style={{ flex: 1 }}>
              <label style={lbl}>
                {f.toUpperCase()}
              </label>
              <input
                value={student[f] || ""}
                onChange={(e) => onChange({ ...student, [f]: e.target.value })}
                placeholder="—"
                style={{ ...inp }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Re-export ParsedStudent type for consumers
export type { ParsedStudent };

export default StudentCard;
