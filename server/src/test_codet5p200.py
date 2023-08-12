from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

checkpoint = "Salesforce/codet5p-2b"
device = "cpu"  # for GPU usage or "cpu" for CPU usage

tokenizer = AutoTokenizer.from_pretrained(checkpoint)
model = AutoModelForSeq2SeqLM.from_pretrained(
    checkpoint, torch_dtype=torch.float16, trust_remote_code=True
).to(device)

encoding = tokenizer("def print_hello_world():", return_tensors="pt").to(device)
encoding["decoder_input_ids"] = encoding["input_ids"].clone()
outputs = model.generate(**encoding, max_length=15)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
