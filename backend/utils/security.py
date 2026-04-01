from __future__ import annotations

import hashlib
import hmac
import os

PBKDF2_PREFIX = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 310_000


def hash_password(password: str, *, iterations: int = PBKDF2_ITERATIONS) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{PBKDF2_PREFIX}${iterations}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> tuple[bool, bool]:
    if not stored_hash:
        return False, False

    if stored_hash.startswith(f"{PBKDF2_PREFIX}$"):
        try:
            _, iterations, salt_hex, digest_hex = stored_hash.split("$", 3)
            digest = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                bytes.fromhex(salt_hex),
                int(iterations),
            )
            return hmac.compare_digest(digest.hex(), digest_hex), False
        except (ValueError, TypeError):
            return False, False

    legacy_digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_digest, stored_hash), True
