# # import os
# # import tempfile
# # import httpx
# # from pydub import AudioSegment
# # from fastapi import HTTPException
# # from core.config import settings

# # Ensure these variables exist outside try to safely clean up in finally
# raw_path = None
# wav_path = None

# async def compute():
#     try:
#         # 1. Save incoming browser payload to temp file
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_raw:
#             content = await file.read()
#             temp_raw.write(content)
#             raw_path = temp_raw.name

#         # 2. Convert raw audio to 16kHz mono WAV format
#         audio = AudioSegment.from_file(raw_path)
#         audio = audio.set_frame_rate(16000).set_channels(1)

#         with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as wav_temp:
#             wav_path = wav_temp.name

#         # Export audio after file handle is released
#         audio.export(wav_path, format="wav")

#         # 3. Call Sarvam AI Speech-to-Text API
#         url = "https://api.sarvam.ai/speech-to-text"
#         headers = {
#             "api-subscription-key": settings.SARVAM_API_KEY
#         }

#         # Open file context for API upload
#         with open(wav_path, "rb") as wav_file:
#             files = {
#                 "file": ("recording.wav", wav_file, "audio/wav")
#             }
#             data = {
#                 "model": "saarika:v1",
#                 "language_code": "hi-IN",
#                 "with_timestamps": False  # Boolean value expected
#             }
            
#             # Async HTTP request prevents blocking FastAPI thread pool
#             async with httpx.AsyncClient() as client:
#                 res = await client.post(url, headers=headers, files=files, data=data)

#         if res.status_code != 200:
#             raise HTTPException(
#                 status_code=500, 
#                 detail=f"Sarvam AI Error: {res.text}"
#             )

#         sarvam_data = res.json()
#         transcript = sarvam_data.get("transcript", "")

#         if not transcript.strip():
#             raise HTTPException(
#                 status_code=400, 
#                 detail="No speech could be recognized in the audio recording."
#             )

#         # 4. Process workflow response

#     finally:
#         # Safe cleanup of temporary audio files
#         for path in (raw_path, wav_path):
#             if path and os.path.exists(path):
#                 try:
#                     os.remove(path)
#                 except OSError:
#                     pass