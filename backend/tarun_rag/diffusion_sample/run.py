import torch
from diffusers import Flux2KleinPipeline
from diffusers.utils import load_image

device = "cuda"
dtype = torch.float16

pipe = Flux2KleinPipeline.from_pretrained(
    "black-forest-labs/FLUX.2-klein-4B",
    torch_dtype=dtype,
)
# pipe.enable_model_cpu_offload()

pipe.enable_sequential_cpu_offload()
pipe.enable_attention_slicing()  # or just pipe.enable_attention_slicing()

prompt = """
A surreal anime masterpiece. A vibrant, hyper-detailed background of a tourist landmark looking like a movie poster. The characters are superimposed as rough, hand-drawn graphite sketches that break the fourth wall, floating in front of the scenery with a paper-cutout aesthetic. Stylish, colorful, and expressive.
No text, No captions, No adding of other characters, just the original characters and the background with style.
"""
init_image = load_image("image.png")  # PIL.Image

import time

t0 = time.time()
out = pipe(
    prompt=prompt,
    image=init_image,
    height=1024,
    width=576,
    guidance_scale=10.0,
    num_inference_steps=4,
    generator=torch.Generator(device=device).manual_seed(0),
)
dt = time.time() - t0
print(f"Generation took {dt:.2f}s")

out.images[0].save("flux-klein.png")