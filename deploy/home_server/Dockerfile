# Optional: run the Python backend on your own server instead of Vercel.
# Build from the repo root:
#   docker build -f deploy/home_server/Dockerfile -t tutoring-api .
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/src ./backend/src

RUN useradd --create-home appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "agent.main:app", "--app-dir", "backend/src", "--host", "0.0.0.0", "--port", "8000"]
