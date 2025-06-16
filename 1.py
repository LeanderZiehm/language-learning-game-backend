from openai import OpenAI

client = OpenAI(api_key="my-key", base_url="http://localhost:8888/v1/")


models = ['Systran/faster-whisper-tiny','Systran/faster-distil-whisper-large-v3']
model = models[0]

audio_file = open("audio.mp3", "rb")
transcript = client.audio.transcriptions.create(
    model=model, file=audio_file
)
print(transcript.text)