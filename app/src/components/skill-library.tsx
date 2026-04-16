"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Plus,
  Puzzle,
  ExternalLink,
  Github,
  Globe,
  Package,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import type { CompanySkill } from "@/types"

// =============================================================================
// Types
// =============================================================================

interface SkillLibraryProps {
  skills: CompanySkill[]
  onCreateSkill: (data: {
    key: string
    name: string
    description: string
    sourceType: string
    sourceRef: string
    definition: Record<string, unknown>
  }) => void
  onUpdateSkill: (
    id: number,
    data: {
      name?: string
      description?: string
      isActive?: boolean
      definition?: Record<string, unknown>
    }
  ) => void
}

// =============================================================================
// Helpers
// =============================================================================

const SOURCE_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string }
> = {
  local: { icon: <Package size={12} />, label: "Local" },
  github: { icon: <Github size={12} />, label: "GitHub" },
  url: { icon: <Globe size={12} />, label: "URL" },
  bundled: { icon: <Puzzle size={12} />, label: "Bundled" },
}

// =============================================================================
// SkillCard
// =============================================================================

function SkillCard({
  skill,
  onUpdate,
}: {
  skill: CompanySkill
  onUpdate: (
    id: number,
    data: {
      name?: string
      description?: string
      isActive?: boolean
      definition?: Record<string, unknown>
    }
  ) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const source = SOURCE_CONFIG[skill.sourceType] || SOURCE_CONFIG.local

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 transition-colors",
        !skill.isActive && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium">{skill.name}</h3>
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              v{skill.version}
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
              {source.icon}
              {source.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {skill.description || "No description"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {skill.key}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Active toggle */}
          <button
            onClick={() => onUpdate(skill.id, { isActive: !skill.isActive })}
            className={cn(
              "relative w-9 h-5 rounded-full transition-colors",
              skill.isActive ? "bg-primary" : "bg-gray-300"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                skill.isActive ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {skill.description && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <p className="text-sm mt-0.5">{skill.description}</p>
            </div>
          )}

          {skill.sourceRef && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Source
              </label>
              <a
                href={skill.sourceRef}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline mt-0.5"
              >
                {skill.sourceRef}
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Definition
            </label>
            <pre className="mt-1 p-3 bg-inset rounded-lg text-xs overflow-auto max-h-48 font-mono">
              {JSON.stringify(skill.definition, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CreateSkillForm
// =============================================================================

function CreateSkillForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    key: string
    name: string
    description: string
    sourceType: string
    sourceRef: string
    definition: Record<string, unknown>
  }) => void
  onCancel: () => void
}) {
  const [key, setKey] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sourceType, setSourceType] = useState("local")
  const [sourceRef, setSourceRef] = useState("")

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">New Skill</h3>
        <button
          onClick={onCancel}
          className="p-1 rounded hover:bg-secondary text-muted-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Key
          </label>
          <input
            type="text"
            placeholder="my-skill"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Name
          </label>
          <input
            type="text"
            placeholder="My Skill"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          placeholder="What does this skill do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none resize-none"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Source Type
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="local">Local</option>
            <option value="github">GitHub</option>
            <option value="url">URL</option>
            <option value="bundled">Bundled</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Source Reference
          </label>
          <input
            type="text"
            placeholder="https://..."
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
            className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (key.trim() && name.trim()) {
              onSubmit({
                key: key.trim(),
                name: name.trim(),
                description: description.trim(),
                sourceType,
                sourceRef: sourceRef.trim(),
                definition: {},
              })
            }
          }}
          disabled={!key.trim() || !name.trim()}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Create Skill
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Main component
// =============================================================================

export function SkillLibrary({
  skills,
  onCreateSkill,
  onUpdateSkill,
}: SkillLibraryProps) {
  const [showCreate, setShowCreate] = useState(false)

  if (skills.length === 0 && !showCreate) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Puzzle size={24} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No company skills yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add versioned skills that agents can use across the organization.
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Add Skill
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Skill Library</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Add Skill
        </button>
      </div>

      {showCreate && (
        <div className="mb-4">
          <CreateSkillForm
            onSubmit={(data) => {
              onCreateSkill(data)
              setShowCreate(false)
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} onUpdate={onUpdateSkill} />
        ))}
      </div>
    </div>
  )
}
