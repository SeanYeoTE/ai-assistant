"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────
interface ClassRecord {
  id: string;
  name: string;
  students: string[];
}

interface ParsedStudent {
  name: string;
  homework: string;
  sp: string | null;
  tx: string | null;
  uncertain: boolean;
}

interface HistoryEntry {
  date: string;
  homework: string;
  sp: string | null;
  tx: string | null;
}

interface HistoryStore {
  [classId: string]: {
    [studentName: string]: HistoryEntry[];
  };
}

// ── Storage helpers ─────────────────────────────────────────────
function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? (JSON.parse(s) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

// ── Template system ─────────────────────────────────────────────
// The template stores {{vars}} directly. No sampleToTemplate() needed.
const DEFAULT_TEMPLATE = `Homework Success HWS

Dear {{className}} Parents,

{{studentName}} Update — {{date}}
Homework: {{homework}}

SP: {{sp}}
TX: {{tx}}

With Love & Light,
{{teacherName}}`;

function generateMessage(
  student: ParsedStudent,
  className: string,
  date: Date,
  template: string,
  teacherName: string
): string {
  const dateStr = date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return template
    .replace(/{{className}}/g, className)
    .replace(/{{studentName}}/g, student.name)
    .replace(/{{date}}/g, dateStr)
    .replace(/{{homework}}/g, student.homework || "NA")
    .replace(/{{sp}}/g, student.sp || "—")
    .replace(/{{tx}}/g, student.tx || "—")
    .replace(/{{teacherName}}/g, teacherName);
}

function formatDate(d: Date | string): string {
  return d instanceof Date
    ? d.toLocaleDateString("en-SG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : d;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_CLASSES: ClassRecord[] = [
  {
    id: "c1",
    name: "P1 Diligence",
    students: ["Arissa", "Jerome", "Bryan", "Isaac", "Oliver"],
  },
  {
    id: "c2",
    name: "P2 Kindness",
    students: ["Elias", "Anya", "Kai", "Ayden", "Max", "Eryn", "Ryan", "Isaiah"],
  },
];

// ── Shared styles ────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#52B788",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 6,
};
const inp: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #D8F3DC",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  color: "#1B4332",
  outline: "none",
  fontFamily: "inherit",
  background: "#fff",
};
const pri: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: 12,
  background: "#2D6A4F",
  color: "#fff",
  border: "none",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
const sec: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  background: "#fff",
  color: "#2D6A4F",
  border: "1.5px solid #D8F3DC",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  border: "1.5px solid #D8F3DC",
  padding: "14px 16px",
  marginBottom: 10,
};

// ── Image resize helper ──────────────────────────────────────────
const MAX_IMAGE_WIDTH = 1400;

function resizeImageToBase64(
  file: File,
  maxWidth: number
): Promise<{ base64: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const base64 = resizedDataUrl.split(",")[1];
        resolve({ base64, preview: resizedDataUrl });
      };
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Onboarding ───────────────────────────────────────────────────
interface OnboardingProps {
  onDone: (teacherName: string, classes: ClassRecord[]) => void;
}

function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [teacherName, setTeacherName] = useState("");
  const [classes, setClasses] = useState<ClassRecord[]>(() => [
    { id: Date.now() + "", name: "", students: [""] },
  ]);

  const addClass = () =>
    setClasses((p) => [...p, { id: Date.now() + "", name: "", students: [""] }]);
  const updateClassName = (id: string, name: string) =>
    setClasses((p) => p.map((c) => (c.id === id ? { ...c, name } : c)));
  const addStudent = (id: string) =>
    setClasses((p) =>
      p.map((c) => (c.id === id ? { ...c, students: [...c.students, ""] } : c))
    );
  const updateStudent = (cid: string, idx: number, val: string) =>
    setClasses((p) =>
      p.map((c) =>
        c.id === cid
          ? { ...c, students: c.students.map((s, i) => (i === idx ? val : s)) }
          : c
      )
    );
  const removeStudent = (cid: string, idx: number) =>
    setClasses((p) =>
      p.map((c) =>
        c.id === cid
          ? { ...c, students: c.students.filter((_, i) => i !== idx) }
          : c
      )
    );
  const removeClass = (id: string) =>
    setClasses((p) => p.filter((c) => c.id !== id));

  const canFinish =
    teacherName.trim() &&
    classes.some((c) => c.name.trim() && c.students.some((s) => s.trim()));

  const finish = () => {
    const cleaned = classes
      .filter((c) => c.name.trim())
      .map((c) => ({ ...c, students: c.students.filter((s) => s.trim()) }));
    onDone(teacherName.trim(), cleaned);
  };

  const steps = ["Welcome", "Your Classes", "Students"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F0FFF4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i <= step ? "#2D6A4F" : "#D8F3DC",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🌿</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#1B4332",
                marginBottom: 10,
                letterSpacing: "-0.5px",
              }}
            >
              Welcome to
              <br />
              Homework Success
            </div>
            <div
              style={{
                fontSize: 15,
                color: "#52B788",
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              Upload your handwritten progress sheets and generate parent
              messages in seconds.
            </div>
            <div style={{ textAlign: "left", marginBottom: 20 }}>
              <label style={lbl}>Your name</label>
              <input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Teacher Yie Teng"
                style={inp}
              />
            </div>
            <button
              onClick={() => teacherName.trim() && setStep(1)}
              disabled={!teacherName.trim()}
              style={{ ...pri, opacity: teacherName.trim() ? 1 : 0.4 }}
            >
              Get Started →
            </button>
            <button
              onClick={() => onDone("Teacher", [])}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                color: "#74C69D",
                fontSize: 13,
                cursor: "pointer",
                padding: "8px",
              }}
            >
              Skip setup — I&#39;ll add classes later
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div
              style={{ fontSize: 22, fontWeight: 800, color: "#1B4332", marginBottom: 6 }}
            >
              Your Classes
            </div>
            <div style={{ fontSize: 14, color: "#52B788", marginBottom: 24 }}>
              Add the classes you teach.
            </div>
            {classes.map((cls, ci) => (
              <div key={cls.id} style={{ ...card, marginBottom: 12 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <input
                    value={cls.name}
                    onChange={(e) => updateClassName(cls.id, e.target.value)}
                    placeholder={`Class ${ci + 1} name, e.g. P2 Kindness`}
                    style={{ ...inp, flex: 1 }}
                  />
                  {classes.length > 1 && (
                    <button
                      onClick={() => removeClass(cls.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#FFB703",
                        fontSize: 18,
                        cursor: "pointer",
                        padding: "0 4px",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addClass}
              style={{ ...sec, width: "100%", textAlign: "center", marginBottom: 20 }}
            >
              + Add another class
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ ...sec }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!classes.some((c) => c.name.trim())}
                style={{
                  ...pri,
                  flex: 1,
                  opacity: classes.some((c) => c.name.trim()) ? 1 : 0.4,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div
              style={{ fontSize: 22, fontWeight: 800, color: "#1B4332", marginBottom: 6 }}
            >
              Add Students
            </div>
            <div style={{ fontSize: 14, color: "#52B788", marginBottom: 20 }}>
              Add students to each class. You can always edit these later.
            </div>
            {classes
              .filter((c) => c.name.trim())
              .map((cls) => (
                <div key={cls.id} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#2D6A4F",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#52B788",
                      }}
                    />
                    {cls.name}
                  </div>
                  {cls.students.map((s, si) => (
                    <div
                      key={si}
                      style={{ display: "flex", gap: 8, marginBottom: 8 }}
                    >
                      <input
                        value={s}
                        onChange={(e) =>
                          updateStudent(cls.id, si, e.target.value)
                        }
                        placeholder={`Student ${si + 1}`}
                        style={{ ...inp, flex: 1 }}
                      />
                      {cls.students.length > 1 && (
                        <button
                          onClick={() => removeStudent(cls.id, si)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#95D5B2",
                            fontSize: 16,
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addStudent(cls.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#52B788",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    + Add student
                  </button>
                </div>
              ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep(1)} style={sec}>
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={!canFinish}
                style={{ ...pri, flex: 1, opacity: canFinish ? 1 : 0.4 }}
              >
                Finish Setup →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step dots ────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ["Upload", "Review", "Send"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {steps.map((label, i) => {
        const idx = i + 1,
          done = current > idx,
          active = current === idx;
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? 1 : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: done ? "#2D6A4F" : active ? "#52B788" : "#D8F3DC",
                  color: done || active ? "#fff" : "#74C69D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  transition: "all 0.3s",
                }}
              >
                {done ? "✓" : idx}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 400,
                  color: active ? "#2D6A4F" : "#74C69D",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: done ? "#52B788" : "#D8F3DC",
                  margin: "0 6px",
                  marginBottom: 18,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Student card (review) ────────────────────────────────────────
interface StudentCardProps {
  student: ParsedStudent;
  onChange: (updated: ParsedStudent) => void;
}

function StudentCard({ student, onChange }: StudentCardProps) {
  return (
    <div
      style={{
        ...card,
        border: `1.5px solid ${student.uncertain ? "#FFB703" : "#D8F3DC"}`,
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
            background: student.uncertain ? "#FFF3CD" : "#D8F3DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: student.uncertain ? "#B07D00" : "#2D6A4F",
            flexShrink: 0,
          }}
        >
          {student.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1B4332" }}>
            {student.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: student.uncertain ? "#B07D00" : "#74C69D",
              fontWeight: 500,
            }}
          >
            {student.uncertain ? "⚠ Check this entry" : "✓ Parsed"}
          </div>
        </div>
        {/* Inline SP/TX chips */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {student.sp && (
            <span
              style={{
                background: "#F0FFF4",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 11,
                color: "#2D6A4F",
                fontWeight: 600,
              }}
            >
              SP: {student.sp}
            </span>
          )}
          {student.tx && (
            <span
              style={{
                background: "#F0FFF4",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 11,
                color: "#2D6A4F",
                fontWeight: 600,
              }}
            >
              TX: {student.tx}
            </span>
          )}
        </div>
      </div>
      {/* Always-visible editable fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ ...lbl, marginBottom: 4 }}>Homework</label>
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
              <label style={{ ...lbl, marginBottom: 4 }}>
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

// ── Toast notification ───────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
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

// ── Upload tab ───────────────────────────────────────────────────
interface UploadTabProps {
  classes: ClassRecord[];
  messageTemplate: string;
  teacherName: string;
  onSaveHistory: (
    classId: string,
    entry: { date: string; students: ParsedStudent[] }
  ) => void;
}

function UploadTab({ classes, messageTemplate, teacherName, onSaveHistory }: UploadTabProps) {
  const [step, setStep] = useState(1);
  const [selClass, setSelClass] = useState(classes[0]?.id || "");
  const [date, setDate] = useState(todayStr);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeClass = classes.find((c) => c.id === selClass) || classes[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const { base64, preview: prev } = await resizeImageToBase64(
        file,
        MAX_IMAGE_WIDTH
      );
      setPreview(prev);
      setImageData(base64);
    } catch {
      setParseError("Could not read image file.");
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      void handleFile(e.dataTransfer.files[0]);
    },
    []
  );

  const handleParse = async () => {
    if (!imageData || !activeClass) return;
    setLoading(true);
    setParseError(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageData,
          studentNames: activeClass.students,
          className: activeClass.name,
        }),
      });
      const data = (await res.json()) as
        | { students: ParsedStudent[] }
        | { error: string };
      if (!res.ok || "error" in data) {
        setParseError("error" in data ? data.error : "Server error");
      } else {
        setStudents(data.students);
        setStep(2);
      }
    } catch {
      setParseError("Network error — could not reach parse API.");
    } finally {
      setLoading(false);
    }
  };

  const parsedDate = new Date(date + "T00:00:00");

  const saveAndSend = () => {
    if (!activeClass) return;
    const entry = {
      date: formatDate(parsedDate),
      students: students.map((s) => ({
        name: s.name,
        homework: s.homework,
        sp: s.sp,
        tx: s.tx,
        uncertain: s.uncertain,
      })),
    };
    onSaveHistory(activeClass.id, entry);
    setStep(3);
  };

  const copyOne = (s: ParsedStudent) => {
    navigator.clipboard
      .writeText(
        generateMessage(s, activeClass?.name || "", parsedDate, messageTemplate, teacherName)
      )
      .then(() => {
        setCopied((p) => ({ ...p, [s.name]: true }));
        showToast(`Copied ${s.name}'s message`);
        setTimeout(
          () => setCopied((p) => ({ ...p, [s.name]: false })),
          2000
        );
      })
      .catch(() => {});
  };

  const copyAll = () => {
    const all = students
      .map((s) =>
        generateMessage(s, activeClass?.name || "", parsedDate, messageTemplate, teacherName)
      )
      .join("\n\n---\n\n");
    navigator.clipboard
      .writeText(all)
      .then(() => showToast(`✓ All ${students.length} messages copied!`))
      .catch(() => {});
  };

  const reset = () => {
    setStep(1);
    setPreview(null);
    setImageData(null);
    setStudents([]);
    setParseError(null);
  };

  // Empty state: no classes configured
  if (classes.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#95D5B2",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 16 }}>📋</div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 17,
            color: "#2D6A4F",
            marginBottom: 10,
          }}
        >
          No classes set up yet
        </div>
        <div style={{ fontSize: 14, color: "#74C69D", lineHeight: 1.6 }}>
          Go to <strong>Settings → Classes</strong> to add your first class and
          students before uploading a progress sheet.
        </div>
      </div>
    );
  }

  if (step === 1)
    return (
      <div>
        <Steps current={1} />
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#1B4332",
              marginBottom: 4,
              letterSpacing: "-0.3px",
            }}
          >
            Upload Progress Sheet
          </div>
          <div style={{ fontSize: 14, color: "#74C69D" }}>
            Take a photo or choose from your library
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Class</label>
            <select
              value={selClass}
              onChange={(e) => setSelClass(e.target.value)}
              style={{ ...inp }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inp }}
            />
          </div>
        </div>

        {/* Primary CTA: camera */}
        <button
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.removeAttribute("capture");
              fileRef.current.setAttribute("capture", "environment");
              fileRef.current.click();
            }
          }}
          style={{ ...pri, marginBottom: 10, fontSize: 16 }}
        >
          📷 Take Photo
        </button>

        {/* Secondary CTA: library */}
        <button
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.removeAttribute("capture");
              fileRef.current.click();
            }
          }}
          style={{ ...sec, width: "100%", textAlign: "center", marginBottom: 16 }}
        >
          Choose from Library
        </button>

        {/* Hidden file input with capture for camera, removed when choosing from library */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {/* Drop zone / preview */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${
              dragging ? "#52B788" : preview ? "#2D6A4F" : "#B7E4C7"
            }`,
            borderRadius: 16,
            background: dragging ? "#F0FFF4" : preview ? "#F6FBF8" : "#FAFFFE",
            minHeight: 140,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            marginBottom: 16,
          }}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded image, dimensions unknown at build time */}
              <img
                src={preview}
                alt="sheet"
                style={{
                  maxHeight: 180,
                  maxWidth: "100%",
                  borderRadius: 8,
                  objectFit: "contain",
                }}
              />
              <span
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#52B788",
                  fontWeight: 600,
                }}
              >
                ✓ Image loaded
              </span>
            </>
          ) : (
            <div
              style={{ padding: 20, textAlign: "center", color: "#95D5B2" }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
              <div style={{ fontSize: 13 }}>
                Or drag and drop your image here
              </div>
            </div>
          )}
        </div>

        {parseError && (
          <div
            style={{
              background: "#FFF3CD",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#B07D00",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            ⚠ {parseError}
          </div>
        )}

        <button
          onClick={() => void handleParse()}
          disabled={!imageData || loading}
          style={{
            ...pri,
            opacity: !imageData || loading ? 0.45 : 1,
            cursor: !imageData || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 15,
                  height: 15,
                  border: "2px solid #fff",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Reading handwriting…
            </span>
          ) : (
            "Read & Parse Notes →"
          )}
        </button>
        <Toast message={toastMsg} visible={toastVisible} />
      </div>
    );

  if (step === 2)
    return (
      <div>
        <Steps current={2} />
        <div
          style={{
            background: "#D8F3DC",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, color: "#2D6A4F", fontSize: 14 }}>
              AI has pre-filled these from your photo
            </div>
            <div style={{ fontSize: 12, color: "#52B788", marginTop: 2 }}>
              {students.filter((s) => s.uncertain).length > 0
                ? `${
                    students.filter((s) => s.uncertain).length
                  } entries flagged — check yellow cards.`
                : "All entries look good. Edit anything before sending."}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "#74C69D" }}>
            {activeClass?.name} · {formatDate(parsedDate)}
          </span>
          <span style={{ fontSize: 13, color: "#2D6A4F", fontWeight: 700 }}>
            {students.length} students
          </span>
        </div>
        {students.map((s, i) => (
          <StudentCard
            key={s.name + i}
            student={s}
            onChange={(u) =>
              setStudents((p) => p.map((x, xi) => (xi === i ? u : x)))
            }
          />
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => setStep(1)} style={sec}>
            ← Back
          </button>
          <button onClick={saveAndSend} style={{ ...pri, flex: 1 }}>
            Generate {students.length} Messages →
          </button>
        </div>
        <Toast message={toastMsg} visible={toastVisible} />
      </div>
    );

  return (
    <div>
      <Steps current={3} />
      <div
        style={{
          background: "#D8F3DC",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>✅</span>
        <div>
          <div style={{ fontWeight: 700, color: "#2D6A4F", fontSize: 14 }}>
            {students.length} parent messages ready
          </div>
          <div style={{ fontSize: 12, color: "#52B788", marginTop: 2 }}>
            Copy individually or all at once to paste into WhatsApp.
          </div>
        </div>
      </div>
      <button
        onClick={copyAll}
        style={{ ...pri, marginBottom: 14 }}
      >
        Copy All {students.length} Messages
      </button>
      {students.map((s, i) => (
        <div key={s.name + i} style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontWeight: 700, color: "#1B4332", fontSize: 15 }}>
              {s.name}
            </span>
            <button
              onClick={() => copyOne(s)}
              style={{
                background: copied[s.name] ? "#2D6A4F" : "#D8F3DC",
                color: copied[s.name] ? "#fff" : "#2D6A4F",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied[s.name] ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              fontFamily: "inherit",
              fontSize: 12,
              color: "#52B788",
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {generateMessage(s, activeClass?.name || "", parsedDate, messageTemplate, teacherName)}
          </pre>
        </div>
      ))}
      <button onClick={reset} style={{ ...sec, marginTop: 4 }}>
        ← New Upload
      </button>
      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  );
}

// ── History tab ──────────────────────────────────────────────────
interface HistoryTabProps {
  classes: ClassRecord[];
  history: HistoryStore;
}

function HistoryTab({ classes, history }: HistoryTabProps) {
  const [selClass, setSelClass] = useState(classes[0]?.id || "");
  const [selStudent, setSelStudent] = useState<string | null>(null);

  const activeClass = classes.find((c) => c.id === selClass) || classes[0];
  const classHistory = history[selClass] || {};
  const studentEntries: HistoryEntry[] = selStudent
    ? classHistory[selStudent] || []
    : [];

  if (selStudent)
    return (
      <div>
        <button
          onClick={() => setSelStudent(null)}
          style={{
            background: "none",
            border: "none",
            color: "#52B788",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            padding: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← {activeClass?.name}
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#D8F3DC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
              color: "#2D6A4F",
            }}
          >
            {selStudent[0]}
          </div>
          <div>
            <div
              style={{ fontWeight: 800, fontSize: 18, color: "#1B4332" }}
            >
              {selStudent}
            </div>
            <div style={{ fontSize: 12, color: "#74C69D" }}>
              {activeClass?.name} · {studentEntries.length}{" "}
              {studentEntries.length === 1 ? "entry" : "entries"}
            </div>
          </div>
        </div>
        {studentEntries.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#95D5B2",
              marginTop: 40,
              fontSize: 14,
            }}
          >
            No entries yet for {selStudent}
          </div>
        ) : (
          [...studentEntries].reverse().map((entry, i) => (
            <div key={i} style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: "#1B4332",
                    fontSize: 14,
                  }}
                >
                  {entry.date}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#74C69D",
                    fontWeight: 600,
                    background: "#F0FFF4",
                    padding: "3px 8px",
                    borderRadius: 20,
                  }}
                >
                  {entry.homework && entry.homework !== "NA"
                    ? `HW: ${entry.homework}`
                    : "No HW"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {(["SP", "TX"] as const).map((f) => (
                  <div
                    key={f}
                    style={{
                      flex: 1,
                      background: "#F0FFF4",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#52B788",
                        marginBottom: 3,
                      }}
                    >
                      {f}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#1B4332",
                        fontWeight: 500,
                      }}
                    >
                      {entry[f.toLowerCase() as "sp" | "tx"] || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );

  const studentsWithHistory =
    activeClass?.students.filter((s) => (classHistory[s]?.length ?? 0) > 0) ||
    [];
  const studentsNoHistory =
    activeClass?.students.filter(
      (s) => !(classHistory[s]?.length ?? 0)
    ) || [];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Class</label>
        <select
          value={selClass}
          onChange={(e) => {
            setSelClass(e.target.value);
            setSelStudent(null);
          }}
          style={{ ...inp }}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {studentsWithHistory.length === 0 && studentsNoHistory.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#95D5B2",
            marginTop: 60,
            fontSize: 14,
          }}
        >
          No students in this class yet.
          <br />
          Add them in Settings.
        </div>
      )}

      {studentsWithHistory.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#74C69D",
              marginBottom: 10,
              letterSpacing: "0.5px",
            }}
          >
            STUDENTS
          </div>
          {studentsWithHistory.map((name) => (
            <div
              key={name}
              onClick={() => setSelStudent(name)}
              style={{
                ...card,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#D8F3DC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#2D6A4F",
                  }}
                >
                  {name[0]}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#1B4332",
                      fontSize: 15,
                    }}
                  >
                    {name}
                  </div>
                  <div style={{ fontSize: 11, color: "#74C69D" }}>
                    {classHistory[name].length}{" "}
                    {classHistory[name].length === 1 ? "entry" : "entries"} ·
                    Last: {classHistory[name].slice(-1)[0]?.date}
                  </div>
                </div>
              </div>
              <span style={{ color: "#B7E4C7", fontSize: 20 }}>›</span>
            </div>
          ))}
        </>
      )}

      {studentsNoHistory.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#B7E4C7",
              marginBottom: 10,
              marginTop: studentsWithHistory.length > 0 ? 20 : 0,
              letterSpacing: "0.5px",
            }}
          >
            NO ENTRIES YET
          </div>
          {studentsNoHistory.map((name) => (
            <div
              key={name}
              style={{
                ...card,
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: 0.5,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#F0FFF4",
                  border: "1.5px dashed #D8F3DC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#B7E4C7",
                }}
              >
                {name[0]}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#95D5B2",
                  fontSize: 15,
                }}
              >
                {name}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Settings tab ─────────────────────────────────────────────────
interface SettingsTabProps {
  classes: ClassRecord[];
  setClasses: React.Dispatch<React.SetStateAction<ClassRecord[]>>;
  messageTemplate: string;
  setMessageTemplate: React.Dispatch<React.SetStateAction<string>>;
  teacherName: string;
  setTeacherName: React.Dispatch<React.SetStateAction<string>>;
}

function SettingsTab({
  classes,
  setClasses,
  messageTemplate,
  setMessageTemplate,
  teacherName,
  setTeacherName,
}: SettingsTabProps) {
  const [section, setSection] = useState("message");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(messageTemplate);
  const [saved, setSaved] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);

  const saveMsg = () => {
    setMessageTemplate(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addClass = () =>
    setClasses((p) => [
      ...p,
      { id: Date.now() + "", name: "New Class", students: [] },
    ]);
  const updateClass = (id: string, name: string) =>
    setClasses((p) => p.map((c) => (c.id === id ? { ...c, name } : c)));
  const deleteClass = (id: string) => {
    setClasses((p) => p.filter((c) => c.id !== id));
    if (editingClass === id) setEditingClass(null);
  };
  const addStudent = (id: string, name: string) => {
    if (!name.trim()) return;
    setClasses((p) =>
      p.map((c) =>
        c.id === id
          ? { ...c, students: [...c.students, name.trim()] }
          : c
      )
    );
  };
  const removeStudent = (id: string, idx: number) =>
    setClasses((p) =>
      p.map((c) =>
        c.id === id
          ? { ...c, students: c.students.filter((_, i) => i !== idx) }
          : c
      )
    );

  // Live preview sample
  const previewStudent: ParsedStudent = {
    name: "Oliver",
    homework: "Maths",
    sp: "11/11 Unit 8",
    tx: "9/9 Unit 9",
    uncertain: false,
  };
  const previewDate = new Date("2026-05-13T00:00:00");
  const previewClass = classes[0]?.name || "P2 Kindness";

  const sections: [string, string][] = [
    ["message", "Message"],
    ["classes", "Classes"],
    ["profile", "Profile"],
  ];

  return (
    <div>
      {/* Section tabs */}
      <div
        style={{
          display: "flex",
          background: "#D8F3DC",
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
        }}
      >
        {sections.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              transition: "all 0.2s",
              background: section === key ? "#2D6A4F" : "transparent",
              color: section === key ? "#fff" : "#52B788",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "message" && (
        <div>
          <div
            style={{
              background: "#D8F3DC",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>✏️</span>
            <div>
              <div
                style={{ fontWeight: 700, color: "#2D6A4F", fontSize: 14 }}
              >
                Customise your message
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#52B788",
                  marginTop: 2,
                  lineHeight: 1.5,
                }}
              >
                Use{" "}
                <code
                  style={{
                    background: "#F0FFF4",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {"{{studentName}}"}
                </code>
                ,{" "}
                <code
                  style={{
                    background: "#F0FFF4",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {"{{className}}"}
                </code>
                ,{" "}
                <code
                  style={{
                    background: "#F0FFF4",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {"{{date}}"}
                </code>
                ,{" "}
                <code
                  style={{
                    background: "#F0FFF4",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {"{{homework}}"}
                </code>
                ,{" "}
                <code
                  style={{
                    background: "#F0FFF4",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {"{{sp}}"}
                </code>
                ,{" "}
                <code
                  style={{
                    background: "#F0FFF4",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {"{{tx}}"}
                </code>
              </div>
            </div>
          </div>
          {!editing ? (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#74C69D",
                  marginBottom: 10,
                  letterSpacing: "0.5px",
                }}
              >
                TEMPLATE
              </div>
              <div
                style={{ ...card, cursor: "pointer", position: "relative" }}
                onClick={() => {
                  setDraft(messageTemplate);
                  setEditing(true);
                }}
              >
                <pre
                  style={{
                    fontFamily: "inherit",
                    fontSize: 13,
                    color: "#1B4332",
                    lineHeight: 1.8,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {messageTemplate}
                </pre>
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "#D8F3DC",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#2D6A4F",
                  }}
                >
                  Tap to edit
                </div>
              </div>
              {saved && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#52B788",
                    fontWeight: 700,
                    fontSize: 14,
                    marginTop: 14,
                  }}
                >
                  ✓ Saved!
                </div>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#74C69D",
                  marginBottom: 10,
                  letterSpacing: "0.5px",
                }}
              >
                EDITING
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={14}
                autoFocus
                style={{
                  width: "100%",
                  border: "1.5px solid #52B788",
                  borderRadius: 12,
                  padding: "14px",
                  fontSize: 13,
                  color: "#1B4332",
                  lineHeight: 1.8,
                  outline: "none",
                  fontFamily: "inherit",
                  background: "#fff",
                  resize: "vertical",
                  boxShadow: "0 0 0 3px rgba(82,183,136,0.15)",
                }}
              />
              {/* Live preview */}
              <div
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#74C69D",
                  marginBottom: 8,
                  letterSpacing: "0.5px",
                }}
              >
                LIVE PREVIEW
              </div>
              <div
                style={{
                  ...card,
                  background: "#F6FBF8",
                  border: "1.5px dashed #B7E4C7",
                }}
              >
                <pre
                  style={{
                    fontFamily: "inherit",
                    fontSize: 12,
                    color: "#52B788",
                    lineHeight: 1.8,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {generateMessage(
                    previewStudent,
                    previewClass,
                    previewDate,
                    draft,
                    teacherName
                  )}
                </pre>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  onClick={() => setDraft(DEFAULT_TEMPLATE)}
                  style={{ ...sec, flex: 1, textAlign: "center" }}
                >
                  Reset
                </button>
                <button onClick={() => setEditing(false)} style={{ ...sec }}>
                  Cancel
                </button>
                <button onClick={saveMsg} style={{ ...pri, flex: 1 }}>
                  Save
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {section === "classes" && (
        <div>
          {classes.map((cls) => (
            <div key={cls.id} style={{ marginBottom: 16 }}>
              <div style={{ ...card, padding: "0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setEditingClass(editingClass === cls.id ? null : cls.id)
                  }
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#1B4332",
                        fontSize: 15,
                      }}
                    >
                      {cls.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#74C69D", marginTop: 2 }}>
                      {cls.students.length} student
                      {cls.students.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <span
                    style={{
                      color: "#95D5B2",
                      fontSize: 18,
                      display: "inline-block",
                      transform:
                        editingClass === cls.id ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    ▾
                  </span>
                </div>

                {editingClass === cls.id && (
                  <div
                    style={{
                      borderTop: "1.5px solid #D8F3DC",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ ...lbl, marginBottom: 6 }}>
                        Class name
                      </label>
                      <input
                        value={cls.name}
                        onChange={(e) => updateClass(cls.id, e.target.value)}
                        style={{ ...inp }}
                      />
                    </div>
                    <label style={{ ...lbl, marginBottom: 8 }}>Students</label>
                    {cls.students.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#D8F3DC",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#2D6A4F",
                            flexShrink: 0,
                          }}
                        >
                          {s[0] || "?"}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            fontSize: 14,
                            color: "#1B4332",
                            fontWeight: 500,
                          }}
                        >
                          {s}
                        </div>
                        <button
                          onClick={() => removeStudent(cls.id, i)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#FFB703",
                            fontSize: 16,
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <AddStudentInline onAdd={(name) => addStudent(cls.id, name)} />
                    <button
                      onClick={() => deleteClass(cls.id)}
                      style={{
                        marginTop: 16,
                        background: "none",
                        border: "1.5px solid #FFB703",
                        color: "#FFB703",
                        borderRadius: 10,
                        padding: "10px",
                        width: "100%",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Delete Class
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addClass}
            style={{ ...sec, width: "100%", textAlign: "center" }}
          >
            + Add Class
          </button>
        </div>
      )}

      {section === "profile" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Your name</label>
            <input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Teacher Yie Teng"
              style={{ ...inp }}
            />
            <div style={{ fontSize: 12, color: "#95D5B2", marginTop: 6 }}>
              This appears in your message sign-off.
            </div>
          </div>
          <div
            style={{ background: "#FFF3CD", borderRadius: 12, padding: "14px 16px" }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#B07D00",
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              ⚠ Reset everything
            </div>
            <div style={{ fontSize: 12, color: "#B07D00", marginBottom: 12 }}>
              This will clear all history, classes, and settings.
            </div>
            <button
              onClick={() => {
                if (window.confirm("Reset all data? This cannot be undone.")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              style={{
                background: "#FFB703",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Reset App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddStudentInline({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add student name…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            onAdd(val);
            setVal("");
          }
        }}
        style={{ ...inp, flex: 1 }}
      />
      <button
        onClick={() => {
          if (val.trim()) {
            onAdd(val);
            setVal("");
          }
        }}
        style={{
          background: "#2D6A4F",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 14px",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Add
      </button>
    </div>
  );
}

// ── Bottom Nav ───────────────────────────────────────────────────
function BottomNav({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "upload", label: "Upload", icon: "📤" },
    { id: "history", label: "History", icon: "📋" },
    { id: "settings", label: "Settings", icon: "⚙️" },
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
              fontSize: 22,
              filter:
                active === t.id ? "none" : "grayscale(1) opacity(0.5)",
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
            }}
          >
            {t.label}
          </span>
          {active === t.id && (
            <div
              style={{
                width: 20,
                height: 3,
                background: "#52B788",
                borderRadius: 2,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Splash screen ────────────────────────────────────────────────
function Splash() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1B4332",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.12);opacity:0.85} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dots { 0%{content:"."} 33%{content:".."} 66%{content:"..."} 100%{content:"."} }
        .leaf { animation: pulse 2s ease-in-out infinite; display:inline-block; }
        .line1 { animation: fadeUp 0.5s ease 0.2s both; }
        .line2 { animation: fadeUp 0.5s ease 0.45s both; }
        .loading { animation: fadeUp 0.5s ease 0.7s both; }
        .dot::after { content:"."; animation: dots 1.2s steps(1) 0.9s infinite; }
      `}</style>
      <div className="leaf" style={{ fontSize: 56, marginBottom: 20 }}>
        🌿
      </div>
      <div
        className="line1"
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.5px",
          marginBottom: 6,
        }}
      >
        Homework Success
      </div>
      <div
        className="line2"
        style={{ fontSize: 14, color: "#52B788", marginBottom: 40 }}
      >
        Daily progress · Parent updates
      </div>
      <div
        className="loading"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            border: "2px solid #52B788",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <span
          style={{ fontSize: 13, color: "#52B788", fontWeight: 500 }}
        >
          Loading<span className="dot" />
        </span>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useLocalStorage("hws_onboarded", false);
  const [teacherName, setTeacherName] = useLocalStorage("hws_teacher", "");
  const [classes, setClasses] = useLocalStorage<ClassRecord[]>(
    "hws_classes",
    DEFAULT_CLASSES
  );
  const [messageTemplate, setMessageTemplate] = useLocalStorage(
    "hws_template",
    DEFAULT_TEMPLATE
  );
  const [history, setHistory] = useLocalStorage<HistoryStore>(
    "hws_history",
    {}
  );
  const [tab, setTab] = useState("upload");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const titles: Record<string, string> = {
    upload: "Upload & Generate",
    history: "Progress History",
    settings: "Settings",
  };

  const handleOnboardDone = (name: string, cls: ClassRecord[]) => {
    setTeacherName(name);
    setClasses(cls);
    setOnboarded(true);
  };

  const saveHistory = (
    classId: string,
    entry: { date: string; students: ParsedStudent[] }
  ) => {
    setHistory((prev) => {
      const classHist = prev[classId] || {};
      const updated = { ...classHist };
      entry.students.forEach((s) => {
        const studentHist = updated[s.name] || [];
        updated[s.name] = [
          ...studentHist,
          { date: entry.date, homework: s.homework, sp: s.sp, tx: s.tx },
        ];
      });
      return { ...prev, [classId]: updated };
    });
  };

  if (loading)
    return (
      <>
        <style>{`* { box-sizing:border-box; } @keyframes spin { to { transform:rotate(360deg); } }`}</style>
        <Splash />
      </>
    );

  if (!onboarded)
    return (
      <>
        <style>{`* { box-sizing:border-box; } @keyframes spin { to { transform:rotate(360deg); } } input:focus,select:focus,textarea:focus { border-color:#52B788!important; box-shadow:0 0 0 3px rgba(82,183,136,0.15); }`}</style>
        <Onboarding onDone={handleOnboardDone} />
      </>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F0FFF4",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <style>{`* { box-sizing:border-box; } @keyframes spin { to { transform:rotate(360deg); } } input:focus,select:focus,textarea:focus { border-color:#52B788!important; box-shadow:0 0 0 3px rgba(82,183,136,0.15); } button:active { opacity:0.85; }`}</style>
      <div
        style={{
          background: "#fff",
          borderBottom: "1.5px solid #D8F3DC",
          padding: "16px 20px 12px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>🌿</span>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: "#1B4332",
                letterSpacing: "-0.3px",
              }}
            >
              Homework Success
            </div>
            <div style={{ fontSize: 11, color: "#74C69D" }}>{titles[tab]}</div>
          </div>
        </div>
      </div>
      <div
        style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 100px" }}
      >
        {tab === "upload" && (
          <UploadTab
            classes={classes}
            messageTemplate={messageTemplate}
            teacherName={teacherName}
            onSaveHistory={saveHistory}
          />
        )}
        {tab === "history" && (
          <HistoryTab classes={classes} history={history} />
        )}
        {tab === "settings" && (
          <SettingsTab
            classes={classes}
            setClasses={setClasses}
            messageTemplate={messageTemplate}
            setMessageTemplate={setMessageTemplate}
            teacherName={teacherName}
            setTeacherName={setTeacherName}
          />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
