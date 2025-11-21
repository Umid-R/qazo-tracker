# Uzbek Speech-to-Text (Whisper)

Simple lien of code  to convert Uzbek audio to text using OpenAI Whisper.

## ✅ Features

* Supports Uzbek language
* Works with WAV / MP3
* Uses Whisper (small / medium / large)
* Handles light background noise

## 📦 Install

```bash
pip install openai-whisper librosa
```

## ▶️ Usage

Run the script:

```bash
python stt_test.py
```

## 📄 Example Code

```python
import whisper

model = whisper.load_model("small")  # change to medium or large if needed
result = model.transcribe("test_clean.mp3", language="uz", fp16=False)
print(result["text"])
```

## ⚡ Model Speed vs Accuracy

* small → Fast, less accurate
* medium → Balanced
* large → Slow, most accurate

## 📝 Notes

For best results:

* Use clear audio
* Avoid loud music in background
* Prefer 16kHz mono audio

---

Made for Uzbek STT testing & comparison 🚀

