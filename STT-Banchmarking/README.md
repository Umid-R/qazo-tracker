# Uzbek Audio-to-Text Module

This script converts Uzbek audio files into text using the **Wav2Vec2** model `lucio/xls-r-uzbek-cv8` from Hugging Face.

---

## Requirements

- Python 3.8+
- PyTorch
- Transformers
- Librosa

Install dependencies:

```bash
pip install torch transformers librosa
```



Usage

1. Place your Uzbek audio file (e.g., test_clean.mp3) in the same folder.
2. Update AUDIO_FILE in the script if needed.
3. Run the script:



You will see the Uzbek transcription printed in the console.
