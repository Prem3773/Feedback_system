import sys
import pickle
import os

# Paths relative to this file
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "sentiment_model.pkl")
tfidf_path = os.path.join(base_dir, "tfidf.pkl")

# Load model + tfidf
model = pickle.load(open(model_path, "rb"))
tfidf = pickle.load(open(tfidf_path, "rb"))

# Read input from Node
text = sys.argv[1]

# Predict
vector = tfidf.transform([text])
prediction = model.predict(vector)[0]

# Output ONLY the sentiment
print(prediction)
