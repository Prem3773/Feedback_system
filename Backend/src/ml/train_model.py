import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle
import os

# Show where we are running from
print("CWD:", os.getcwd())

# Load dataset (CSV placed in the same ml folder)
csv_path = os.path.join(os.path.dirname(__file__), "student_feedback_1000.csv")
print("Loading dataset from:", csv_path)

df = pd.read_csv(csv_path)

X = df["feedback"]
y = df["label"]

# Build TF-IDF
tfidf = TfidfVectorizer(max_features=5000, stop_words="english")
X_vec = tfidf.fit_transform(X)

# Train Logistic Regression
model = LogisticRegression(max_iter=2000)
model.fit(X_vec, y)

# Save model and vectorizer in the SAME ml folder
model_path = os.path.join(os.path.dirname(__file__), "sentiment_model.pkl")
tfidf_path = os.path.join(os.path.dirname(__file__), "tfidf.pkl")

pickle.dump(model, open(model_path, "wb"))
pickle.dump(tfidf, open(tfidf_path, "wb"))

print("Model trained and saved!")
print("Model file:", model_path)
print("TFIDF file:", tfidf_path)
