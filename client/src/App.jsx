import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState("Summarize in bullet points.");
  const [summary, setSummary] = useState("");
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("Meeting Summary");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fileName, setFileName] = useState("");

  // File Upload (Dropzone)
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      
      const data = await resp.json();
      if (data.success) {
        setTranscript(data.transcript || "");
        toast.success("File uploaded successfully");
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      toast.error(err.message);
      setFileName("");
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    }
  });

  // Generate AI Summary
  const generateSummary = async () => {
    setLoading(true);
    const trimmedTranscript = transcript.trim();
    
    if (!trimmedTranscript) {
      toast.error("Please paste a transcript first!");
      setLoading(false);
      return;
    }

    try {
      const payload = { text: trimmedTranscript, prompt };
      const resp = await fetch(`${API_BASE}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Summarization failed');
      }

      const data = await resp.json();
      setSummary(data.summary || "No summary generated.");
      toast.success("Summary generated!");
    } catch (err) {
      toast.error(err.message.includes("Invalid API key") 
        ? "Invalid API key - check server configuration" 
        : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Send Email
  const sendEmail = async () => {
    try {
      const resp = await fetch(`${API_BASE}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emails, subject, summary }),
      });
      
      const data = await resp.json();
      toast.success(`Email sent to ${emails}`);
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to send email");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      <header className="text-center py-6">
        <h1 className="text-3xl font-bold text-slate-800">AI Meeting Summarizer</h1>
        <p className="text-slate-600 mt-2">Upload recordings → Get summaries → Share via email</p>
      </header>

      {/* File Upload */}
      <section className="space-y-4">
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer bg-white hover:bg-slate-50 transition-colors"
        >
          <input {...getInputProps()} />
          {fileName ? (
            <p className="text-slate-800 font-medium">📄 {fileName}</p>
          ) : (
            <div>
              <p className="text-slate-600">📂 Drag & drop meeting files</p>
              <p className="text-sm text-slate-400 mt-1">Supports PDF, DOCX, TXT</p>
            </div>
          )}
        </div>

        {/* Transcript Input */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-slate-700 mb-2 font-medium">Transcript</label>
          <textarea
            className="w-full h-40 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Or paste transcript manually..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>

        {/* Prompt Input */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-slate-700 mb-2 font-medium">AI Instructions</label>
          <textarea
            className="w-full h-20 border border-slate-200 rounded-lg p-3"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <button
          onClick={generateSummary}
          disabled={loading || !transcript.trim()}
          className={`px-6 py-3 rounded-lg w-full font-medium ${loading || !transcript.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-800'} text-white transition-colors`}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Processing...
            </span>
          ) : (
            "✨ Generate Summary"
          )}
        </button>
      </section>

      {/* Summary Output */}
      {summary && (
        <section className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-700 font-medium">Summary</label>
            <button 
              onClick={() => navigator.clipboard.writeText(summary)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy
            </button>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 whitespace-pre-wrap bg-slate-50">
            {summary}
          </div>
        </section>
      )}

      {/* Email Section */}
      <section className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <h2 className="text-slate-800 font-medium">Email Summary</h2>
        <input
          className="w-full border border-slate-200 rounded-lg p-2.5"
          placeholder="Recipients (comma separated emails)"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />
        <input
          className="w-full border border-slate-200 rounded-lg p-2.5"
          placeholder="Subject line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <button
          onClick={() => summary ? setShowModal(true) : toast.error("Generate summary first")}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white w-full"
        >
          ✉️ Share via Email
        </button>
      </section>

      {/* Email Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Email Preview</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">To:</p>
                <p className="font-medium">{emails}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Subject:</p>
                <p className="font-medium">{subject}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Content:</p>
                <div className="border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto bg-slate-50">
                  {summary}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}