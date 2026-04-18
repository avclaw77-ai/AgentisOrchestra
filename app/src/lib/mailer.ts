/**
 * Email notification utility for AgentisOrchestra.
 *
 * Sends notifications for approvals, escalations, and system events.
 * Configured via environment variables. Silent no-op if SMTP is not configured.
 *
 * Env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   NOTIFY_ADMIN_EMAIL -- where escalation/approval emails go
 */

import nodemailer from "nodemailer"

function isConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_FROM)
}

function getTransporter() {
  if (!isConfigured()) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
      : undefined,
  })
}

export interface NotificationEmail {
  subject: string
  html: string
  to?: string // defaults to NOTIFY_ADMIN_EMAIL
}

/**
 * Send a notification email. Silent no-op if SMTP is not configured.
 * Never throws -- logs errors and moves on.
 */
export async function sendNotification(email: NotificationEmail): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) return false

  const to = email.to || process.env.NOTIFY_ADMIN_EMAIL
  if (!to) return false

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: email.subject,
      html: email.html,
    })
    return true
  } catch (err) {
    console.error("[mailer] Send failed:", err instanceof Error ? err.message : err)
    return false
  }
}

/**
 * Pre-built notification templates.
 */
export function approvalCreatedEmail(approval: {
  type: string
  title: string
  description?: string | null
  agentName?: string
  departmentName?: string
  appUrl?: string
}): NotificationEmail {
  const url = approval.appUrl || process.env.APP_URL || "http://localhost:3000"
  return {
    subject: `[Orchestra] Approval needed: ${approval.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 24px; background: #f8fafb; border-radius: 12px;">
          <h2 style="margin: 0 0 8px; font-size: 18px; color: #0c1929;">Approval Request</h2>
          <p style="margin: 0 0 16px; color: #526378; font-size: 14px;">${approval.title}</p>

          <table style="width: 100%; font-size: 13px; color: #526378;">
            <tr><td style="padding: 4px 0; font-weight: 600;">Type</td><td>${approval.type}</td></tr>
            ${approval.agentName ? `<tr><td style="padding: 4px 0; font-weight: 600;">From</td><td>${approval.agentName}</td></tr>` : ""}
            ${approval.departmentName ? `<tr><td style="padding: 4px 0; font-weight: 600;">Department</td><td>${approval.departmentName}</td></tr>` : ""}
          </table>

          ${approval.description ? `<p style="margin: 16px 0 0; font-size: 13px; color: #526378; border-left: 3px solid #e5eaf0; padding-left: 12px;">${approval.description}</p>` : ""}

          <div style="margin-top: 20px;">
            <a href="${url}/approvals" style="display: inline-block; padding: 10px 20px; background: #0284C7; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">Review in Orchestra</a>
          </div>
        </div>
        <p style="margin-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">AgentisOrchestra -- ${url}</p>
      </div>
    `,
  }
}

export function escalationEmail(escalation: {
  taskTitle: string
  reason: string
  agentName?: string
  appUrl?: string
}): NotificationEmail {
  const url = escalation.appUrl || process.env.APP_URL || "http://localhost:3000"
  return {
    subject: `[Orchestra] Agent blocked: ${escalation.taskTitle}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 24px; background: #fef3c7; border-radius: 12px; border: 1px solid #fbbf24;">
          <h2 style="margin: 0 0 8px; font-size: 18px; color: #92400e;">Agent Blocked</h2>
          <p style="margin: 0 0 12px; color: #78350f; font-size: 14px;">${escalation.taskTitle}</p>

          ${escalation.agentName ? `<p style="margin: 0 0 8px; font-size: 13px; color: #92400e;"><strong>Agent:</strong> ${escalation.agentName}</p>` : ""}
          <p style="margin: 0; font-size: 13px; color: #78350f;"><strong>Reason:</strong> ${escalation.reason}</p>

          <div style="margin-top: 20px;">
            <a href="${url}/approvals" style="display: inline-block; padding: 10px 20px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">Unblock in Orchestra</a>
          </div>
        </div>
      </div>
    `,
  }
}
