import os
import secrets
import base64
import json
from datetime import datetime
from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import httpx
import asyncpg
import aiofiles
from dotenv import load_dotenv
from openai import OpenAI
from twilio.rest import Client

# ------------------ Load environment ------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

UPLOAD_DIR = "recordings"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
client = OpenAI(api_key=OPENAI_API_KEY)

# ------------------ Database Setup ------------------
@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(DATABASE_URL)
    async with app.state.db.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS recordings (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL,
                recording_url TEXT,
                created_at TIMESTAMP NOT NULL,
                qa_data JSONB DEFAULT '[]'::jsonb,
                generated_questions JSONB DEFAULT '[]'::jsonb
            );
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS interview_data (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL,
                question TEXT,
                answer TEXT,
                created_at TIMESTAMP NOT NULL
            );
        """)

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()

# ------------------ Create Interview Session ------------------
@app.get("/session")
async def get_session(language: str = "en"):
    candidate_id = secrets.token_hex(8)
    instructions = (
        "आप एक इंटरव्यूअर हैं। उम्मीदवार से केवल हिंदी में प्रश्न पूछें और सभी बातचीत हिंदी में करें।"
        if language == "hi"
        else "You are an interviewer. Ask questions in English and conduct the full interview in English."
    )
    body = {
        "model": "gpt-4o-realtime-preview",
        "voice": "alloy",
        "instructions": instructions,
    }

    try:
        async with httpx.AsyncClient() as client_http:
            r = await client_http.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            data = r.json()
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    return JSONResponse({**data, "candidate_id": candidate_id})

# ------------------ AI Recruiter Question Generator ------------------
@app.get("/get_next_question")
async def get_next_question(candidate_id: str, last_answer: str = None):
    if not last_answer:
        prompt = (
            "You are an AI recruiter. Start the interview with a short friendly greeting "
            "like 'Hi, nice to meet you!' and then follow up with your first interview question."
        )
    else:
        prompt = (
            f"You are an AI recruiter continuing a job interview. The candidate last said: '{last_answer}'. "
            "Acknowledge it politely (like 'Thanks for sharing!') and then ask the next relevant question."
        )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a friendly HR interviewer conducting an online interview."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
        )
        question = response.choices[0].message.content.strip()
        return {"question": question}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ------------------ Save Q&A ------------------
@app.post("/save_qa")
async def save_question_answer(request: Request):
    try:
        data = await request.json()
        candidate_id = data.get("candidate_id")
        question = data.get("question")
        answer = data.get("answer")
        generated_questions = data.get("generated_questions", [])

        if not all([candidate_id, question, answer]):
            return JSONResponse({"error": "candidate_id, question, and answer are required"}, status_code=400)

        async with app.state.db.acquire() as conn:
            record = await conn.fetchrow(
                "SELECT id, qa_data, generated_questions FROM recordings WHERE candidate_id=$1 ORDER BY created_at DESC LIMIT 1",
                candidate_id
            )

            if record:
                qa_data = record["qa_data"] or []
                gen_questions = record["generated_questions"] or []
                qa_data.append({"question": question, "answer": answer})
                gen_questions.extend(generated_questions)

                await conn.execute(
                    "UPDATE recordings SET qa_data=$1, generated_questions=$2 WHERE id=$3",
                    json.dumps(qa_data),
                    json.dumps(gen_questions),
                    record["id"]
                )
            else:
                await conn.execute(
                    """
                    INSERT INTO recordings (candidate_id, created_at, qa_data, generated_questions)
                    VALUES ($1, $2, $3, $4)
                    """,
                    candidate_id,
                    datetime.utcnow(),
                    json.dumps([{"question": question, "answer": answer}]),
                    json.dumps(generated_questions),
                )

        return JSONResponse({"status": "success"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ------------------ Complete Interview + Whisper Transcription ------------------
@app.post("/session/complete")
async def complete_session(request: Request):
    try:
        data = await request.json()
        recording_base64 = data.get("recording_base64")
        candidate_id = data.get("candidate_id") or secrets.token_hex(8)
        conversation = data.get("conversation", [])

        if not recording_base64:
            return JSONResponse({"error": "recording_base64 is required"}, status_code=400)

        # Save recording
        recording_bytes = base64.b64decode(recording_base64)
        filename = f"{candidate_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.wav"
        file_path = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(recording_bytes)

        recording_url = f"http://localhost:8000/{UPLOAD_DIR}/{filename}"

        # Transcribe with Whisper
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        transcribed_text = transcription.text.strip()

        # Combine full Q&A and transcription
        qa_combined = []
        if conversation and isinstance(conversation, list):
            for item in conversation:
                q = item.get("question")
                a = item.get("answer")
                if q or a:
                    qa_combined.append({"question": q, "answer": a})

        # Add transcription at the end
        qa_combined.append({"transcription": transcribed_text})

        # Save in DB
        async with app.state.db.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO recordings (candidate_id, recording_url, created_at, qa_data)
                VALUES ($1, $2, $3, $4)
                """,
                candidate_id,
                recording_url,
                datetime.utcnow(),
                json.dumps(qa_combined),
            )

        return JSONResponse({
            "status": "success",
            "candidate_id": candidate_id,
            "recording_url": recording_url,
            "transcription": transcribed_text,
            "conversation": qa_combined
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ------------------ Twilio Integration ------------------
@app.post("/call")
async def make_call(to: str = Query(...), language: str = "en"):
    try:
        call = twilio_client.calls.create(
            twiml=f"""
                <Response>
                    <Say language=\"{language}\">Hello, this is your interview call. Please answer the questions after the beep.</Say>
                    <Record maxLength=\"60\" action=\"/twilio/recording\" />
                </Response>
            """,
            to=to,
            from_=TWILIO_PHONE_NUMBER,
        )
        return {"status": "success", "call_sid": call.sid}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/twilio/recording")
async def twilio_recording(request: Request):
    data = await request.form()
    recording_url = data.get("RecordingUrl")
    candidate_number = data.get("From")

    async with app.state.db.acquire() as conn:
        await conn.execute(
            "INSERT INTO recordings (candidate_id, recording_url, created_at) VALUES ($1, $2, $3)",
            candidate_number,
            recording_url,
            datetime.utcnow(),
        )
    return JSONResponse({"status": "success"})

# ------------------ Serve Recordings ------------------
app.mount("/recordings", StaticFiles(directory=UPLOAD_DIR), name="recordings")
