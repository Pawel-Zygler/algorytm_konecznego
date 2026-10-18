#!/bin/bash
# 🛑 Stop script for Algorytm Konecznego Backend

echo "🛑 Zatrzymywanie backendu Algorytmu Konecznego na porcie 8005..."
PIDS=$(lsof -ti :8005)
if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null
    echo "✅ Zatrzymano serwer (PID: $(echo $PIDS | tr '\n' ' '))."
else
    echo "ℹ️ Brak aktywnego serwera na porcie 8005."
fi
