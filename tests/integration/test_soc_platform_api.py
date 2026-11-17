"""Integration tests for 100% REAL engine-backed SOC platform endpoints.

Validates all 10 SOC endpoint groups:
1. Operator Auth & Sessions (/api/auth/login, /api/auth/session, /api/auth/logout)
2. Agent Fleet Management (/api/agents, POST, DELETE, suspend, activate)
3. Event Forensics Breakdown (/api/events/{id}/breakdown)
4. Behavioral Intelligence (/api/behavior)
5. Policy Management & Dry-Run (/api/policies, POST, PUT, DELETE, toggle, dry-run)
6. Real Incidents Aggregation (/api/incidents)
7. Cryptographic Audit Ledger (/api/audit/status, /api/audit/verify, /api/audit/logs, /api/audit/export)
8. Attack Testing & Scenarios (/api/testing/scenarios, /api/testing/run)
9. Operational Analytics (/api/analytics)
10. Dynamic System Config (/api/system/config)
11. Public & SPA Static Routes (/, /features, /architecture, /threat-lab, /docs, /login, /dashboard)
"""

from __future__ import annotations

import os

import pytest
from httpx import ASGITransport, AsyncClient

from cerberus.config import settings
from cerberus.proxy.server import app, engine


@pytest.fixture
async def client():
    """Async test client bound directly to the FastAPI server app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


# ── 1. Authentication Tests ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_auth_flow(client: AsyncClient):
    """Test operator login, session validation, and logout."""
    # 1. Login with valid operator credentials
    login_res = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "password"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["status"] == "authenticated"
    assert "token" in data
    assert data["user"]["role"] == "admin"
    token = data["token"]

    # 2. Query session info with Bearer header
    sess_res = await client.get(
        "/api/auth/session",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert sess_res.status_code == 200
    sess_data = sess_res.json()
    assert sess_data["authenticated"] is True
    assert sess_data["username"] == "admin"

    # 3. Query session without token fails with 401
    unauth_res = await client.get("/api/auth/session")
    assert unauth_res.status_code == 401

    # 4. Logout invalidates session
    logout_res = await client.post(
        "/api/auth/logout",
        json={"token": token},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "logged_out"


# ── 2. Agents Fleet Management Tests ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_agents_lifecycle(client: AsyncClient):
    """Test agent registration, scope enforcement, HMAC issuance, and quarantine toggles."""
    test_agent = "soc-test-agent-42"

    # 1. Register agent with declared scopes
    create_res = await client.post(
        "/api/agents",
        json={
            "agent_id": test_agent,
            "allowed_tools": ["read_file", "search_docs", "format_output"],
            "enforced": True,
            "ttl": 3600,
        },
    )
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["status"] == "created"
    assert created["agent_id"] == test_agent
    assert "token" in created
    assert "read_file" in created["allowed_tools"]

    # Verify real engine state
    assert test_agent in engine.scope_analyzer.agent_scopes
    assert engine.scope_analyzer.agent_enforced[test_agent] is True
    # Verify HMAC token validity
    valid, aid, _ = engine.auth_manager.verify_token(created["token"])
    assert valid is True
    assert aid == test_agent

    # 2. List agents and verify test_agent appears
    list_res = await client.get("/api/agents")
    assert list_res.status_code == 200
    agents = list_res.json()
    agent_entry = next((a for a in agents if a["agent_id"] == test_agent), None)
    assert agent_entry is not None
    assert agent_entry["enforced"] is True
    assert "read_file" in agent_entry["allowed_tools"]
    assert agent_entry["is_quarantined"] is False

    # 3. Suspend agent (quarantine)
    susp_res = await client.post(f"/api/agents/{test_agent}/suspend")
    assert susp_res.status_code == 200
    assert susp_res.json()["status"] == "suspended"
    assert test_agent in engine.quarantined_sessions

    # Verify in agents list that is_quarantined is True
    list_after_susp = (await client.get("/api/agents")).json()
    susp_entry = next(a for a in list_after_susp if a["agent_id"] == test_agent)
    assert susp_entry["is_quarantined"] is True
    assert susp_entry["status"] == "quarantined"

    # 4. Activate agent (unsuspend)
    act_res = await client.post(f"/api/agents/{test_agent}/activate")
    assert act_res.status_code == 200
    assert act_res.json()["status"] == "activated"
    assert test_agent not in engine.quarantined_sessions

    # 5. Delete agent
    del_res = await client.delete(f"/api/agents/{test_agent}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"
    assert test_agent not in engine.scope_analyzer.agent_scopes


# ── 3. Event Breakdown & Forensics Tests ──────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_event_breakdown(client: AsyncClient):
    """Test querying real event breakdown with 4-model ensemble scores and security telemetry."""
    # Process a real tool call through engine to generate an event in audit log
    session_id = "soc-forensic-sess-01"
    agent_id = "forensic-agent"

    event, _outcome = await engine.process_tool_call(
        session_id=session_id,
        agent_id=agent_id,
        tool_name="read_file",
        tool_server="fs-mcp",
        parameters={"path": "src/cerberus/proxy/server.py"},
    )
    # Ensure event logged to audit logger
    await engine.audit_logger.log_event(event)

    # Query breakdown via endpoint
    breakdown_res = await client.get(f"/api/events/{event.event_id}/breakdown")
    assert breakdown_res.status_code == 200
    bd = breakdown_res.json()
    assert bd["event_id"] == event.event_id
    assert bd["agent_id"] == agent_id
    assert bd["tool_name"] == "read_file"
    assert "model_scores" in bd
    assert "taint_lineage" in bd
    assert "canary_hit" in bd
    assert "dlp_findings" in bd

    # Non-existent event returns 404
    missing_res = await client.get("/api/events/non-existent-event-id-999/breakdown")
    assert missing_res.status_code == 404


# ── 4. Behavioral Intelligence Tests ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_behavior_intelligence(client: AsyncClient):
    """Test behavioral endpoint returning real ensemble weights, Markov matrix, and scalers."""
    # Update Markov scorer with sample transition
    engine.markov_scorer.update("read_file", "http_post")
    engine.running_scaler.update("param_size", 1024.0)

    res = await client.get("/api/behavior")
    assert res.status_code == 200
    data = res.json()

    # 1. Ensemble weights
    weights = data["ensemble_weights"]
    assert "rule" in weights
    assert "markov" in weights
    assert "isolation" in weights
    assert "transformer" in weights
    assert weights["rule"] == engine.ensemble_scorer.w_rule

    # 2. Transition matrix
    trans = data["transition_matrix"]
    assert "read_file" in trans
    assert trans["read_file"].get("http_post", 0) >= 1

    # 3. Feature scalers
    scalers = data["feature_scalers"]
    assert "param_size" in scalers
    assert scalers["param_size"]["median"] >= 0

    # 4. Baseline store summary
    b_store = data["baseline_store"]
    assert "total_agents" in b_store
    assert "base_dir" in b_store


# ── 5. Policies & Dry-Run Tests ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_policies_management_and_dry_run(client: AsyncClient):
    """Test reading, writing, toggling, deleting real Rego files and running dry-run simulation."""
    pol_name = "test_soc_guard.rego"
    rego_code = """package cerberus.test_soc

default allow = true

deny[msg] {
    input.tool_name == "banned_tool"
    msg := "Banned tool invocation detected"
}
"""

    # 1. Create Rego policy
    create_res = await client.post(
        "/api/policies",
        json={"name": pol_name, "code": rego_code},
    )
    assert create_res.status_code == 200
    assert create_res.json()["status"] == "created"

    # Verify file written to policies/
    pol_file = os.path.join("policies", pol_name)
    assert os.path.exists(pol_file)

    # 2. List policies
    list_res = await client.get("/api/policies")
    assert list_res.status_code == 200
    pols = list_res.json()
    assert any(p["name"] == pol_name for p in pols["active"])

    # 3. Update policy
    updated_code = rego_code + "\n# updated comment\n"
    put_res = await client.put(f"/api/policies/{pol_name}", json={"code": updated_code})
    assert put_res.status_code == 200
    assert put_res.json()["status"] == "updated"

    # 4. Toggle policy (disable)
    toggle_res = await client.post(f"/api/policies/{pol_name}/toggle")
    assert toggle_res.status_code == 200
    t_data = toggle_res.json()
    assert t_data["enabled"] is False
    assert os.path.exists(os.path.join("policies", f"{pol_name}.disabled"))

    # Toggle policy (re-enable)
    toggle_back = await client.post(f"/api/policies/{pol_name}.disabled/toggle")
    assert toggle_back.status_code == 200
    assert toggle_back.json()["enabled"] is True

    # 5. Dry-run simulation using engine.opa_client
    sim_res = await client.post(
        "/api/policies/dry-run",
        json={
            "event": {
                "session_id": "sim-sess",
                "agent_id": "sim-agent",
                "tool_name": "http_post",
                "tool_server": "network-mcp",
                "risk_score": 0.85,
            }
        },
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert "final_decision" in sim_data
    assert "packages" in sim_data

    # 6. Delete test policy
    del_res = await client.delete(f"/api/policies/{pol_name}")
    assert del_res.status_code == 200
    assert not os.path.exists(pol_file)


# ── 6. Incidents Aggregation Tests ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_incidents_aggregation(client: AsyncClient):
    """Test real incidents aggregation across taint, canary, dlp, and response-side alerts."""
    # Generate canary alert by tripping a honeytoken
    canary = engine.canary_detector.create_canary_api_key(
        label="test_planted_canary", prefix="CERBERUS_CANARY_soc_"
    )
    # Trigger canary detection
    engine.canary_detector.scan_string(canary.token)
    # Trigger scan_tool_call with honeytoken
    engine.canary_detector.scan_tool_call(
        session_id="incident-canary-sess",
        agent_id="attacker-agent",
        tool_name="aws_s3_upload",
        parameters={"api_key": canary.token},
    )

    res = await client.get("/api/incidents")
    assert res.status_code == 200
    incidents = res.json()
    assert isinstance(incidents, list)
    # Verify at least one canary incident was captured
    assert any(inc["type"] == "CANARY_TRIPWIRE" for inc in incidents)


# ── 7. Cryptographic Audit Ledger Tests ──────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_audit_ledger(client: AsyncClient):
    """Test real cryptographic hash chain status, integrity verification, logs, and export."""
    # 1. Audit status
    status_res = await client.get("/api/audit/status")
    assert status_res.status_code == 200
    st = status_res.json()
    assert "chain_head_hash" in st
    assert "total_entries" in st
    assert st["chain_head_hash"] == engine.audit_logger.chain_head_hash

    # 2. Cryptographic integrity verification
    verify_res = await client.post("/api/audit/verify")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert "is_valid" in v_data
    assert "total_entries" in v_data
    assert v_data["chain_head_hash"] == engine.audit_logger.chain_head_hash

    # 3. Audit logs retrieval
    logs_res = await client.get("/api/audit/logs?limit=5")
    assert logs_res.status_code == 200
    assert isinstance(logs_res.json(), list)

    # 4. Audit ledger export
    export_res = await client.get("/api/audit/export")
    assert export_res.status_code == 200
    exp = export_res.json()
    assert "records" in exp
    assert "chain_head_hash" in exp


# ── 8. Attack Testing & Scenarios Tests ───────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_testing_scenarios(client: AsyncClient):
    """Test listing scenarios and executing real multi-step tool calls through engine."""
    # 1. List scenarios
    scen_res = await client.get("/api/testing/scenarios")
    assert scen_res.status_code == 200
    scenarios = scen_res.json()
    assert len(scenarios) >= 5
    ids = [s["id"] for s in scenarios]
    assert "toxic_flow_trifecta" in ids
    assert "canary_tripwire_asi10" in ids

    # 2. Run predefined scenario
    run_res = await client.post(
        "/api/testing/run",
        json={"scenario_id": "slow_drip_exfiltration"},
    )
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["scenario_id"] == "slow_drip_exfiltration"
    assert "final_decision" in run_data
    assert "trace" in run_data
    assert len(run_data["trace"]) == 2
    assert "duration_ms" in run_data


# ── 9. Analytics & Latency Tests ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_analytics(client: AsyncClient):
    """Test real latency percentiles from metrics collector and throughput."""
    # Observe some latencies
    engine.metrics_collector.record_latency(0.0025)
    engine.metrics_collector.record_latency(0.0050)
    engine.metrics_collector.record_latency(0.0100)

    res = await client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "latency_percentiles_ms" in data
    pcts = data["latency_percentiles_ms"]
    assert "p50" in pcts
    assert "p95" in pcts
    assert "p99" in pcts
    assert "throughput" in data
    assert "benchmarks" in data


# ── 10. Dynamic System Configuration Tests ───────────────────────────────────


@pytest.mark.asyncio
async def test_soc_system_config(client: AsyncClient):
    """Test reading and dynamically updating settings on cerberus.config.settings."""
    # 1. Get current config
    get_res = await client.get("/api/system/config")
    assert get_res.status_code == 200
    cfg = get_res.json()
    assert cfg["app_name"] == "Cerberus"
    assert "fail_closed" in cfg

    # 2. Update config dynamically
    orig_rate = settings.rate_limit_per_minute
    orig_scope_mode = settings.scope_enforcement_mode
    try:
        put_res = await client.put(
            "/api/system/config",
            json={"rate_limit_per_minute": 250, "scope_enforcement_mode": "strict"},
        )
        assert put_res.status_code == 200
        put_data = put_res.json()
        assert put_data["status"] == "updated"
        assert put_data["updated_fields"]["rate_limit_per_minute"] == 250
        assert settings.rate_limit_per_minute == 250
        assert engine.scope_analyzer.mode == "strict"
    finally:
        settings.rate_limit_per_minute = orig_rate
        settings.scope_enforcement_mode = orig_scope_mode
        engine.scope_analyzer.mode = orig_scope_mode


# ── 11. Public & SPA Static Routes Tests ─────────────────────────────────────


@pytest.mark.asyncio
async def test_soc_spa_static_routes(client: AsyncClient):
    """Test all SPA static routes return HTML (index.html or root container)."""
    routes = [
        "/",
        "/features",
        "/architecture",
        "/threat-lab",
        "/docs",
        "/login",
        "/dashboard",
        "/dashboard/analytics",
        "/ui",
        "/ui/matrix",
    ]
    for r in routes:
        resp = await client.get(r)
        assert resp.status_code == 200
        assert "text/html" in resp.headers.get("content-type", "")
