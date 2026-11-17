from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import os
import secrets
import time
from collections import defaultdict, deque
from typing import Any

from cerberus.config import settings

logger = logging.getLogger("cerberus.auth")


class HMACAuthenticator:
    """Issues and verifies HMAC-SHA256 identity tokens for agents."""

    def __init__(self, secret_key: str | None = None):
        self.secret_key = (secret_key or settings.hmac_secret_key).strip()
        if not self.secret_key:
            # Auto-generate local secret key if unconfigured
            self.secret_key = self._get_or_create_key()

    def _get_or_create_key(self) -> str:
        key_file = settings.hmac_key_file_path
        if not key_file:
            log_dir = (
                os.path.dirname(os.path.abspath(settings.log_path)) if settings.log_path else "."
            )
            key_file = os.path.join(log_dir, "cerberus_hmac.key")
        if os.path.exists(key_file):
            if os.name != "nt":
                try:
                    mode = os.stat(key_file).st_mode
                    if mode & 0o077:
                        logger.warning(
                            "HMAC key file %s has overly permissive permissions (%o). "
                            "Consider running `chmod 600 %s`",
                            key_file,
                            mode & 0o777,
                            key_file,
                        )
                except OSError as e:
                    logger.debug("Failed to check key permissions: %s", e)
            with open(key_file, "r", encoding="utf-8") as f:
                key = f.read().strip()
                if key:
                    return key
        generated = secrets.token_hex(32)
        try:
            fd = os.open(key_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(generated)
            logger.info("Generated new HMAC authentication secret at %s", key_file)
        except Exception as e:
            logger.warning("Could not persist HMAC key file: %s", e)
        return generated

    def issue_token(self, agent_id: str, ttl_seconds: int = 86400) -> str:
        """Issue an HMAC-signed token with timestamp and expiry."""
        now = int(time.time())
        exp = now + ttl_seconds
        payload = f"{agent_id}.{now}.{exp}"
        signature = hmac.new(
            self.secret_key.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        raw_token = f"{payload}.{signature}"
        return base64.urlsafe_b64encode(raw_token.encode("utf-8")).decode("ascii")

    def verify_token(self, token: str) -> tuple[bool, str, str]:
        """Verify token authenticity and freshness.

        Returns:
            (is_valid, agent_id, reason)
        """
        if not token:
            return False, "", "Missing authentication token"

        try:
            decoded = base64.urlsafe_b64decode(token.strip().encode("ascii")).decode("utf-8")
            parts = decoded.split(".")
            if len(parts) != 4:
                return False, "", "Malformed token structure"

            agent_id, ts_str, exp_str, signature = parts
            exp = int(exp_str)

            # Recompute expected signature
            payload = f"{agent_id}.{ts_str}.{exp_str}"
            expected_sig = hmac.new(
                self.secret_key.encode("utf-8"),
                payload.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_sig):
                return False, agent_id, "Invalid HMAC signature"

            if time.time() > exp:
                return False, agent_id, "Token expired"

            return True, agent_id, "Token verified"

        except Exception as e:
            return False, "", f"Token verification error: {e}"


class TenantRateLimiter:
    """Sliding-window per-tenant call rate limiter."""

    def __init__(self, default_limit: int | None = None):
        self.default_limit = default_limit or settings.rate_limit_per_minute
        # agent_id -> deque of timestamps in seconds
        self._call_history: dict[str, deque[float]] = defaultdict(deque)

    def check_rate_limit(
        self, agent_id: str, custom_limit: int | None = None
    ) -> tuple[bool, int, float]:
        """Check if an agent call is within rate quota.

        Returns:
            (allowed, remaining_quota, reset_seconds)
        """
        limit = custom_limit or self.default_limit
        now = time.time()
        window_start = now - 60.0
        q = self._call_history[agent_id]

        # Evict timestamps older than 60s
        while q and q[0] < window_start:
            q.popleft()

        if len(q) >= limit:
            oldest = q[0]
            reset_seconds = max(0.0, 60.0 - (now - oldest))
            return False, 0, round(reset_seconds, 2)

        q.append(now)
        remaining = max(0, limit - len(q))
        return True, remaining, 0.0


class AdminAuthManager:
    """Manages SecOps operator authentication, credential validation, and session tokens."""

    def __init__(self, secret_key: str | None = None, session_ttl_seconds: int = 86400):
        self.secret_key = (secret_key or settings.hmac_secret_key).strip()
        if not self.secret_key:
            self.secret_key = secrets.token_hex(32)
        self.session_ttl_seconds = session_ttl_seconds
        # Active sessions: session_id -> session_dict
        self._sessions: dict[str, dict[str, Any]] = {}
        # Pre-configured operator profiles
        self._operators: dict[str, dict[str, Any]] = {
            "admin": {
                "operator_id": "op-admin",
                "username": "admin",
                "role": "admin",
                "permissions": ["*"],
            },
            "operator": {
                "operator_id": "op-secops",
                "username": "operator",
                "role": "secops_analyst",
                "permissions": [
                    "read",
                    "investigate",
                    "resolve_challenge",
                    "simulate_policy",
                ],
            },
            "secops": {
                "operator_id": "op-secops-01",
                "username": "secops",
                "role": "secops_admin",
                "permissions": ["*"],
            },
        }

    def validate_credentials(
        self, username: str, password: str | None = None, token: str | None = None
    ) -> tuple[bool, dict[str, Any] | None, str]:
        """Validates operator credentials against configured settings or default accounts.

        Returns:
            (is_valid, operator_info, reason)
        """
        username_clean = (username or "").strip()
        pwd_clean = (password or "").strip()
        tok_clean = (token or "").strip()

        # If admin_api_token is configured, check token match
        configured_admin_token = settings.admin_api_token.strip()
        if configured_admin_token:
            if tok_clean and hmac.compare_digest(tok_clean, configured_admin_token):
                op = self._operators.get(username_clean) or {
                    "operator_id": f"op-{username_clean or 'admin'}",
                    "username": username_clean or "admin",
                    "role": "admin",
                    "permissions": ["*"],
                }
                return True, op, "Authenticated via admin token"
            if pwd_clean and hmac.compare_digest(pwd_clean, configured_admin_token):
                op = self._operators.get(username_clean) or {
                    "operator_id": f"op-{username_clean or 'admin'}",
                    "username": username_clean or "admin",
                    "role": "admin",
                    "permissions": ["*"],
                }
                return True, op, "Authenticated via admin password"

        # Check default operator credentials (admin/admin, admin/cerberus, operator/cerberus, secops/cerberus)
        valid_passwords = {"cerberus", "admin", "password", "secops"}
        if username_clean in self._operators:
            if not pwd_clean and not tok_clean and not configured_admin_token:
                return True, self._operators[username_clean], "Authenticated default operator"
            if pwd_clean in valid_passwords or pwd_clean == username_clean:
                return (
                    True,
                    self._operators[username_clean],
                    "Authenticated via operator credentials",
                )
            if tok_clean in valid_passwords:
                return True, self._operators[username_clean], "Authenticated via operator token"

        # Direct token as username or bearer
        if configured_admin_token and (
            hmac.compare_digest(username_clean, configured_admin_token)
            or (tok_clean and hmac.compare_digest(tok_clean, configured_admin_token))
        ):
            return (
                True,
                {
                    "operator_id": "op-token-admin",
                    "username": "admin",
                    "role": "admin",
                    "permissions": ["*"],
                },
                "Authenticated via direct admin token",
            )

        # Allow dev fallback if no admin token is configured and credentials provided
        if not configured_admin_token and username_clean:
            op = {
                "operator_id": f"op-{username_clean}",
                "username": username_clean,
                "role": "admin",
                "permissions": ["*"],
            }
            return True, op, "Authenticated in dev mode"

        return False, None, "Invalid operator credentials"

    def issue_session(
        self,
        operator_info: dict[str, Any],
        ttl_seconds: int | None = None,
    ) -> tuple[str, dict[str, Any]]:
        """Issues an HMAC-signed session token containing operator metadata."""
        ttl = ttl_seconds if ttl_seconds is not None else self.session_ttl_seconds
        now = int(time.time())
        exp = now + ttl
        session_id = f"sess_{secrets.token_hex(16)}"
        op_id = operator_info.get("operator_id", "op-unknown")
        role = operator_info.get("role", "admin")
        username = operator_info.get("username", "admin")
        perms = operator_info.get("permissions", ["*"])

        # Format: v1.sess.{session_id}.{op_id}.{now}.{exp}.{signature}
        payload = f"{session_id}.{op_id}.{now}.{exp}"
        signature = hmac.new(
            self.secret_key.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        raw_token = f"v1.sess.{payload}.{signature}"
        token = base64.urlsafe_b64encode(raw_token.encode("utf-8")).decode("ascii")

        session_record = {
            "session_id": session_id,
            "operator_id": op_id,
            "username": username,
            "role": role,
            "permissions": perms,
            "issued_at": now,
            "expires_at": exp,
            "token": token,
        }
        self._sessions[session_id] = session_record
        return token, session_record

    def verify_session(self, token: str) -> tuple[bool, dict[str, Any] | None, str]:
        """Verify an operator session token.

        Returns:
            (is_valid, session_record, reason)
        """
        if not token:
            return False, None, "Missing session token"

        # Check if it's the direct admin_api_token
        if settings.admin_api_token and hmac.compare_digest(
            token.strip(), settings.admin_api_token.strip()
        ):
            now = int(time.time())
            return (
                True,
                {
                    "session_id": "direct_admin_token",
                    "operator_id": "op-admin-token",
                    "username": "admin",
                    "role": "admin",
                    "permissions": ["*"],
                    "issued_at": now,
                    "expires_at": now + 86400,
                },
                "Verified admin API token",
            )

        try:
            decoded = base64.urlsafe_b64decode(token.strip().encode("ascii")).decode("utf-8")
            parts = decoded.split(".")
            if len(parts) != 7 or parts[0] != "v1" or parts[1] != "sess":
                return False, None, "Malformed session token structure"

            _, _, session_id, op_id, ts_str, exp_str, signature = parts
            exp = int(exp_str)

            # Recompute expected signature
            payload = f"{session_id}.{op_id}.{ts_str}.{exp_str}"
            expected_sig = hmac.new(
                self.secret_key.encode("utf-8"),
                payload.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_sig):
                return False, None, "Invalid session HMAC signature"

            if time.time() > exp:
                return False, None, "Session token expired"

            stored = self._sessions.get(session_id)
            if stored:
                return True, stored, "Session active"

            # Valid cryptographically even if memory cleared (stateless JWT style)
            now = int(time.time())
            return (
                True,
                {
                    "session_id": session_id,
                    "operator_id": op_id,
                    "username": op_id.replace("op-", ""),
                    "role": "admin",
                    "permissions": ["*"],
                    "issued_at": int(ts_str),
                    "expires_at": exp,
                },
                "Session signature verified",
            )

        except Exception as e:
            return False, None, f"Session verification error: {e}"

    def revoke_session(self, token: str) -> bool:
        """Revoke an active session."""
        try:
            decoded = base64.urlsafe_b64decode(token.strip().encode("ascii")).decode("utf-8")
            parts = decoded.split(".")
            if len(parts) >= 3:
                session_id = parts[2]
                return self._sessions.pop(session_id, None) is not None
        except Exception as e:
            logger.debug(f"Failed to revoke session token: {e}")
        return False
