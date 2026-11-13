"""GET /api/health: is the API up, and which integrations are configured?"""

from fastapi import APIRouter, Depends

from agent.container import Container, get_container

router = APIRouter()


@router.get("/health")
async def health(container: Container = Depends(get_container)) -> dict:
    settings = container.settings
    return {
        "status": "ok",
        "environment": "production" if settings.is_production else "development",
        "gemini": settings.gemini_ready,
        "supabase": settings.supabase_ready,
        "email": settings.email_ready,
        "turnstile": settings.turnstile_is_test and "test" or "live",
    }
