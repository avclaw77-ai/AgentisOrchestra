/**
 * Bilingual i18n system for AgentisOrchestra.
 *
 * Supports EN and Quebec FR natively (not translated -- written naturally).
 * Uses cookie-based locale persistence and interpolation with {{var}} syntax.
 */

import { useCallback } from "react"

// =============================================================================
// Types
// =============================================================================

type Locale = "en" | "fr"

// =============================================================================
// Translation dictionaries
// =============================================================================

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Shell / Navigation
    "nav.dashboard": "Dashboard",
    "nav.chat": "Chat",
    "nav.tasks": "Tasks",
    "nav.goals": "Goals",
    "nav.routines": "Routines",
    "nav.models": "Models",
    "nav.costs": "Costs",
    "nav.settings": "Settings",

    // Department selector
    "dept.ceo_view": "CEO View",
    "dept.all_depts": "All departments",

    // Agent roster
    "agents.team": "Agent Team",
    "agents.idle": "Idle",
    "agents.active": "Active",
    "agents.thinking": "Thinking",

    // Tasks
    "tasks.backlog": "Backlog",
    "tasks.in_progress": "In Progress",
    "tasks.review": "Review",
    "tasks.done": "Done",
    "tasks.new": "New Task",
    "tasks.no_tasks": "No tasks",
    "tasks.checkout_locked": "Checked out",

    // Chat
    "chat.placeholder": "Message {{agent}}...",
    "chat.typing": "typing...",
    "chat.start_conversation": "Start a conversation with {{agent}}",

    // Heartbeat
    "heartbeat.when": "When should {{agent}} check in?",
    "heartbeat.chat_only": "Only when I message (chat only)",
    "heartbeat.scheduled": "On a schedule",
    "heartbeat.events": "On events",
    "heartbeat.next_runs": "Next runs",
    "heartbeat.coming_soon": "Coming soon",

    // Costs
    "costs.monthly_overview": "Monthly Overview",
    "costs.spent": "Spent",
    "costs.tasks_completed": "Tasks Completed",
    "costs.runs": "Runs",
    "costs.cli_savings": "CLI Savings",
    "costs.by_department": "By Department",
    "costs.by_model": "By Model",
    "costs.budget_status": "Budget Status",

    // Goals
    "goals.company_mission": "Company Mission",
    "goals.add_goal": "Add Goal",
    "goals.no_goals": "No goals yet",

    // Approvals
    "approvals.pending": "Pending",
    "approvals.all": "All",
    "approvals.approve": "Approve",
    "approvals.reject": "Reject",
    "approvals.revision": "Request Revision",

    // Routines
    "routines.new": "New Routine",
    "routines.trigger_now": "Trigger Now",
    "routines.activate": "Activate",
    "routines.pause": "Pause",

    // Settings
    "settings.general": "General",
    "settings.approvals": "Approvals",
    "settings.skills": "Skills",
    "settings.plugins": "Plugins",
    "settings.export_import": "Export / Import",
    "settings.company_name": "Company Name",
    "settings.language": "Language",

    // Plugins
    "plugins.title": "Plugins",
    "plugins.installed": "{{count}} installed",
    "plugins.no_plugins": "No plugins installed. Drop plugin folders into the plugins/ directory.",
    "plugins.restart": "Restart",
    "plugins.install": "Install Plugin",
    "plugins.install_path": "Plugin directory path",
    "plugins.status_ready": "Ready",
    "plugins.status_error": "Error",
    "plugins.status_stopped": "Stopped",
    "plugins.status_loading": "Loading",
    "plugins.crashes": "{{count}} crashes",

    // Navigation (new)
    "nav.files": "Files",
    "nav.approvals": "Approvals",

    // Search
    "search.placeholder": "Search agents, tasks, pages...",
    "search.no_results": "No results found",
    "search.navigation": "Navigation",
    "search.agents": "Agents",
    "search.tasks": "Tasks",
    "search.goals": "Goals",
    "search.routines": "Routines",

    // Conversations
    "conversations.title": "Conversations",
    "conversations.new": "New conversation",
    "conversations.none": "No conversations yet",

    // Task detail
    "tasks.dependencies": "Dependencies",
    "tasks.blocked_by": "Blocked by",
    "tasks.add_dependency": "Add dependency...",
    "tasks.due_date": "Due Date",
    "tasks.attachments": "Attachments",
    "tasks.upload": "Upload",
    "tasks.no_attachments": "No attachments",

    // Agent profile
    "agent.tool_permissions": "Tool Permissions",
    "agent.pause": "Pause agent",
    "agent.resume": "Resume agent",
    "agent.run_now": "Run Now",

    // Dashboard
    "dashboard.active_agents": "Active Agents",
    "dashboard.tasks_in_progress": "Tasks In Progress",
    "dashboard.todays_runs": "Today's Runs",
    "dashboard.monthly_spend": "Monthly Spend",
    "dashboard.agent_team": "Agent Team",
    "dashboard.recent_activity": "Recent Activity",
    "dashboard.active_routines": "Active Routines",

    // Onboarding
    "onboarding.get_started": "Get started",
    "onboarding.completed": "{{done}} of {{total}} completed",
    "onboarding.create_department": "Create a department",
    "onboarding.add_agents": "Add agents to your team",
    "onboarding.first_chat": "Chat with an agent",
    "onboarding.create_task": "Create a task",
    "onboarding.enable_heartbeat": "Enable a heartbeat",

    // System logs
    "logs.title": "System Logs",
    "logs.auto_refresh": "Auto-refresh",
    "logs.all_levels": "All Levels",
    "logs.all_sources": "All Sources",
    "logs.no_logs": "No logs available",

    // Models
    "models.configuration": "Configuration",
    "models.sandbox": "Sandbox",
    "models.api_keys": "API Keys",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.create": "Create",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.connected": "Connected",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.upload": "Upload",
    "common.download": "Download",
    "common.retry": "Retry",
    "common.stop": "Stop",
    "common.copy": "Copy",
  },
  fr: {
    // Shell / Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.chat": "Chat",
    "nav.tasks": "Taches",
    "nav.goals": "Objectifs",
    "nav.routines": "Routines",
    "nav.models": "Modeles",
    "nav.costs": "Couts",
    "nav.settings": "Parametres",

    // Department selector
    "dept.ceo_view": "Vue PDG",
    "dept.all_depts": "Tous les departements",

    // Agent roster
    "agents.team": "Equipe d'agents",
    "agents.idle": "Inactif",
    "agents.active": "Actif",
    "agents.thinking": "En reflexion",

    // Tasks
    "tasks.backlog": "A faire",
    "tasks.in_progress": "En cours",
    "tasks.review": "En revision",
    "tasks.done": "Termine",
    "tasks.new": "Nouvelle tache",
    "tasks.no_tasks": "Aucune tache",
    "tasks.checkout_locked": "En traitement",

    // Chat
    "chat.placeholder": "Message a {{agent}}...",
    "chat.typing": "en cours...",
    "chat.start_conversation": "Commencer une conversation avec {{agent}}",

    // Heartbeat
    "heartbeat.when": "Quand {{agent}} devrait-il se manifester?",
    "heartbeat.chat_only": "Seulement quand je lui ecris",
    "heartbeat.scheduled": "Selon un horaire",
    "heartbeat.events": "Sur evenements",
    "heartbeat.next_runs": "Prochaines executions",
    "heartbeat.coming_soon": "Bientot disponible",

    // Costs
    "costs.monthly_overview": "Apercu mensuel",
    "costs.spent": "Depense",
    "costs.tasks_completed": "Taches completees",
    "costs.runs": "Executions",
    "costs.cli_savings": "Economies CLI",
    "costs.by_department": "Par departement",
    "costs.by_model": "Par modele",
    "costs.budget_status": "Etat du budget",

    // Goals
    "goals.company_mission": "Mission de l'entreprise",
    "goals.add_goal": "Ajouter un objectif",
    "goals.no_goals": "Aucun objectif pour le moment",

    // Approvals
    "approvals.pending": "En attente",
    "approvals.all": "Tous",
    "approvals.approve": "Approuver",
    "approvals.reject": "Rejeter",
    "approvals.revision": "Demander revision",

    // Routines
    "routines.new": "Nouvelle routine",
    "routines.trigger_now": "Executer maintenant",
    "routines.activate": "Activer",
    "routines.pause": "Mettre en pause",

    // Settings
    "settings.general": "General",
    "settings.approvals": "Approbations",
    "settings.skills": "Competences",
    "settings.plugins": "Extensions",
    "settings.export_import": "Exporter / Importer",
    "settings.company_name": "Nom de l'entreprise",
    "settings.language": "Langue",

    // Plugins
    "plugins.title": "Extensions",
    "plugins.installed": "{{count}} installees",
    "plugins.no_plugins":
      "Aucune extension installee. Deposez les dossiers d'extensions dans le repertoire plugins/.",
    "plugins.restart": "Redemarrer",
    "plugins.install": "Installer une extension",
    "plugins.install_path": "Chemin du dossier d'extension",
    "plugins.status_ready": "Pret",
    "plugins.status_error": "Erreur",
    "plugins.status_stopped": "Arrete",
    "plugins.status_loading": "Chargement",
    "plugins.crashes": "{{count}} plantages",

    // Navigation (new)
    "nav.files": "Fichiers",
    "nav.approvals": "Approbations",

    // Search
    "search.placeholder": "Chercher agents, taches, pages...",
    "search.no_results": "Aucun resultat",
    "search.navigation": "Navigation",
    "search.agents": "Agents",
    "search.tasks": "Taches",
    "search.goals": "Objectifs",
    "search.routines": "Routines",

    // Conversations
    "conversations.title": "Conversations",
    "conversations.new": "Nouvelle conversation",
    "conversations.none": "Aucune conversation",

    // Task detail
    "tasks.dependencies": "Dependances",
    "tasks.blocked_by": "Bloque par",
    "tasks.add_dependency": "Ajouter une dependance...",
    "tasks.due_date": "Date limite",
    "tasks.attachments": "Pieces jointes",
    "tasks.upload": "Telecharger",
    "tasks.no_attachments": "Aucune piece jointe",

    // Agent profile
    "agent.tool_permissions": "Permissions d'outils",
    "agent.pause": "Mettre en pause",
    "agent.resume": "Reprendre",
    "agent.run_now": "Executer",

    // Dashboard
    "dashboard.active_agents": "Agents actifs",
    "dashboard.tasks_in_progress": "Taches en cours",
    "dashboard.todays_runs": "Executions du jour",
    "dashboard.monthly_spend": "Depenses mensuelles",
    "dashboard.agent_team": "Equipe d'agents",
    "dashboard.recent_activity": "Activite recente",
    "dashboard.active_routines": "Routines actives",

    // Onboarding
    "onboarding.get_started": "Pour commencer",
    "onboarding.completed": "{{done}} sur {{total}} completes",
    "onboarding.create_department": "Creer un departement",
    "onboarding.add_agents": "Ajouter des agents a l'equipe",
    "onboarding.first_chat": "Discuter avec un agent",
    "onboarding.create_task": "Creer une tache",
    "onboarding.enable_heartbeat": "Activer un battement de coeur",

    // System logs
    "logs.title": "Journaux systeme",
    "logs.auto_refresh": "Rafraichissement auto",
    "logs.all_levels": "Tous les niveaux",
    "logs.all_sources": "Toutes les sources",
    "logs.no_logs": "Aucun journal disponible",

    // Models
    "models.configuration": "Configuration",
    "models.sandbox": "Bac a sable",
    "models.api_keys": "Cles API",

    // Common
    "common.save": "Sauvegarder",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.create": "Creer",
    "common.edit": "Modifier",
    "common.close": "Fermer",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succes",
    "common.connected": "Connecte",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.upload": "Telecharger",
    "common.download": "Telecharger",
    "common.retry": "Reessayer",
    "common.stop": "Arreter",
    "common.copy": "Copier",
  },
}

// =============================================================================
// Locale detection
// =============================================================================

export function useLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = document.cookie.match(/ao_locale=(en|fr)/)?.[1]
    if (stored) return stored as Locale
  }
  return "en"
}

export function setLocale(locale: Locale): void {
  if (typeof window !== "undefined") {
    document.cookie = `ao_locale=${locale};path=/;max-age=${365 * 24 * 60 * 60}`
  }
}

// =============================================================================
// Translation function
// =============================================================================

export function t(locale: Locale, key: string, vars?: Record<string, string>): string {
  let str = translations[locale]?.[key] || translations.en[key] || key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v)
    }
  }
  return str
}

// =============================================================================
// React hook: useT -- returns a bound t() function
// =============================================================================

export function useT(): (key: string, vars?: Record<string, string>) => string {
  const locale = useLocale()
  return useCallback(
    (key: string, vars?: Record<string, string>) => t(locale, key, vars),
    [locale]
  )
}

// =============================================================================
// Exports
// =============================================================================

export type { Locale }
export { translations }
