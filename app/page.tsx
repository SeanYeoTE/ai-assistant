"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  X,
  Plus,
  Camera,
  ImageIcon,
  Copy,
  Pencil,
  RotateCcw,
  Save,
} from "lucide-react";
import { Toast } from "../components/Toast";
import { BottomNav } from "../components/BottomNav";
import { StudentCard } from "../components/StudentCard";
import type { ParsedStudent as ParsedStudentType } from "../components/StudentCard";

// ── Types ────────────────────────────────────────────────────────
interface ClassRecord {
  id: string;
  name: string;
  students: string[];
}

type ParsedStudent = ParsedStudentType;

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
      if (typeof window === "undefined") return initial;
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
  teacherName: string = ""
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
  fontSize: 16,
  color: "#1B4332",
  outline: "none",
  fontFamily: "inherit",
  background: "#fff",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
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
    classes.some((c) => c.name.trim());

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
              Get Started <ArrowRight size={16} />
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
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addClass}
              style={{ ...sec, width: "100%", textAlign: "center", marginBottom: 20 }}
            >
              <Plus size={16} /> Add another class
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ ...sec }}>
                <ArrowLeft size={16} /> Back
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
                Next <ArrowRight size={16} />
              </button>
            </div>
            <button
              onClick={() => onDone(teacherName.trim(), [])}
              style={{ background: "none", border: "none", color: "#95D5B2", fontSize: 13, cursor: "pointer", width: "100%", marginTop: 12, padding: "4px" }}
            >
              Skip — I&apos;ll set up classes later
            </button>
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
                          <X size={16} />
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
                    <Plus size={16} /> Add student
                  </button>
                </div>
              ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep(1)} style={sec}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={finish}
                disabled={!canFinish}
                style={{ ...pri, flex: 1, opacity: canFinish ? 1 : 0.4 }}
              >
                Finish Setup <ArrowRight size={16} />
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
                {done ? <Check size={16} /> : idx}
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


// ── Upload tab ───────────────────────────────────────────────────
interface UploadTabProps {
  classes: ClassRecord[];
  setClasses: React.Dispatch<React.SetStateAction<ClassRecord[]>>;
  messageTemplate: string;
  teacherName: string;
  onSaveHistory: (
    classId: string,
    entry: { date: string; students: ParsedStudent[] }
  ) => void;
}

function UploadTab({ classes, setClasses, messageTemplate, teacherName, onSaveHistory }: UploadTabProps) {
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
  const [isMobile] = useState(() =>
    typeof window !== "undefined"
      ? "ontouchstart" in window || window.matchMedia("(pointer: coarse)").matches
      : false
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [originalStudents, setOriginalStudents] = useState<ParsedStudent[]>([]);

  // ── Create-class step (step 1.5) — only shown when classes.length === 0 at parse time ──
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newStudentNames, setNewStudentNames] = useState<string[]>([]);

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
    if (!imageData) return;
    // When no classes exist OR the active class has no students, let Claude read names from the image
    const noClasses = classes.length === 0;
    const emptyClass = !noClasses && (activeClass?.students.length ?? 0) === 0;
    const studentNames = (noClasses || emptyClass) ? [] : (activeClass?.students ?? []);
    const className = noClasses ? "" : (activeClass?.name ?? "");
    setLoading(true);
    setParseError(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageData,
          studentNames,
          className,
        }),
      });
      const data = (await res.json()) as
        | { students: ParsedStudent[] }
        | { error: string };
      if (!res.ok || "error" in data) {
        setParseError("error" in data ? data.error : "Server error");
      } else {
        setStudents(data.students);
        setOriginalStudents(data.students);
        if (noClasses) {
          // Step 1.5: show Create Class panel with detected names pre-filled
          setNewClassName("");
          setNewStudentNames(data.students.map((s) => s.name));
          setShowCreateClass(true);
        } else {
          setStep(2);
        }
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
      .catch(() => {
        showToast("Copy failed — please copy manually");
      });
  };

  const copyAll = () => {
    const all = students
      .map((s) =>
        generateMessage(s, activeClass?.name || "", parsedDate, messageTemplate, teacherName)
      )
      .join("\n\n---\n\n");
    navigator.clipboard
      .writeText(all)
      .then(() => showToast(`Copied all ${students.length} messages`))
      .catch(() => {
        showToast("Copy failed — please copy manually");
      });
  };

  const reset = () => {
    setStep(1);
    setPreview(null);
    setImageData(null);
    setStudents([]);
    setParseError(null);
    setShowCreateClass(false);
    setNewClassName("");
    setNewStudentNames([]);
  };

  // ── Create Class panel (step 1.5) ─────────────────────────────────
  const handleCreateClass = () => {
    const trimmedName = newClassName.trim();
    const cleanedStudents = newStudentNames.map((s) => s.trim()).filter(Boolean);
    if (!trimmedName) return;
    const newId = Date.now() + "";
    const newClass: ClassRecord = {
      id: newId,
      name: trimmedName,
      students: cleanedStudents,
    };
    setClasses((prev) => [...prev, newClass]);
    setSelClass(newId);
    if (cleanedStudents.length === 0) {
      reset();
    } else {
      setShowCreateClass(false);
      setStep(2);
    }
  };

  const canCreateClass = newClassName.trim().length > 0;

  if (showCreateClass)
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
            Create Your First Class
          </div>
          <div style={{ fontSize: 14, color: "#74C69D" }}>
            We detected these students from your sheet. Edit names or add more
            before creating the class.
          </div>
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <label style={lbl}>Class name</label>
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="e.g. P2 Kindness"
            style={{ ...inp }}
            autoFocus
          />
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <label style={{ ...lbl, marginBottom: 10 }}>
            Students detected ({newStudentNames.filter((s) => s.trim()).length})
          </label>
          {newStudentNames.length === 0 && (
            <div style={{ fontSize: 12, color: "#B07D00", background: "#FFF3CD", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              No students could be read from this image. Add them manually below, or go back and try a clearer photo.
            </div>
          )}
          {newStudentNames.map((name, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, marginBottom: 8 }}
            >
              <input
                value={name}
                onChange={(e) => {
                  const updated = [...newStudentNames];
                  updated[i] = e.target.value;
                  setNewStudentNames(updated);
                }}
                placeholder={`Student ${i + 1}`}
                style={{ ...inp, flex: 1 }}
              />
              <button
                onClick={() =>
                  setNewStudentNames((prev) => prev.filter((_, idx) => idx !== i))
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "#95D5B2",
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "0 4px",
                  fontFamily: "inherit",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setNewStudentNames((prev) => [...prev, ""])}
            style={{
              background: "none",
              border: "none",
              color: "#52B788",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              padding: "4px 0",
              fontFamily: "inherit",
            }}
          >
            <Plus size={16} /> Add student
          </button>
        </div>

        <button
          onClick={handleCreateClass}
          disabled={!canCreateClass}
          style={{
            ...pri,
            opacity: canCreateClass ? 1 : 0.4,
            cursor: canCreateClass ? "pointer" : "not-allowed",
            marginBottom: 10,
          }}
        >
          Create Class &amp; Continue <ArrowRight size={16} />
        </button>
        <button
          onClick={() => setShowCreateClass(false)}
          style={{ ...sec, width: "100%", textAlign: "center" }}
        >
          <ArrowLeft size={16} /> Back to Upload
        </button>
        <Toast message={toastMsg} visible={toastVisible} />
      </div>
    );

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

        {classes.length > 0 && (
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
        )}

        {classes.length === 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inp }}
            />
          </div>
        )}

        {/* Primary CTA: camera — larger on mobile */}
        <button
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.removeAttribute("capture");
              fileRef.current.setAttribute("capture", "environment");
              fileRef.current.click();
            }
          }}
          style={{
            ...pri,
            marginBottom: 10,
            fontSize: isMobile ? 20 : 16,
            padding: isMobile ? "18px 0" : undefined,
          }}
        >
          <Camera size={20} /> Take Photo
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

        {/* Drop zone / preview — hidden on mobile (touch devices use camera/library buttons above) */}
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
            display: isMobile && !preview ? "none" : "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            marginBottom: 16,
            position: "relative",
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
                <Check size={16} /> Image loaded
              </span>
            </>
          ) : (
            <div
              style={{ padding: 20, textAlign: "center", color: "#95D5B2" }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}><ImageIcon size={20} /></div>
              <div style={{ fontSize: 13 }}>
                Or drag and drop your image here
              </div>
            </div>
          )}
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(45,106,79,0.15)",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: "3px solid rgba(255,255,255,0.4)",
                  borderTop: "3px solid #fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                Reading handwriting…
              </span>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  style={{
                    width: 80,
                    height: 4,
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 2,
                    animation: "pulse 1.2s ease-in-out infinite",
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* No-classes hint */}
        {classes.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "12px 16px",
              marginBottom: 12,
              background: "#F0FFF4",
              borderRadius: 10,
              border: "1.5px solid #D8F3DC",
            }}
          >
            <div style={{ fontSize: 13, color: "#52B788", lineHeight: 1.6 }}>
              No classes yet — upload your first sheet and we&apos;ll create one
              from it.
            </div>
          </div>
        )}

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
            <AlertTriangle size={16} /> {parseError}
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
            <>Read &amp; Parse Notes <ArrowRight size={16} /></>
          )}
        </button>
        <Toast message={toastMsg} visible={toastVisible} />
      </div>
    );

  if (step === 2)
    return (
      <div>
        <Steps current={2} />
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#1B4332",
              marginBottom: 4,
              letterSpacing: "-0.3px",
            }}
          >
            Review Entries
          </div>
          <div style={{ fontSize: 14, color: "#74C69D" }}>
            Check and edit before sending
          </div>
        </div>
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
          <span style={{ fontSize: 18, display: "flex", alignItems: "center" }}><ImageIcon size={20} /></span>
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
        {(() => {
          const nameCounts = students.reduce<Record<string, number>>((acc, s) => {
            const key = s.name.trim().toLowerCase();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          return students.map((s, i) => (
            <StudentCard
              key={s.name + i}
              student={s}
              original={originalStudents[i]}
              isDuplicate={nameCounts[s.name.trim().toLowerCase()] > 1}
              onChange={(u) =>
                setStudents((p) => p.map((x, xi) => (xi === i ? u : x)))
              }
              onRevert={() =>
                setStudents((p) =>
                  p.map((x, xi) =>
                    xi === i ? { ...originalStudents[i] } : x
                  )
                )
              }
            />
          ));
        })()}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => setStep(1)} style={sec}>
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={() => {
              if (window.confirm("Re-parsing will replace your edits. Continue?")) {
                void handleParse();
              }
            }}
            style={sec}
          >
            Re-parse
          </button>
          <button onClick={saveAndSend} style={{ ...pri, flex: 1 }}>
            Generate {students.length} Messages <ArrowRight size={16} />
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
        <span style={{ fontSize: 18, display: "flex", alignItems: "center" }}><Check size={18} /></span>
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
              {copied[s.name] ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
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
        <ArrowLeft size={16} /> New Upload
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
          <ArrowLeft size={16} /> {activeClass?.name}
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
  history: HistoryStore;
  setHistory: React.Dispatch<React.SetStateAction<HistoryStore>>;
}

function SettingsTab({
  classes,
  setClasses,
  messageTemplate,
  setMessageTemplate,
  teacherName,
  setTeacherName,
  history,
  setHistory,
}: SettingsTabProps) {
  const [section, setSection] = useState("message");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(messageTemplate);
  const [saved, setSaved] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = { classes, history, template: messageTemplate, teacherName };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homework-success-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as {
          classes?: ClassRecord[];
          history?: HistoryStore;
          template?: string;
          teacherName?: string;
        };
        const numClasses = data.classes?.length ?? 0;
        const numHistory = Object.keys(data.history ?? {}).length;
        if (
          window.confirm(
            `Import ${numClasses} class${numClasses !== 1 ? "es" : ""} and ${numHistory} history entr${numHistory !== 1 ? "ies" : "y"}? This will replace your current data.`
          )
        ) {
          if (data.classes) setClasses(data.classes);
          if (data.history) setHistory(data.history);
          if (data.template) setMessageTemplate(data.template);
          if (data.teacherName !== undefined) setTeacherName(data.teacherName);
        }
      } catch {
        window.alert("Import failed — the file is not valid JSON. No data was changed.");
      }
      // Reset input so the same file can be re-imported
      if (importRef.current) importRef.current.value = "";
    };
    reader.readAsText(file);
  };

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
            <span style={{ fontSize: 18, display: "flex", alignItems: "center" }}><Pencil size={18} /></span>
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
                ,{" "}
                <code
                  style={{
                    background: "#F0FFF4",
                    padding: "1px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {"{{teacherName}}"}
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
                  <Check size={16} /> Saved!
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
                  fontSize: 16,
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
                  <RotateCcw size={16} /> Reset
                </button>
                <button onClick={() => setEditing(false)} style={{ ...sec }}>
                  Cancel
                </button>
                <button onClick={saveMsg} style={{ ...pri, flex: 1 }}>
                  <Save size={16} /> Save
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
                          <X size={16} />
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
            <Plus size={16} /> Add Class
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
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#74C69D",
                marginBottom: 10,
                letterSpacing: "0.5px",
              }}
            >
              DATA BACKUP
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleExport} style={{ ...sec, flex: 1, textAlign: "center" }}>
                Export Data
              </button>
              <button
                onClick={() => importRef.current?.click()}
                style={{ ...sec, flex: 1, textAlign: "center" }}
              >
                Import Data
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
            </div>
            <div style={{ fontSize: 12, color: "#95D5B2", marginTop: 6 }}>
              Export saves classes, history, template, and your name. Import replaces all data.
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
              <AlertTriangle size={16} /> Reset everything
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
  const [loading] = useState(false);
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
            setClasses={setClasses}
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
            history={history}
            setHistory={setHistory}
          />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
