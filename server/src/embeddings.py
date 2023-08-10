# %%
from InstructorEmbedding import INSTRUCTOR

print("Loading Instructor model...")
model = INSTRUCTOR("hkunlp/instructor-large")
print("Model loaded!")

# %%
sentence = "3D ActionSLAM: wearable person tracking in multi-floor environments"
instruction = "Represent the Science title:"

print("Encoding embeddings...")
embeddings = model.encode([[instruction, sentence]])
print(embeddings)
