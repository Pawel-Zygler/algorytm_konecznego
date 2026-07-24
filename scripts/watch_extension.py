import time
import os
import subprocess

WATCH_FILE = os.path.abspath("extension/content.js")

def check_syntax():
    try:
        res = subprocess.run(["node", "-c", WATCH_FILE], capture_output=True, text=True)
        if res.returncode == 0:
            print(f"[{time.strftime('%H:%M:%S')}] ✅ extension/content.js syntax valid!")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] ❌ JS Syntax Error:\n{res.stderr}")
    except Exception as e:
        print(f"Error checking syntax: {e}")

def watch():
    print(f"👀 Watching {WATCH_FILE} for changes...")
    last_mtime = 0
    if os.path.exists(WATCH_FILE):
        last_mtime = os.path.getmtime(WATCH_FILE)
    
    while True:
        try:
            if os.path.exists(WATCH_FILE):
                mtime = os.path.getmtime(WATCH_FILE)
                if mtime != last_mtime:
                    last_mtime = mtime
                    check_syntax()
            time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopped watcher.")
            break

if __name__ == "__main__":
    watch()
