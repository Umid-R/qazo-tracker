import whisper

print(" Loading a model for Uzbek...")
model = whisper.load_model("large-v3")

result = model.transcribe(
    "test_clean.mp3",
    language="uz",
    task="transcribe",
    temperature=0,
    beam_size=5,
    fp16=False
)

print("\n✅ FINAL UZBEK RESULT:")
print(result["text"])
