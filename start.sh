#!/bin/bash
# 🏛️ Start script for Algorytm Konecznego Backend

echo "🏛️ Uruchamianie serwera Algorytmu Konecznego..."
python3 -m uvicorn backend.main:app --port 8005 --reload
