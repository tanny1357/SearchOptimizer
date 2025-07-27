import requests
from PIL import Image
from transformers import GitProcessor, GitForCausalLM

# --- 1. Load the processor and model from your local directory ---
# The "." means "the current directory"
model_path = "." 
processor = GitProcessor.from_pretrained(model_path)
model = GitForCausalLM.from_pretrained(model_path)

# --- 2. Get a sample image from the web ---
# You can replace this URL with a link to another image
image_url = "http://images.cocodataset.org/val2017/000000039769.jpg"
try:
    image = Image.open(requests.get(image_url, stream=True).raw)
except requests.exceptions.RequestException as e:
    print(f"Could not download the image. Please check your internet connection. Error: {e}")
    exit()

# --- 3. Prepare the image for the model ---
# This converts the image into numbers the model can understand
pixel_values = processor(images=image, return_tensors="pt").pixel_values

# --- 4. Generate a caption for the image ---
generated_ids = model.generate(pixel_values=pixel_values, max_length=50)

# --- 5. Decode the result and print it ---
# This turns the numbers back into human-readable text
generated_caption = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

print("\nModel is working!")
print("Generated Caption:", generated_caption)