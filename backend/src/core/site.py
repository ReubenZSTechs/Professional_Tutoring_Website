"""Facts about the site that the output guard checks answers against.

Keep in sync with `src/config/site.ts` and `src/config/rates.ts` (a unit
test compares the prices). The chat assistant may only mention these
prices, links, email and phone number; anything else in an answer is
treated as a sign of tampering and the answer is replaced.
"""

# Price per 60-minute session, in Rupiah. Must match src/config/rates.ts.
RATES_IDR: dict[str, int] = {
    "igcse": 225_000,
    "alevel": 275_000,
    "ib": 325_000,
    "university": 375_000,
}

CONTACT_EMAIL = "reuben.zachary.rz@gmail.com"
WHATSAPP_DIGITS = "628118495021"

# Hosts the assistant may link to.
ALLOWED_LINK_HOSTS = {
    "wa.me",
    "linkedin.com",
    "www.linkedin.com",
    "github.com",
    "zoom.us",
    "cambridgeinternational.org",
    "www.cambridgeinternational.org",
    "ibo.org",
    "www.ibo.org",
}
