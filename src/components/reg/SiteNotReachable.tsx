import React, { useEffect, useState } from "react";

export function SiteNotReachable() {
  const [hostname, setHostname] = useState("localhost");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.hostname) {
      setHostname(window.location.hostname);
    }
  }, []);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#ffffff",
        color: "#202124",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: "min(14vh, 120px) min(10vw, 100px)",
        boxSizing: "border-box",
        zIndex: 999999,
        overflowY: "auto",
        userSelect: "text",
      }}
    >
      {/* Chromium Sad Page Icon */}
      <div
        style={{
          cursor: "default",
          marginBottom: "20px",
          display: "inline-block",
        }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5f6368"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: "block" }}
        >
          {/* Document folded corner shape */}
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#f1f3f4" />
          <polyline points="14 2 14 8 20 8" fill="#e8eaed" />
          {/* Sad Face */}
          <line x1="9" y1="13" x2="9.01" y2="13" strokeWidth="2.5" />
          <line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="2.5" />
          <path d="M15 17c-1.5-1-4.5-1-6 0" />
        </svg>
      </div>

      {/* Main Error Heading */}
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 500,
          color: "#202124",
          margin: "0 0 15px 0",
          letterSpacing: "-0.2px",
          lineHeight: 1.3,
        }}
      >
        This site can’t be reached
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "15px",
          color: "#5f6368",
          margin: "0 0 24px 0",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "#202124", fontWeight: 500 }}>{hostname}</strong> refused to connect.
      </p>

      {/* Suggestion list */}
      <div style={{ fontSize: "14px", color: "#5f6368", lineHeight: "22px", marginBottom: "28px" }}>
        <div style={{ marginBottom: "6px" }}>Try:</div>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Checking the connection</li>
          <li>Checking the proxy and the firewall</li>
        </ul>
      </div>

      {/* Standard Error Code */}
      <div
        style={{
          fontSize: "12px",
          color: "#5f6368",
          fontFamily: "monospace",
          marginBottom: "36px",
          letterSpacing: "0.5px",
        }}
      >
        ERR_CONNECTION_REFUSED
      </div>

      {/* Reload Button */}
      <div>
        <button
          onClick={handleReload}
          style={{
            backgroundColor: "#1a73e8",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "8px 24px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 1px 2px rgba(60,64,67,0.3)",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = "#1765cc")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = "#1a73e8")}
        >
          Reload
        </button>
      </div>
    </div>
  );
}
