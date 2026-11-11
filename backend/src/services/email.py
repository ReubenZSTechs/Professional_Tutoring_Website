"""Send contact-form enquiries to the tutor's inbox through Resend.

Resend's free tier can send from `onboarding@resend.dev` without a
verified domain, but only to the email address that owns the Resend
account. Sign up to Resend with the address in CONTACT_TO_EMAIL.
"""

import html
import re
from typing import Any

import httpx
from core.config import Settings, get_settings

RESEND_URL = "https://api.resend.com/emails"

LABELS = [
    ("name", "Name"),
    ("role", "Enquiring as"),
    ("subject", "Subject"),
    ("level", "Level"),
    ("phone", "WhatsApp number"),
    ("email", "Email"),
    ("language", "Site language"),
    ("message", "Message"),
]


def whatsapp_link(phone: str) -> str:
    """Build a wa.me link from a number typed in any common format."""
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("0"):
        digits = "62" + digits[1:]  # Indonesian local format
    return f"https://wa.me/{digits}" if digits else ""


def render_enquiry(enquiry: dict[str, Any]) -> tuple[str, str, str]:
    """Return (subject, plain text, html) for an enquiry."""
    subject = f"New tutoring enquiry: {enquiry['name']} ({enquiry['subject']}, {enquiry['level']})"
    link = whatsapp_link(enquiry.get("phone", ""))
    rows = [(label, str(enquiry.get(key) or "-")) for key, label in LABELS]

    text_lines = [f"{label}: {value}" for label, value in rows]
    if link:
        text_lines.append(f"\nReply on WhatsApp: {link}")
    text = "\n".join(text_lines)

    label_style = "padding:6px 16px 6px 0;color:#4A5A70;vertical-align:top"
    value_style = "padding:6px 0;font-weight:600;white-space:pre-wrap"
    html_rows = "".join(
        f'<tr><td style="{label_style}">{html.escape(label)}</td>'
        f'<td style="{value_style}">{html.escape(value)}</td></tr>'
        for label, value in rows
    )
    button = (
        f'<p style="margin:24px 0 0"><a href="{html.escape(link)}" '
        'style="background:#F2A93B;color:#10233F;padding:12px 20px;border-radius:10px;'
        'font-weight:700;text-decoration:none">Reply on WhatsApp</a></p>'
        if link
        else ""
    )
    body = (
        '<div style="font-family:system-ui,sans-serif;color:#10233F;font-size:15px">'
        '<h2 style="margin:0 0 16px">New tutoring enquiry</h2>'
        f'<table style="border-collapse:collapse">{html_rows}</table>{button}</div>'
    )
    return subject, text, body


class EmailService:
    def __init__(
        self,
        settings: Settings | None = None,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._transport = transport  # injected in tests

    @property
    def ready(self) -> bool:
        return self.settings.email_ready

    async def send_enquiry(self, enquiry: dict[str, Any]) -> None:
        subject, text, body = render_enquiry(enquiry)
        payload: dict[str, Any] = {
            "from": self.settings.contact_from_email,
            "to": [self.settings.contact_to_email],
            "subject": subject,
            "text": text,
            "html": body,
        }
        if enquiry.get("email"):
            payload["reply_to"] = enquiry["email"]
        async with httpx.AsyncClient(timeout=15, transport=self._transport) as client:
            response = await client.post(
                RESEND_URL,
                json=payload,
                headers={"Authorization": f"Bearer {self.settings.resend_api_key}"},
            )
        if response.status_code >= 400:
            raise RuntimeError(f"Resend -> {response.status_code}: {response.text[:300]}")
