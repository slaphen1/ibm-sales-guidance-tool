"use client";

import { useState, useCallback } from "react";
import type { ParsedFile, RoadmapResponse } from "@/types";

// ─── Step definitions ─────────────────────────────────────────────────────────

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  acceptsFiles: boolean;
  acceptedFormats: string;
  iscPrompt?: boolean; // shows ISC manual pull instruction
  freeText?: boolean;
}

const STEPS: WorkflowStep[] = [
  {
    id: "client_overview",
    label: "Client Overview",
    description: "Upload a document or paste text describing the client's background, business, and current IBM relationship.",
    required: true,
    acceptsFiles: true,
    acceptedFormats: ".docx,.pdf",
    freeText: true,
  },
  {
    id: "ibm_cloud_usage",
    label: "Current IBM Cloud Usage",
    description: "Upload an export of the client's current IBM Cloud spend and consumption data.",
    required: false,
    acceptsFiles: true,
    acceptedFormats: ".xlsx,.csv",
  },
  {
    id: "isc_data",
    label: "ISC Account Data",
    description: "Log into ISC, navigate to this client's account, and export their entitlement and spend data.",
    required: false,
    acceptsFiles: true,
    acceptedFormats: ".xlsx,.csv",
    iscPrompt: true,
    freeText: true,
  },
  {
    id: "bom_example",
    label: "Existing BOM Example",
    description: "Upload an example BOM (Bill of Materials) to use as a template for the output.",
    required: false,
    acceptsFiles: true,
    acceptedFormats: ".xlsx,.docx",
  },
  {
    id: "competitive_info",
    label: "Competitive Install Info",
    description: "Upload or paste known competitor footprint information for this client.",
    required: false,
    acceptsFiles: true,
    acceptedFormats: ".xlsx",
    freeText: true,
  },
  {
    id: "opportunity_notes",
    label: "Opportunity Notes",
    description: "Describe the opportunity in your own words — your instinct on the deal, key goals, and any context not covered above.",
    required: true,
    acceptsFiles: false,
    acceptedFormats: "",
    freeText: true,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface RoadmapWorkflowProps {
  sellerEmail?: string;
  onComplete: (roadmap: RoadmapResponse) => void;
}

export default function RoadmapWorkflow({ sellerEmail = "seller@ibm.com", onComplete }: RoadmapWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [clientName, setClientName] = useState("");
  const [stepTexts, setStepTexts] = useState<Record<string, string>>({});
  const [stepFiles, setStepFiles] = useState<Record<string, File[]>>({});
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingStep, setUploadingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isClientNameStep = currentStep === -1; // virtual first step

  // Upload files for the current step
  const uploadFiles = useCallback(async (stepId: string, files: File[]) => {
    if (files.length === 0) return;
    setUploadingStep(stepId);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? "Upload failed");
      const { files: parsed } = json as { files: ParsedFile[] };
      setParsedFiles((prev) => [...prev, ...parsed]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingStep(null);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setStepFiles((prev) => ({ ...prev, [step.id]: files }));
    await uploadFiles(step.id, files);
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === -1 && !clientName.trim()) {
      setError("Please enter the client name");
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((s) => s - 1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    // Combine all free-text inputs as parsed files
    const textFiles: ParsedFile[] = Object.entries(stepTexts)
      .filter(([, text]) => text.trim())
      .map(([id, text]) => ({
        fileName: `${id}.txt`,
        fileType: "txt",
        content: text.trim(),
      }));

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerEmail,
          clientName,
          opportunityNotes: stepTexts["opportunity_notes"],
          parsedFiles: [...parsedFiles, ...textFiles],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? "Generation failed");
      onComplete(json as RoadmapResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  // ── Client name entry (step -1) ──────────────────────────────────────────
  if (currentStep === -1) {
    return (
      <WorkflowShell step={0} total={STEPS.length + 1} title="Client Roadmap Generator">
        <p className="text-sm text-gray-500 mb-6">
          This workflow will guide you through providing the inputs needed to generate a structured Client Roadmap, powered by IBM Watson Assistant and AskSales.
        </p>
        <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
          Client / Account Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g. Acme Corporation"
          className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue mb-4"
        />
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button onClick={handleNext} className="btn-primary">
          Start →
        </button>
      </WorkflowShell>
    );
  }

  // ── Main steps ───────────────────────────────────────────────────────────
  return (
    <WorkflowShell step={currentStep + 1} total={STEPS.length + 1} title={`${clientName} — Client Roadmap`}>

      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ibm-blue">
          Step {currentStep + 1} of {STEPS.length}
        </span>
        {!step.required && (
          <span className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5">Optional</span>
        )}
      </div>
      <h3 className="text-base font-semibold text-ibm-gray-100 mb-1">{step.label}</h3>
      <p className="text-sm text-gray-500 mb-4">{step.description}</p>

      {/* ISC manual pull prompt */}
      {step.iscPrompt && (
        <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 px-4 py-3 mb-4 text-sm text-amber-900">
          <strong>Action required:</strong> Log into ISC, navigate to <strong>{clientName}</strong>'s account, and export their entitlement/spend data as .xlsx or .csv, then upload it below.
        </div>
      )}

      {/* File upload */}
      {step.acceptsFiles && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
            Upload file ({step.acceptedFormats})
          </label>
          <input
            type="file"
            accept={step.acceptedFormats}
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-ibm-gray-20 file:text-xs file:font-medium file:bg-ibm-gray-10 file:text-ibm-gray-80 hover:file:bg-ibm-gray-20"
          />
          {uploadingStep === step.id && (
            <p className="text-xs text-ibm-blue mt-1 animate-pulse">Parsing file...</p>
          )}
          {(stepFiles[step.id]?.length ?? 0) > 0 && uploadingStep !== step.id && (
            <p className="text-xs text-green-600 mt-1">
              ✓ {stepFiles[step.id].length} file(s) ready
            </p>
          )}
        </div>
      )}

      {/* Free text input */}
      {step.freeText && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-ibm-gray-80 mb-1">
            {step.acceptsFiles ? "Or paste text here" : "Your notes"}
          </label>
          <textarea
            rows={5}
            value={stepTexts[step.id] ?? ""}
            onChange={(e) => setStepTexts((prev) => ({ ...prev, [step.id]: e.target.value }))}
            placeholder={step.id === "opportunity_notes" ? "Describe the deal opportunity, key goals, and any context..." : "Paste content here..."}
            className="w-full border border-ibm-gray-20 px-3 py-2 text-sm focus:outline-none focus:border-ibm-blue resize-none"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-2">
        <button onClick={handleBack} className="btn-secondary">
          ← Back
        </button>
        {isLastStep ? (
          <button onClick={handleGenerate} disabled={loading} className="btn-primary">
            {loading ? "Generating Roadmap..." : "Generate Roadmap →"}
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary">
            Next →
          </button>
        )}
        {!step.required && !isLastStep && (
          <button onClick={handleNext} className="text-sm text-gray-400 hover:text-ibm-gray-80 underline">
            Skip
          </button>
        )}
      </div>
    </WorkflowShell>
  );
}

// ─── Shell wrapper ────────────────────────────────────────────────────────────

function WorkflowShell({
  step,
  total,
  title,
  children,
}: {
  step: number;
  total: number;
  title: string;
  children: React.ReactNode;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="border border-ibm-gray-20 bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ibm-gray-20 bg-ibm-gray-10 flex items-center justify-between">
        <span className="text-sm font-semibold text-ibm-gray-100">{title}</span>
        <span className="text-xs text-gray-400">{step} / {total}</span>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-ibm-gray-20">
        <div className="h-1 bg-ibm-blue transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      {/* Content */}
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}
