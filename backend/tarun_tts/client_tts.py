import argparse
import pathlib
import requests


def tts(base_url: str, text: str, voice_url: str | None, out_path: str):
    url = base_url.rstrip("/") + "/tts"
    data = {"text": text}
    if voice_url:
        data["voice_url"] = voice_url

    with requests.post(url, data=data, stream=True, timeout=300) as r:
        r.raise_for_status()
        out_file = pathlib.Path(out_path)
        with out_file.open("wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 64):
                if chunk:
                    f.write(chunk)

    print(f"Saved WAV to: {out_file.resolve()}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--base-url", default="https://c257b4e5d3c0.ngrok-free.app", help="e.g. https://c257b4e5d3c0.ngrok-free.app")
    p.add_argument("--text", default="hello this is fucking awesome", help="text to synthesize")
    p.add_argument("--voice-url", default="alba", help="e.g. alba or hf://... or https://...")
    p.add_argument("--out", default="out.wav", help="output wav path")
    args = p.parse_args()

    tts(args.base_url, args.text, args.voice_url, args.out)