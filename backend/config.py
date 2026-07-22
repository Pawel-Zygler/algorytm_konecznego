import os
from dotenv import load_dotenv

# Load environment variables from .env file relative to this file
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path)

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDICES_DIR = os.path.join(BASE_DIR, "indices")
SCORE_FILE = os.path.join(BASE_DIR, "Score")
GENERALIA_ENUM_FILE = os.path.join(BASE_DIR, "Generalia_enum")
PERSONALISTIC_ROW_FILE = os.path.join(BASE_DIR, "isPersonalisticRow")

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Fallback list of models (tries latest pro, then older pros, then flashes)
GEMINI_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
    "gemini-pro-latest",
    "gemini-2.5-pro",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest"
]
