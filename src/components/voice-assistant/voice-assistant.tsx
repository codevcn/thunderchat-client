"use client"

import React from "react"
import { useAppSelector } from "@/hooks/redux"
import { useVoiceAssistant } from "./hooks/useVoiceAssistant"

export default function VoiceAssistantWeb() {
  const voiceAssistantEnabled = useAppSelector(
    (state) => state.settings.accessibility?.voiceAssistantEnabled ?? false
  )

  if (!voiceAssistantEnabled) {
    return null
  }

  return <VoiceAssistantCore />
}

function VoiceAssistantCore() {
  const { status, isListening, isRecording, settings, startRecordingAndSend, stopRecording } =
    useVoiceAssistant()

  // Loading state
  if (!settings) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          background: "#999",
          color: "white",
          padding: "12px 24px",
          borderRadius: 30,
          fontSize: 15,
          fontWeight: "bold",
          zIndex: 9999,
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        {status}
      </div>
    )
  }

  // Long press mode
  if (settings.voiceActivationMode === "LONG_PRESS") {
    return (
      <button
        onMouseDown={startRecordingAndSend}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecordingAndSend}
        onTouchEnd={stopRecording}
        onTouchCancel={stopRecording}
        disabled={isRecording}
        style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          width: 80,
          height: 80,
          borderRadius: 40,
          background: isRecording ? "#ff4444" : "#0066ff",
          border: "none",
          fontSize: 36,
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all 0.2s",
          transform: isRecording ? "scale(1.1)" : "scale(1)",
          opacity: isRecording ? 0.9 : 1,
        }}
        aria-label="Giữ để nói"
        title="Giữ để nói"
      >
        🎤
      </button>
    )
  }

  // Wake word mode - show status indicator
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        background: isListening ? (isRecording ? "#ff9800" : "#4caf50") : "#f44336",
        color: "white",
        padding: "12px 24px",
        borderRadius: 30,
        fontSize: 15,
        fontWeight: "bold",
        zIndex: 9999,
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        transition: "all 0.3s",
        maxWidth: "400px",
      }}
    >
      {status}
    </div>
  )
}
