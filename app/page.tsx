"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API = "/api/popup-state";

function usePopupState() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [content, setContent] = useState("");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (typeof data?.show === "boolean") setPopupOpen(data.show);
      if (typeof data?.content === "string") setContent(data.content);
    } catch {
      // ignore
    }
  }, []);

  const setShow = useCallback(
    async (show: boolean) => {
      setPopupOpen(show);
      try {
        await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ show }),
        });
      } catch {
        setPopupOpen((prev) => !prev);
      }
    },
    []
  );

  const saveContent = useCallback(async (newContent: string) => {
    setContent(newContent);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const t = setInterval(fetchState, 3000);
    return () => clearInterval(t);
  }, [fetchState]);

  return [popupOpen, setShow, content, saveContent] as const;
}

export default function DashboardPage() {
  const [popupOpen, setPopupOpen, content, saveContent] = usePopupState();
  const [editContent, setEditContent] = useState("");
  const [contentDirty, setContentDirty] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!contentDirty) setEditContent(content);
  }, [content, contentDirty]);

  const handleContentChange = (value: string) => {
    setEditContent(value);
    setContentDirty(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(value);
      setContentDirty(false);
      saveTimeoutRef.current = null;
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">Dashboard</h1>
        <div className="dashboard__control">
          <span className="dashboard__label">Show popup</span>
          <button
            type="button"
            role="switch"
            aria-checked={popupOpen}
            aria-label="Toggle popup"
            className={`toggle ${popupOpen ? "toggle--on" : ""}`}
            onClick={() => setPopupOpen(!popupOpen)}
          >
            <span className="toggle__thumb" />
          </button>
        </div>
      </header>

      <section className="dashboard__section">
        <label htmlFor="popup-content" className="dashboard__label-block">
          Popup content
        </label>
        <textarea
          id="popup-content"
          className="dashboard__textarea"
          value={editContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Enter the text or HTML-free content to show in the popup. Line breaks are preserved."
          rows={5}
        />
        {contentDirty && (
          <span className="dashboard__hint">Saving…</span>
        )}
      </section>
    </main>
  );
}
