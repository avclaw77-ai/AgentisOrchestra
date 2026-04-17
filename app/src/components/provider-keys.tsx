"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Key, Check, X, Loader2, Shield, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProviderKeyEntry {
  id: number
  provider: string
  isValid: boolean
  testedAt: string | null
  hasKey: boolean
}

const PROVIDER_INFO: Record<string, { name: string; placeholder: string; description: string; color: string }> = {
  "openrouter": { name: "OpenRouter", placeholder: "sk-or-...", description: "100+ models: GPT, Gemini, Llama, DeepSeek, Qwen", color: "#6366F1" },
  "perplexity": { name: "Perplexity", placeholder: "pplx-...", description: "Web search with citations for research agents", color: "#0EA5E9" },
  "openai": { name: "OpenAI", placeholder: "sk-proj-...", description: "GPT-4o, o3 -- structured output and reasoning", color: "#10B981" },
}

const ALL_PROVIDERS = ["openrouter", "perplexity", "openai"]

export function ProviderKeys() {
  const [keys, setKeys] = useState<ProviderKeyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [addingProvider, setAddingProvider] = useState<string | null>(null)
  const [newKey, setNewKey] = useState("")
  const [saving, setSaving] = useState(false)

  async function fetchKeys() {
    try {
      const res = await fetch("/api/providers")
      if (res.ok) setKeys(await res.json())
    } catch { /* skip */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchKeys() }, [])

  async function handleSave(provider: string) {
    if (!newKey.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: newKey.trim() }),
      })
      if (res.ok) {
        toast.success(`${PROVIDER_INFO[provider]?.name || provider} key saved (encrypted)`)
        setAddingProvider(null)
        setNewKey("")
        fetchKeys()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save key")
      }
    } catch {
      toast.error("Failed to save key")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(provider: string) {
    if (!confirm(`Remove ${PROVIDER_INFO[provider]?.name || provider} API key?`)) return
    try {
      await fetch("/api/providers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      toast.success("Key removed")
      fetchKeys()
    } catch {
      toast.error("Failed to remove key")
    }
  }

  const configuredProviders = keys.map((k) => k.provider)
  const unconfigured = ALL_PROVIDERS.filter((p) => !configuredProviders.includes(p))

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage provider API keys. Encrypted at rest (AES-256-GCM).</p>
        </div>
        <Shield size={16} className="text-muted-foreground" />
      </div>

      {/* Claude CLI -- always shown */}
      <div className="bg-card border border-border rounded-xl p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "#D97706" }}>C</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Claude CLI</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">FREE</span>
            </div>
            <p className="text-xs text-muted-foreground">Pro subscription -- flat monthly, no per-token cost</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check size={14} />
            Active
          </div>
        </div>
      </div>

      {/* Configured providers */}
      {keys.map((entry) => {
        const info = PROVIDER_INFO[entry.provider]
        if (!info) return null
        const isEditing = addingProvider === entry.provider

        return (
          <div key={entry.provider} className="bg-card border border-border rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: info.color }}>
                {info.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{info.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">Configured</span>
                </div>
                <p className="text-xs text-muted-foreground">{info.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAddingProvider(entry.provider); setNewKey("") }}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  Rotate
                </button>
                <button
                  onClick={() => handleDelete(entry.provider)}
                  className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {isEditing && (
              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={info.placeholder}
                  className="flex-1 bg-inset rounded-lg px-3 py-2 text-sm font-mono outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleSave(entry.provider)}
                  disabled={saving || !newKey.trim()}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                </button>
                <button onClick={() => setAddingProvider(null)} className="px-2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Unconfigured providers */}
      {unconfigured.map((provider) => {
        const info = PROVIDER_INFO[provider]
        if (!info) return null
        const isAdding = addingProvider === provider

        return (
          <div key={provider} className={cn("bg-card border border-dashed border-border rounded-xl p-4 mb-3", isAdding && "border-solid border-primary/30")}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 text-sm font-bold bg-muted">
                {info.name[0]}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-muted-foreground">{info.name}</span>
                <p className="text-xs text-muted-foreground">{info.description}</p>
              </div>
              {!isAdding && (
                <button
                  onClick={() => { setAddingProvider(provider); setNewKey("") }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={12} />
                  Add Key
                </button>
              )}
            </div>

            {isAdding && (
              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={info.placeholder}
                  className="flex-1 bg-inset rounded-lg px-3 py-2 text-sm font-mono outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleSave(provider)}
                  disabled={saving || !newKey.trim()}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                </button>
                <button onClick={() => setAddingProvider(null)} className="px-2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )
      })}

      <p className="text-[11px] text-muted-foreground mt-4 text-center">
        Keys are encrypted with AES-256-GCM before storage. Never transmitted in plaintext.
      </p>
    </div>
  )
}
