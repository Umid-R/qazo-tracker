from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import torch
import librosa

MODEL_NAME = "lucio/xls-r-uzbek-cv8"
AUDIO_FILE = "test_clean.mp3"   

print("🚀 Loading Uzbek STT model:", MODEL_NAME)

processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
model.eval()

print("🎧 Loading audio...")
audio, sr = librosa.load(AUDIO_FILE, sr=16000)

inputs = processor(audio, sampling_rate=16000, return_tensors="pt", padding=True)

with torch.no_grad():
    logits = model(**inputs).logits

predicted_ids = torch.argmax(logits, dim=-1)
transcription = processor.batch_decode(predicted_ids)[0]

print("\n✅ Uzbek Transcription:")
print(transcription)
