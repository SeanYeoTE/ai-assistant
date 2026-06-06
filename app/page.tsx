"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setPdfText(data.text);
  }

  async function askQuestion() {
    setLoading(true);
    setAnswer("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, pdfText }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">AI Knowledge Assistant</h1>

      <div className="mb-6 p-4 border rounded">
        <p className="text-sm text-gray-600 mb-2">
          Upload a PDF to ask questions about it
        </p>
        <input type="file" accept=".pdf" onChange={handleFileUpload} />
        {fileName && (
          <p className="text-sm text-green-600 mt-2">✓ {fileName} loaded</p>
        )}
      </div>

      <textarea
        className="w-full border rounded p-3 mb-4"
        rows={4}
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        onClick={askQuestion}
        disabled={loading || !question}
      >
        {loading ? "Thinking..." : "Ask"}
      </button>

      {answer && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </main>
  );
}
