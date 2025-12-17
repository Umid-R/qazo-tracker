from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import torch
import librosa
import time

MODEL_NAME = "lucio/xls-r-uzbek-cv8"
AUDIO_FILE = "test_clean.mp3"   

# ⏱ Start total timer
start_time = time.time()

print("🚀 Loading Uzbek STT model:", MODEL_NAME)

processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
model.eval()

print("🎧 Loading audio...")
audio, sr = librosa.load(AUDIO_FILE, sr=16000)

# 🎧 Audio length in seconds
audio_duration = len(audio) / sr

inputs = processor(audio, sampling_rate=16000, return_tensors="pt", padding=True)

with torch.no_grad():
    logits = model(**inputs).logits

predicted_ids = torch.argmax(logits, dim=-1)
transcription = processor.batch_decode(predicted_ids)[0]

# ⏱ End total timer
end_time = time.time()

print("\n✅ Uzbek Transcription:")
print(transcription)

print(f"\n🎧 Audio length: {audio_duration:.2f} seconds")
print(f"⏱ Total execution time: {end_time - start_time:.2f} seconds")







# import whisper
# import librosa
# import time

# AUDIO_FILE = "test_clean.mp3"

# start_time = time.time()

# print("🚀 Loading Whisper model (small)...")
# model = whisper.load_model("small")

# print("🎧 Loading audio...")
# audio, sr = librosa.load(AUDIO_FILE, sr=16000)

# # ✅ Audio length in seconds
# audio_duration = len(audio) / sr

# print("🧠 Transcribing...")
# result = model.transcribe(
#     AUDIO_FILE,
#     language="uz",
#     fp16=False
# )

# end_time = time.time()

# print("\n✅ Uzbek Transcription:")
# print(result["text"])

# print(f"\n🎧 Audio length: {audio_duration:.2f} seconds")
# print(f"⏱ Total execution time: {end_time - start_time:.2f} seconds")

