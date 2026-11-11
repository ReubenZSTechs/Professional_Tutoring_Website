"""POST /api/contact: save an enquiry and email it to the tutor.

The enquiry is stored in Supabase first, then emailed through Resend.
Either one succeeding counts as delivered; if both fail the visitor is
told to use WhatsApp or email instead.
"""

import re
from typing import Literal

from core.logging import get_logger
from core.rate_limit import enforce
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

from agent.container import Container, get_container

logger = get_logger(__name__)
router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[\d\s().-]{6,24}$")


class Enquiry(BaseModel):
    # Trim spaces first, so a name of only spaces counts as empty.
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    role: Literal["parent", "student"]
    subject: str = Field(min_length=1, max_length=60)
    level: str = Field(min_length=1, max_length=60)
    phone: str = Field(min_length=6, max_length=24)
    email: str = Field(default="", max_length=120)
    message: str = Field(default="", max_length=2000)
    language: Literal["en", "id"] = "en"
    website: str = Field(default="", max_length=200)  # honeypot: real visitors leave it empty

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        if not PHONE_RE.match(value) or sum(c.isdigit() for c in value) < 6:
            raise ValueError("Enter a valid phone number.")
        return value

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        if value and not EMAIL_RE.match(value):
            raise ValueError("Enter a valid email address.")
        return value


@router.post("/contact")
async def contact(
    enquiry: Enquiry, request: Request, container: Container = Depends(get_container)
) -> dict:
    enforce(container.contact_limiter, request)
    if enquiry.website:
        # A bot filled the hidden field. Pretend it worked and do nothing.
        return {"ok": True}

    data = enquiry.model_dump(exclude={"website"})
    data["email"] = data["email"] or None
    data["message"] = data["message"] or None

    stored_id = None
    if container.supabase.ready:
        try:
            stored_id = (await container.supabase.insert("enquiries", data)).get("id")
        except Exception:  # noqa: BLE001 - still try to email it
            logger.exception("Could not store enquiry")

    emailed = False
    if container.email.ready:
        try:
            await container.email.send_enquiry(data)
            emailed = True
        except Exception:  # noqa: BLE001 - the stored copy is still there
            logger.exception("Could not email enquiry")

    if stored_id is None and not emailed:
        raise HTTPException(
            status_code=502,
            detail="The enquiry could not be delivered. Please use WhatsApp or email instead.",
        )
    if stored_id is not None and emailed:
        try:
            await container.supabase.update(
                "enquiries", {"email_sent": True}, filters={"id": f"eq.{stored_id}"}
            )
        except Exception:  # noqa: BLE001 - bookkeeping only
            logger.exception("Could not mark enquiry as emailed")
    return {"ok": True}
