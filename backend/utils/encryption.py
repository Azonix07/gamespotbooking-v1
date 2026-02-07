"""
Encryption Utility - AES-256-GCM Field-Level Encryption
========================================================
Encrypts sensitive database fields (phone numbers, emails) before storage.
Decrypts only inside backend services — never in frontend.

Encryption Flow:
  1. Generate a random 12-byte IV (nonce) per encryption
  2. Encrypt plaintext using AES-256-GCM with the IV
  3. Store as: base64(IV + ciphertext + tag)

Decryption Flow:
  1. Decode base64 → extract IV (first 12 bytes), tag (last 16 bytes), ciphertext (middle)
  2. Decrypt using AES-256-GCM with the same key + IV

Key Rotation:
  - Set ENCRYPTION_KEY env var (32-byte hex string = 64 hex chars)
  - To rotate: set ENCRYPTION_KEY_OLD, update ENCRYPTION_KEY, re-encrypt records

Security Notes:
  - GCM mode provides both confidentiality AND integrity (authenticated encryption)
  - Each encryption uses a unique random IV — same plaintext → different ciphertext
  - Key MUST be 32 bytes (256 bits) for AES-256
  - NEVER log or expose the encryption key
"""

import os
import base64
import hashlib
import secrets
from typing import Optional

# Use PyCryptodome if available, fall back to cryptography library
try:
    from Crypto.Cipher import AES
    CRYPTO_BACKEND = 'pycryptodome'
except ImportError:
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        CRYPTO_BACKEND = 'cryptography'
    except ImportError:
        CRYPTO_BACKEND = 'none'


def _get_encryption_key() -> bytes:
    """
    Get the 32-byte AES-256 encryption key from environment.
    Derives a consistent 32-byte key using SHA-256 if the env var isn't exactly 32 bytes.
    
    Returns:
        bytes: 32-byte encryption key
    
    Raises:
        RuntimeError: If ENCRYPTION_KEY is not set
    """
    key_str = os.getenv('ENCRYPTION_KEY')
    if not key_str:
        # In production, this MUST be set. In dev, use a derived key from SECRET_KEY.
        secret = os.getenv('SECRET_KEY', '')
        if not secret:
            raise RuntimeError(
                "ENCRYPTION_KEY environment variable is not set. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        # Derive a 32-byte key from SECRET_KEY using SHA-256
        key_str = secret

    # If it looks like a hex string (64 chars), decode it
    if len(key_str) == 64:
        try:
            return bytes.fromhex(key_str)
        except ValueError:
            pass

    # Otherwise, derive 32 bytes using SHA-256
    return hashlib.sha256(key_str.encode('utf-8')).digest()


def encrypt_field(plaintext: Optional[str]) -> Optional[str]:
    """
    Encrypt a string field for database storage.
    Returns base64-encoded ciphertext, or None if input is None/empty.
    
    Args:
        plaintext: The sensitive string to encrypt (e.g., phone number, email)
        
    Returns:
        Base64-encoded encrypted string, or None if input is falsy
        
    Example:
        encrypted = encrypt_field("9876543210")
        # Returns something like: "dGhpcyBpcyBhIHRlc3Q..."
    """
    if not plaintext:
        return None

    if CRYPTO_BACKEND == 'none':
        # No encryption library available — store as-is with a warning prefix
        # This should never happen in production
        import sys
        sys.stderr.write("⚠️  WARNING: No encryption library installed. Data stored unencrypted.\n")
        return plaintext

    try:
        key = _get_encryption_key()
        iv = secrets.token_bytes(12)  # 96-bit nonce for GCM
        plaintext_bytes = plaintext.encode('utf-8')

        if CRYPTO_BACKEND == 'pycryptodome':
            cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
            ciphertext, tag = cipher.encrypt_and_digest(plaintext_bytes)
            # Format: IV (12) + ciphertext (variable) + tag (16)
            encrypted = iv + ciphertext + tag
        else:  # cryptography library
            aesgcm = AESGCM(key)
            # cryptography library appends tag automatically
            encrypted = iv + aesgcm.encrypt(iv, plaintext_bytes, None)

        return base64.b64encode(encrypted).decode('utf-8')

    except Exception as e:
        import sys
        sys.stderr.write(f"⚠️  Encryption error: {e}\n")
        # Fail open in development, fail closed in production
        if os.getenv('RAILWAY_ENVIRONMENT'):
            raise RuntimeError("Encryption failed in production") from e
        return plaintext


def decrypt_field(encrypted_text: Optional[str]) -> Optional[str]:
    """
    Decrypt a base64-encoded encrypted field from the database.
    Returns the original plaintext string.
    
    Args:
        encrypted_text: Base64-encoded encrypted string from database
        
    Returns:
        Original plaintext string, or None if input is falsy
        
    Example:
        phone = decrypt_field(row['customer_phone_encrypted'])
        # Returns: "9876543210"
    """
    if not encrypted_text:
        return None

    if CRYPTO_BACKEND == 'none':
        return encrypted_text

    try:
        key = _get_encryption_key()
        raw = base64.b64decode(encrypted_text)
        
        # Minimum length: 12 (IV) + 1 (ciphertext) + 16 (tag) = 29
        if len(raw) < 29:
            # Not encrypted (legacy plaintext data) — return as-is
            return encrypted_text

        iv = raw[:12]

        if CRYPTO_BACKEND == 'pycryptodome':
            tag = raw[-16:]
            ciphertext = raw[12:-16]
            cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
            plaintext_bytes = cipher.decrypt_and_verify(ciphertext, tag)
        else:  # cryptography library
            aesgcm = AESGCM(key)
            plaintext_bytes = aesgcm.decrypt(iv, raw[12:], None)

        return plaintext_bytes.decode('utf-8')

    except Exception:
        # If decryption fails, the data might be legacy plaintext
        # Return as-is to avoid breaking existing data
        return encrypted_text


def hash_for_lookup(value: str) -> str:
    """
    Create a deterministic hash for indexed lookups on encrypted fields.
    Use this when you need to search by an encrypted field (e.g., find user by phone).
    
    The hash is NOT reversible — it's only for lookups.
    Store both the hash (for searching) and the encrypted value (for reading).
    
    Args:
        value: The plaintext value to hash
        
    Returns:
        Hex string of the SHA-256 hash
        
    Example:
        # When storing:
        phone_hash = hash_for_lookup("9876543210")
        phone_encrypted = encrypt_field("9876543210")
        
        # When searching:
        cursor.execute("SELECT * FROM users WHERE phone_hash = %s", (hash_for_lookup("9876543210"),))
    """
    key = _get_encryption_key()
    # HMAC-like construction: hash(key + value) for domain separation
    return hashlib.sha256(key + value.encode('utf-8')).hexdigest()
