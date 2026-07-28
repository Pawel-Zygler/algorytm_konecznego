#!/bin/bash

# Skrypt do pakowania samej wtyczki dla użytkowników końcowych
echo "📦 Pakowanie wtyczki Algorytmu Konecznego do wydania..."

# Usuń stare archiwum jeśli istnieje
rm -f koneczny_extension_release.zip

# Spakuj zawartość folderu extension
cd extension || exit
zip -r ../koneczny_extension_release.zip ./* -x "*/.DS_Store" "*/__MACOSX*"

echo "✅ Gotowe! Plik koneczny_extension_release.zip został wygenerowany."
echo "Możesz wrzucić ten plik bezpośrednio do zakładki 'Releases' na GitHubie lub wysłać testerom."
