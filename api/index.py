from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import json
import os
import httpx

# Resolve the project root (one level up from /api/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(
    title="SustainAI API",
    description="Backend API for the SustainAI platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
TEAM_EMAIL = "team@sustain-ai.net"


# ── Static asset directories ────────────────────────────────
app.mount("/css",    StaticFiles(directory=os.path.join(BASE_DIR, "css")),    name="css")
app.mount("/js",     StaticFiles(directory=os.path.join(BASE_DIR, "js")),     name="js")
app.mount("/images", StaticFiles(directory=os.path.join(BASE_DIR, "images")), name="images")


# ── HTML pages ──────────────────────────────────────────────
@app.get("/", response_class=FileResponse, include_in_schema=False)
async def serve_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))


@app.get("/demo", response_class=FileResponse, include_in_schema=False)
@app.get("/demo.html", response_class=FileResponse, include_in_schema=False)
async def serve_demo():
    return FileResponse(os.path.join(BASE_DIR, "demo.html"))


# ── Data models ─────────────────────────────────────────────
class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., min_length=5, max_length=254)
    organization: str = Field(default="", max_length=300)
    message: str = Field(..., min_length=10, max_length=5000)


class ContactResponse(BaseModel):
    success: bool
    message: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


# ── Health ──────────────────────────────────────────────────
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
    )


# ── Contact form ─────────────────────────────────────────────
@app.post("/api/contact", response_model=ContactResponse)
async def submit_contact(payload: ContactRequest):
    try:
        submitted_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")
        org_line = f"Organization: {payload.organization}\n" if payload.organization else ""

        # Build email content
        email_html = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#1b3a23;margin-bottom:4px">New Contact — SustainAI</h2>
            <p style="color:#4a6b52;font-size:14px;margin-top:0">{submitted_at}</p>
            <hr style="border:none;border-top:1px solid #dde9df;margin:20px 0">
            <p><strong>Name:</strong> {payload.name}</p>
            <p><strong>Email:</strong> <a href="mailto:{payload.email}">{payload.email}</a></p>
            {"<p><strong>Organization:</strong> " + payload.organization + "</p>" if payload.organization else ""}
            <hr style="border:none;border-top:1px solid #dde9df;margin:20px 0">
            <p><strong>Message:</strong></p>
            <div style="background:#f0f8f2;padding:16px;border-radius:8px;white-space:pre-wrap">{payload.message}</div>
        </div>
        """

        # Always log to stdout (visible in Vercel function logs)
        submission = {
            "name": payload.name,
            "email": payload.email,
            "organization": payload.organization,
            "message": payload.message,
            "submitted_at": submitted_at,
        }
        print(f"[CONTACT] New submission: {json.dumps(submission)}")

        # Send via Resend if API key is configured
        if RESEND_API_KEY:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": f"SustainAI <noreply@sustain-ai.net>",
                        "to": [TEAM_EMAIL],
                        "reply_to": payload.email,
                        "subject": f"[SustainAI] New contact from {payload.name}",
                        "html": email_html,
                    },
                )
                if response.status_code not in (200, 201):
                    print(f"[CONTACT] Resend error: {response.status_code} {response.text}")
                    # Still return success — form data is logged
                else:
                    print(f"[CONTACT] Email sent via Resend: {response.json()}")

        return ContactResponse(
            success=True,
            message="Thank you for reaching out. We will get back to you soon.",
        )
    except Exception as e:
        print(f"[CONTACT] Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process your request.")

