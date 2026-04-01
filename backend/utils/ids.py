from __future__ import annotations

import random
import string


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def generate_numeric_id(length: int = 5) -> str:
    return "".join(random.choices(string.digits, k=length))
