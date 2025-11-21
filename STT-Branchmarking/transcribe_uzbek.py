import whisper

# Whisper large model: less fast&high accuracy
print("🚀 Loading Whisper model (large-v3)...")
model = whisper.load_model("large-v3") 

# Whisper small model: fast&less accuracy
# print("🚀 Loading Whisper model (small)...")
# model = whisper.load_model("medium")


# Whisper medium model: Balanced speed&accuracy
# print("🚀 Loading Whisper model (large-v3)...")
# model = whisper.load_model("large-v3")

audio_path = "clean_audio.wav"

result = model.transcribe(
    audio_path,
    language="uz",
    fp16=False,
    temperature=0,
    beam_size=5
)

print("\n✅ UZBEK TRANSCRIPTION:")
print(result["text"])
