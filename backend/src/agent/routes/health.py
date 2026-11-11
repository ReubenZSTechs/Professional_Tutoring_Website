"""GET /api/health: is the API up, and which integrations are configured?"""

from fastapi import APIRouter, Depends

from agent.container import Container, get_container

router = APIRouter()


@router.get("/health")
async def health(container: Container = Depends(get_container)) -> dict:
    settings = container.settings
    return {
        "status": "ok",
        "gemini": settings.gemini_ready,
        "supabase": settings.supabase_ready,
        "email": settings.email_ready,
    }
