import whisper

model = whisper.load_model("base")

resultat = model.transcribe("test.wav")
print("Transcription :", resultat["text"])
