"""Fixed replies used when the model is skipped or its answer is replaced."""

from typing import Literal

Lang = Literal["en", "id"]

BLOCKED = {
    "en": (
        "I can only help with questions about Reuben and his tutoring, such as subjects, "
        "rates and how to book. What would you like to know?"
    ),
    "id": (
        "Saya hanya bisa membantu pertanyaan tentang Reuben dan les privatnya, seperti mata "
        "pelajaran, biaya, dan cara mendaftar. Apa yang ingin Anda ketahui?"
    ),
}

OFF_TOPIC = {
    "en": (
        "That is outside what I can help with here. I can answer questions about Reuben's "
        "background, the subjects he teaches, rates and how to book a free consultation."
    ),
    "id": (
        "Itu di luar yang bisa saya bantu di sini. Saya bisa menjawab pertanyaan tentang latar "
        "belakang Reuben, mata pelajaran yang diajarkan, biaya, dan cara memesan konsultasi gratis."
    ),
}

SMALLTALK = {
    "en": (
        "Hello! I can answer questions about Reuben's lessons, rates and "
        "background. What would you like to know?"
    ),
    "id": (
        "Halo! Saya bisa menjawab pertanyaan tentang les, biaya, dan latar "
        "belakang Reuben. Apa yang ingin Anda ketahui?"
    ),
}

REPLACED = {
    "en": (
        "I'm not able to answer that reliably. For details, please message Reuben on WhatsApp "
        "or use the enquiry form on this page."
    ),
    "id": (
        "Saya tidak bisa menjawab itu dengan pasti. Untuk detailnya, silakan hubungi Reuben via "
        "WhatsApp atau gunakan formulir pada halaman ini."
    ),
}

ERROR = {
    "en": "Sorry, I couldn't answer just now. Please try again, or message Reuben on WhatsApp.",
    "id": (
        "Maaf, saya belum bisa menjawab saat ini. "
        "Silakan coba lagi, atau hubungi Reuben via WhatsApp."
    ),
}

LIMIT = {
    "en": (
        "You've sent a lot of messages in a short time. Please wait a moment, "
        "or message Reuben on WhatsApp."
    ),
    "id": (
        "Anda mengirim banyak pesan dalam waktu singkat. Mohon tunggu "
        "sebentar, atau hubungi Reuben via WhatsApp."
    ),
}

# The model provider refused the request (daily quota, overload).
BUSY = {
    "en": (
        "The assistant is busy right now. Please try again in a little while, "
        "or message Reuben directly on WhatsApp."
    ),
    "id": (
        "Asisten sedang sibuk saat ini. Silakan coba lagi sebentar lagi, "
        "atau hubungi Reuben langsung via WhatsApp."
    ),
}
