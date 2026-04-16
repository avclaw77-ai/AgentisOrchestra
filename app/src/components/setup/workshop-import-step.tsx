"use client"

import { useState, useRef } from "react"
import {
  Upload,
  FileJson,
  Check,
  AlertCircle,
  ArrowRight,
  Search,
  Boxes,
  Rocket,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  WORKSHOP_TEMPLATES,
  validateWorkshopBundle,
  workshopToSetupPayload,
  SAMPLE_WORKSHOP_BUNDLE,
  type WorkshopBundle,
} from "@/lib/workshop-import"

interface WorkshopImportStepProps {
  onImport: (payload: ReturnType<typeof workshopToSetupPayload>) => void
  onSkip: () => void
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  extract: <Search size={18} />,
  architect: <Boxes size={18} />,
  "build-ship": <Rocket size={18} />,
}

const PHASE_COLORS: Record<string, string> = {
  extract: "#f59e0b",
  architect: "#3b82f6",
  "build-ship": "#10b981",
}

export function WorkshopImportStep({ onImport, onSkip }: WorkshopImportStepProps) {
  const [bundle, setBundle] = useState<WorkshopBundle | null>(null)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<ReturnType<typeof workshopToSetupPayload> | null>(null)
  const [showSample, setShowSample] = useState(false)
  const [showPhases, setShowPhases] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setBundle(null)
    setPreview(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const result = validateWorkshopBundle(data)

        if (!result.valid || !result.bundle) {
          setError(result.error || "Invalid workshop file")
          return
        }

        setBundle(result.bundle)
        const payload = workshopToSetupPayload(result.bundle)
        setPreview(payload)
      } catch {
        setError("Invalid JSON file. Please check the format.")
      }
    }
    reader.readAsText(file)
  }

  function handlePasteJson() {
    const input = prompt("Paste your workshop JSON here:")
    if (!input) return

    setError("")
    try {
      const data = JSON.parse(input)
      const result = validateWorkshopBundle(data)

      if (!result.valid || !result.bundle) {
        setError(result.error || "Invalid format")
        return
      }

      setBundle(result.bundle)
      setPreview(workshopToSetupPayload(result.bundle))
    } catch {
      setError("Invalid JSON. Please check the format.")
    }
  }

  function handleLoadSample() {
    setBundle(SAMPLE_WORKSHOP_BUNDLE)
    setPreview(workshopToSetupPayload(SAMPLE_WORKSHOP_BUNDLE))
    setError("")
  }

  function handleImport() {
    if (preview) {
      onImport(preview)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={16} className="text-primary" />
          <p className="text-xs font-semibold text-primary tracking-wide">
            AGENTISLAB WORKSHOP
          </p>
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-1.5">
          Import from a workshop
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          If you've completed an AgentisLab workshop, drop the output file here.
          It pre-fills your entire setup: departments, agents, goals, routines, and governance rules.
        </p>
      </div>

      {/* Workshop phases explanation */}
      <button
        onClick={() => setShowPhases(!showPhases)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        {showPhases ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        What are AgentisLab workshop phases?
      </button>

      {showPhases && (
        <div className="space-y-3 mb-5">
          {Object.entries(WORKSHOP_TEMPLATES).map(([key, tpl]) => (
            <div
              key={key}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-hover"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: PHASE_COLORS[key] }}
              >
                {PHASE_ICONS[key]}
              </div>
              <div>
                <p className="text-sm font-medium">{tpl.title}</p>
                <p className="text-xs text-muted-foreground">{tpl.subtitle}</p>
                <p className="text-xs text-muted-foreground mt-1">{tpl.produces}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Don't have a workshop output? No problem -- skip this step and use templates or AI analysis instead.
          </p>
        </div>
      )}

      {/* Upload area */}
      {!bundle && (
        <div className="space-y-3">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <Upload size={24} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop workshop JSON file here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePasteJson}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              <FileJson size={16} />
              Paste JSON
            </button>
            <button
              onClick={handleLoadSample}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              <Sparkles size={16} />
              Load sample
            </button>
          </div>

          {/* View sample toggle */}
          <button
            onClick={() => setShowSample(!showSample)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSample ? "Hide" : "View"} sample workshop output format
          </button>

          {showSample && (
            <pre className="text-[10px] font-mono bg-[#1e293b] text-[#e2e8f0] rounded-xl p-4 overflow-x-auto max-h-60">
              {JSON.stringify(SAMPLE_WORKSHOP_BUNDLE, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-50 text-red-800 rounded-lg text-xs mt-3">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview */}
      {preview && bundle && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <Check size={16} />
            Workshop imported successfully
          </div>

          {/* Phases detected */}
          <div className="flex gap-2">
            {bundle.phases.map((phase) => (
              <span
                key={phase.phase}
                className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: PHASE_COLORS[phase.phase] }}
              >
                {WORKSHOP_TEMPLATES[phase.phase]?.title || phase.phase}
              </span>
            ))}
          </div>

          {/* Preview card */}
          <div className="bg-inset rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">{preview.company.name}</p>
            {preview.company.mission && (
              <p className="text-xs text-muted-foreground">{preview.company.mission}</p>
            )}

            <div className="space-y-2">
              {preview.departments.map((dept) => (
                <div key={dept.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className="text-sm font-medium">{dept.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {dept.agents.length} agent{dept.agents.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>

            {preview.goals.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {preview.goals.length} goal{preview.goals.length !== 1 ? "s" : ""}
              </p>
            )}
            {preview.routines.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {preview.routines.length} routine{preview.routines.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Use This Configuration
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => { setBundle(null); setPreview(null); setError("") }}
              className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Skip option */}
      <div className="mt-6 pt-4 border-t border-border">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip -- I'll set up manually or use AI analysis
        </button>
      </div>
    </div>
  )
}
