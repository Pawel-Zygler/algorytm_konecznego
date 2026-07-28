import os
from dotenv import load_dotenv

# Load environment variables from .env file relative to this file
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path)

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDICES_DIR = os.path.join(BASE_DIR, "indices")

# API Keys configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
TON_API_KEY = os.environ.get("TON_API_KEY")

# Verified list of Gemini models supported by Google REST API v1beta
GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest"
]
