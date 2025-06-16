import httpx

model = "Systran/faster-whisper-tiny"
url = "http://localhost:8888/v1/audio/transcriptions"

filename = "audio2.mp3"

with open(filename, "rb") as f:
    files = {"file": (filename, f, "audio/mpeg")}
    data = {"model": model}

    with httpx.stream("POST", url, data=data, files=files) as response:
        for chunk in response.iter_text():
            if chunk:
                print(chunk)
