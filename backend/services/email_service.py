from __future__ import annotations

import re
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage

from core.config import get_settings
from utils.errors import DeliveryError

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
except ImportError:  # pragma: no cover
    SendGridAPIClient = None
    Mail = None

settings = get_settings()


@dataclass
class EmailSendResult:
    sent: bool
    provider: str
    preview_otp: str | None = None


def _plain_text_from_html(html: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _send_via_sendgrid(recipient: str, subject: str, html_body: str) -> EmailSendResult:
    if SendGridAPIClient is None or Mail is None:
        raise DeliveryError("SendGrid dependency is missing. Reinstall backend requirements.")
    message = Mail(
        from_email=settings.mail_from_email,
        to_emails=recipient,
        subject=subject,
        html_content=html_body,
        plain_text_content=_plain_text_from_html(html_body),
    )
    client = SendGridAPIClient(settings.sendgrid_api_key)
    response = client.send(message)
    if response.status_code >= 400:
        raise DeliveryError("SendGrid rejected the request. Verify the API key and sender identity.")
    return EmailSendResult(sent=True, provider="sendgrid")


def _send_via_smtp(recipient: str, subject: str, html_body: str) -> EmailSendResult:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.mail_from_email
    message["To"] = recipient
    message.set_content(_plain_text_from_html(html_body))
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context()) as server:
            server.login(settings.mail_username, settings.mail_password)
            server.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        raise DeliveryError("SMTP authentication failed. Use a Gmail App Password, not your normal password.") from exc
    except smtplib.SMTPException as exc:
        raise DeliveryError("SMTP delivery failed. Verify the mail credentials and sender settings.") from exc
    return EmailSendResult(sent=True, provider="smtp")


def _build_otp_template(name: str, code: str, purpose: str) -> tuple[str, str]:
    is_reset = purpose == "password-reset"
    title = "Password Reset" if is_reset else "Email Verification"
    accent = "#ef4444" if is_reset else "#2563eb"
    action = "reset your password" if is_reset else "complete your signup"
    subject = f"TeleMed_AI {title}"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:32px;">
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">TeleMed_AI</p>
        <h1 style="margin:0 0 12px;font-size:28px;color:#0f172a;">{title}</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;">Hi <strong>{name}</strong>, use this OTP to {action}.</p>
        <div style="margin:24px 0;padding:20px;border-radius:14px;background:#eff6ff;text-align:center;">
          <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:{accent};">{code}</span>
        </div>
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">This code expires in {settings.otp_expiry_minutes} minutes.</p>
        <p style="margin:0;color:#94a3b8;font-size:12px;">If you did not request this, you can ignore this email.</p>
      </div>
    </div>
    """
    return subject, html


def send_otp_email(recipient: str, name: str, code: str, purpose: str) -> EmailSendResult:
    subject, html_body = _build_otp_template(name, code, purpose)

    if settings.sendgrid_api_key:
        return _send_via_sendgrid(recipient, subject, html_body)

    if settings.mail_username and settings.mail_password:
        return _send_via_smtp(recipient, subject, html_body)

    if settings.otp_debug_preview and not settings.is_production:
        return EmailSendResult(sent=False, provider="preview", preview_otp=code)

    raise DeliveryError(
        "Email delivery is not configured. Set SENDGRID_API_KEY or MAIL_USERNAME and MAIL_PASSWORD."
    )
