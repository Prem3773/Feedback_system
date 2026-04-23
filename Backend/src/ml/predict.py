import sys
import pickle
import os
import json
import numpy as np

base_dir = os.path.dirname(__file__)

model = pickle.load(open(os.path.join(base_dir, "sentiment_model.pkl"), "rb"))
tfidf = pickle.load(open(os.path.join(base_dir, "tfidf.pkl"), "rb"))

text = sys.argv[1]

# Clean text
text = text.lower().strip()

vector = tfidf.transform([text])

classes = list(model.classes_)
proba = model.predict_proba(vector)[0]
best_idx = int(np.argmax(proba))
prediction = classes[best_idx]
confidence = float(proba[best_idx])

print(json.dumps({
    "label": prediction,
    "confidence": confidence
}))
