import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os

print("Training Sentiment Model...")

# -------------------------------------------------
# LOAD DATASET
# -------------------------------------------------
csv_path = os.path.join(os.path.dirname(__file__), "student_feedback_1000_domain_matched.csv")
df = pd.read_csv(csv_path)

# Remove duplicates
df = df.drop_duplicates(subset="feedback")

print("\nDataset Size:", len(df))
print("\nLabel Distribution:")
print(df["label"].value_counts())

# -------------------------------------------------
# PREPARE DATA
# -------------------------------------------------
X = df["feedback"].astype(str).str.lower().str.strip()
y = df["label"]

# -------------------------------------------------
# TRAIN TEST SPLIT (PREVENT DATA LEAKAGE)
# -------------------------------------------------
X_train_text, X_test_text, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -------------------------------------------------
# TF-IDF WITH BIGRAMS
# -------------------------------------------------
tfidf = TfidfVectorizer(
    max_features=7000,
    ngram_range=(1, 2)
)

X_train = tfidf.fit_transform(X_train_text)
X_test = tfidf.transform(X_test_text)

# -------------------------------------------------
# TRAIN MODEL
# -------------------------------------------------
model = LogisticRegression(
    max_iter=3000,
    class_weight="balanced"
)

model.fit(X_train, y_train)

# -------------------------------------------------
# EVALUATE MODEL
# -------------------------------------------------
y_pred = model.predict(X_test)

print("\nModel Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# -------------------------------------------------
# SAVE MODEL
# -------------------------------------------------
model_path = os.path.join(os.path.dirname(__file__), "sentiment_model.pkl")
tfidf_path = os.path.join(os.path.dirname(__file__), "tfidf.pkl")

pickle.dump(model, open(model_path, "wb"))
pickle.dump(tfidf, open(tfidf_path, "wb"))

print("\nModel saved successfully.")
