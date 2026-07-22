import json

category_data = {
    "a": {"score": -1.0},
    "b": {"score": -1.0},
    "c": {"score": -1.0},
    "d": {"score": -1.0},
    "e": {"score": -1.0},
    "f": {"score": -1.0},
    "g": {"score": -1.0},
    "h": {"score": -1.0},
    "i": {"score": -1.0},
    "j": {"score": -1.0},
    "k": {"score": -1.0},
    "l": {"score": -1.0},
    "m": {"score": -1.0},
    "n": {"score": 0.1},
    "o": {"score": 0.2}
}

valid_vals = []
for val_info in category_data.values():
    val = -1.0
    if isinstance(val_info, (int, float)):
        val = float(val_info)
    elif isinstance(val_info, dict):
        val = float(val_info.get("score", -1.0))
    if val >= 0:
        valid_vals.append(val)

if len(category_data) > 0 and len(valid_vals) < len(category_data) * 0.3:
    print("-1.0")
else:
    print(sum(valid_vals) / len(valid_vals) if valid_vals else -1.0)
