import sys
import pickle
import os

base_dir = os.path.dirname(__file__)

model = pickle.load(open(os.path.join(base_dir, "sentiment_model.pkl"), "rb"))
tfidf = pickle.load(open(os.path.join(base_dir, "tfidf.pkl"), "rb"))

text = sys.argv[1]

# Clean text
text = text.lower().strip()

vector = tfidf.transform([text])
prediction = model.predict(vector)[0]

print(prediction)
