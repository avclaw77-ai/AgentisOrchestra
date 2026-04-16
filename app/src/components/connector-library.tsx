"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Globe, Database, FolderOpen, Plus, Plug, X, Loader2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONNECTOR_TEMPLATES, type ConnectorTemplate } from "@/lib/templates"

interface ConnectorLibraryProps {
  departments: { id: string; name: string; color: string }[]
  onConnectorCreated?: () => void
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Globe: <Globe size={20} />,
  Database: <Database size={20} />,
  FolderOpen: <FolderOpen size={20} />,
}

export function ConnectorLibrary({ departments, onConnectorCreated }: ConnectorLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ConnectorTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [agentName, setAgentName] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [creating, setCreating] = useState(false)

  function openTemplate(template: ConnectorTemplate) {
    setSelectedTemplate(template)
    setAgentName(template.name)
    setFormData({})
    setDepartmentId(departments[0]?.id || "")
  }

  function closeDialog() {
    setSelectedTemplate(null)
    setFormData({})
    setAgentName("")
  }

  async function handleCreate() {
    if (!selectedTemplate || !departmentId) return

    // Validate required fields
    const missing = selectedTemplate.connectionFields
      .filter((f) => f.required && !formData[f.key]?.trim())
      .map((f) => f.label)

    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(", ")}`)
      return
    }

    setCreating(true)
    try {
      const agentId = `connector-${selectedTemplate.id}-${Date.now()}`

      // Create the agent
      const agentRes = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agentId,
          departmentId,
          name: agentName || selectedTemplate.name,
          role: selectedTemplate.role,
          persona: selectedTemplate.persona,
          model: selectedTemplate.model,
        }),
      })

      if (!agentRes.ok) throw new Error("Failed to create agent")

      // Mark as system agent
      await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSystemAgent: true }),
      })

      // Save connection config (encrypted via config endpoint)
      await fetch(`/api/agents/${agentId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: selectedTemplate.persona,
          connectionConfig: JSON.stringify(formData),
        }),
      })

      toast.success(`Connector "${agentName}" created`)
      closeDialog()
      onConnectorCreated?.()
    } catch (err) {
      toast.error("Failed to create connector")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">System Connectors</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect Orchestra to your existing tools and systems
          </p>
        </div>
        <Plug size={16} className="text-muted-foreground" />
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONNECTOR_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => openTemplate(template)}
            className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {ICON_MAP[template.icon] || <Plug size={18} />}
              </div>
              <span className="text-sm font-medium">{template.name}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {template.description}
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <Plus size={12} className="text-primary" />
              <span className="text-[11px] text-primary font-medium">Add Connector</span>
            </div>
          </button>
        ))}
      </div>

      {/* Configuration dialog */}
      {selectedTemplate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDialog} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {ICON_MAP[selectedTemplate.icon] || <Plug size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{selectedTemplate.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.role}</p>
                  </div>
                </div>
                <button onClick={closeDialog} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-4 space-y-4">
                {/* Agent name */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Connector Name</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder={selectedTemplate.name}
                    className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none appearance-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Connection fields */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Lock size={12} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Connection Details</span>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto">Encrypted at rest</span>
                  </div>

                  <div className="space-y-3">
                    {selectedTemplate.connectionFields.map((field) => (
                      <div key={field.key}>
                        <label className="text-xs font-medium text-muted-foreground">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input
                          type={field.type === "password" ? "password" : "text"}
                          value={formData[field.key] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={field.type === "url" ? "https://..." : ""}
                          className="mt-1 w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 text-sm rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    creating && "opacity-60"
                  )}
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {creating ? "Creating..." : "Create Connector"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
