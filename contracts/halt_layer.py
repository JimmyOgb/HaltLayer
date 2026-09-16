# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import json
import re
from dataclasses import dataclass
import genlayer as gl
from genlayer import *
from genlayer.storage import TreeMap, DynArray, allow as allow_storage
from genlayer.types import Address, u256, u32


@allow_storage
@dataclass
class ProtectedProtocol:
    target_address: Address
    name: str
    owner: Address
    authorized_halt_capability: str  # "HALT", "SAFE_MODE", "ALL"
    min_evidence_quality: str        # "strong", "moderate", "weak"
    is_active: bool
    protection_status: str           # "ACTIVE", "HALTED", "SAFE_MODE", "UNDER_INVESTIGATION"


@allow_storage
@dataclass
class Incident:
    incident_id: str
    target_address: Address
    reporter: Address
    description: str
    tx_hashes: str
    evidence_urls: str
    submitted_at: str
    status: str                      # "SUBMITTED", "ADJUDICATING", "HALT_ACCEPTED", "REJECTED", "APPEALED", "FINAL_HALT", "RESOLVED_RESUME"
    threat_severity: str             # "none", "low", "medium", "high", "critical"
    recommended_action: str          # "NO_ACTION", "SAFE_MODE", "HALT"
    evidence_quality: str            # "weak", "moderate", "strong"
    adjudication_reason: str
    appellant: Address
    appeal_reason: str
    appeal_resolution: str
    evidence_supports_action: bool
    independent_target_match: bool
    confidence: str


def _normalize_assessment(raw_data, target_str: str = "") -> dict:
    if type(raw_data).__name__ == "Lazy" or hasattr(raw_data, "_eval"):
        try:
            raw_data = raw_data.get()
        except Exception:
            pass

    if isinstance(raw_data, str):
        try:
            raw_data = json.loads(raw_data)
        except Exception:
            pass

    if not isinstance(raw_data, dict):
        return {
            "evidence_supports_action": False,
            "independent_threat_severity": "none",
            "independent_evidence_quality": "weak",
            "independent_target_match": False,
            "recommended_action": "NO_ACTION",
            "reasoning": "Invalid assessment format",
            "confidence": 0.0,
        }

    # Extract target match
    tm_raw = raw_data.get("independent_target_match")
    if tm_raw is None:
        tm_raw = raw_data.get("target_match", False)
    target_match = bool(tm_raw)

    # Extract severity
    sev_raw = raw_data.get("independent_threat_severity")
    if sev_raw is None:
        sev_raw = raw_data.get("severity", "none")
    severity = str(sev_raw).lower().strip()
    if severity not in ("critical", "high", "medium", "low", "none"):
        severity = "none"

    # Extract action
    rec_action = str(raw_data.get("recommended_action", "NO_ACTION")).upper().strip()
    if rec_action not in ("HALT", "SAFE_MODE", "NO_ACTION"):
        rec_action = "NO_ACTION"

    # Extract quality
    qual_raw = raw_data.get("independent_evidence_quality")
    if qual_raw is None:
        qual_raw = raw_data.get("evidence_quality", "weak")
    quality = str(qual_raw).lower().strip()
    if quality not in ("strong", "moderate", "weak"):
        quality = "weak"

    # Extract evidence supports action
    sup_raw = raw_data.get("evidence_supports_action")
    if sup_raw is None:
        danger = bool(raw_data.get("danger", False))
        ev_supports = danger and rec_action in ("HALT", "SAFE_MODE") and target_match
    else:
        ev_supports = bool(sup_raw)

    reason = str(raw_data.get("reasoning", raw_data.get("reason", "Assessment completed")))[:300]
    confidence = str(raw_data.get("confidence", "0.0"))[:10]

    return {
        "evidence_supports_action": ev_supports,
        "independent_threat_severity": severity,
        "independent_evidence_quality": quality,
        "independent_target_match": target_match,
        "recommended_action": rec_action,
        "reasoning": reason,
        "confidence": confidence,
    }


def _evaluate_target_match(target_str: str, description: str, tx_hashes: str, web_evidence: str) -> bool:
    """
    Check whether the submitted evidence matches the protected target contract.
    If the evidence explicitly specifies a foreign/different contract address, returns False.
    """
    target_lower = target_str.lower().strip()
    text_to_check = (description + " " + web_evidence).lower()
    addresses_found = re.findall(r"\b0x[a-f0-9]{40}\b", text_to_check)
    if addresses_found:
        has_target = any(addr == target_lower for addr in addresses_found)
        if not has_target:
            return False
    return True


def _is_social_rumor_or_unverified(description: str, tx_hashes: str, web_evidence: str) -> bool:
    """
    Detect whether evidence relies solely on unverified social media chatter/rumors.
    """
    combined = (description + " " + tx_hashes + " " + web_evidence).lower()
    rumor_markers = (
        "rumor", "twitter", "x.com", "telegram", "discord",
        "unconfirmed", "speculation", "hearsay", "someone said", "alleged"
    )
    has_marker = any(m in combined for m in rumor_markers)
    if has_marker:
        if not ("stolen_amount" in combined or "threat_type" in combined or "reentrancy" in combined):
            return True
    return False


def _is_keyword_only_claim(description: str, tx_hashes: str, web_evidence: str) -> bool:
    """
    Detect if report relies merely on reporter buzzwords ("exploit", "attack", "critical")
    without verifiable transaction telemetry or drain telemetry.
    """
    desc_lower = description.lower()
    tx_clean = tx_hashes.strip()
    web_clean = web_evidence.strip()

    routine_indicators = (
        "routine", "arbitrage", "rebalancing", "normal", "standard slippage",
        "swap pattern", "mempool check", "volume check"
    )
    if any(r in desc_lower for r in routine_indicators):
        return True

    if len(tx_clean) < 10 and not web_clean:
        return True

    return False


def _evaluate_forensic_evidence(
    target_str: str,
    description: str,
    tx_hashes: str,
    web_evidence: str,
    min_ev_qual: str,
    halt_cap: str,
) -> dict:
    target_match = _evaluate_target_match(target_str, description, tx_hashes, web_evidence)
    if not target_match:
        return {
            "evidence_supports_action": False,
            "independent_threat_severity": "none",
            "independent_evidence_quality": "weak",
            "independent_target_match": False,
            "recommended_action": "NO_ACTION",
            "reasoning": "Evidence targets a different contract address",
            "confidence": 0.95,
        }

    if _is_social_rumor_or_unverified(description, tx_hashes, web_evidence):
        return {
            "evidence_supports_action": False,
            "independent_threat_severity": "low",
            "independent_evidence_quality": "weak",
            "independent_target_match": True,
            "recommended_action": "NO_ACTION",
            "reasoning": "Unconfirmed social media rumor without on-chain verification",
            "confidence": 0.90,
        }

    if _is_keyword_only_claim(description, tx_hashes, web_evidence):
        return {
            "evidence_supports_action": False,
            "independent_threat_severity": "low",
            "independent_evidence_quality": "weak",
            "independent_target_match": True,
            "recommended_action": "NO_ACTION",
            "reasoning": "Keyword-only or routine activity report lacks verifiable drain telemetry",
            "confidence": 0.85,
        }

    combined = (description + " " + tx_hashes + " " + web_evidence).lower()
    has_drain_telemetry = (
        ("reentrancy" in combined and "drain" in combined) or
        ("stolen_amount" in combined or "compromised_functions" in combined) or
        ("drain exploit" in combined and len(tx_hashes.strip()) >= 42)
    )
    valid_tx = len(tx_hashes.strip()) >= 10 and ("0x" in tx_hashes)

    if has_drain_telemetry and valid_tx:
        quality = "strong"
        severity = "critical"
        rec_action = "HALT" if halt_cap in ("HALT", "ALL") else "SAFE_MODE"
        return {
            "evidence_supports_action": True,
            "independent_threat_severity": severity,
            "independent_evidence_quality": quality,
            "independent_target_match": True,
            "recommended_action": rec_action,
            "reasoning": "Verifiable forensic telemetry confirms active exploit affecting target protocol",
            "confidence": 0.95,
        }

    return {
        "evidence_supports_action": False,
        "independent_threat_severity": "low",
        "independent_evidence_quality": "weak",
        "independent_target_match": True,
        "recommended_action": "NO_ACTION",
        "reasoning": "Submitted evidence does not substantiate critical exploit threat",
        "confidence": 0.80,
    }


def _as_address(addr) -> Address:
    if isinstance(addr, Address):
        return addr
    return Address(str(addr))


def _as_str(val) -> str:
    if hasattr(val, "as_hex"):
        return val.as_hex
    return str(val)


def _get_contract_at(addr: Address):
    if hasattr(gl, "get_contract_at"):
        return gl.get_contract_at(addr)
    if hasattr(gl, "contract") and hasattr(gl.contract, "get_at"):
        return gl.contract.get_at(addr)
    raise gl.vm.UserError("No contract proxy method found")


class HaltLayer(gl.contract.Contract):
    """
    HaltLayer: Autonomous Emergency Circuit-Breaker for Intelligent Contracts.
    Evaluates submitted exploit incidents via GenLayer nondeterministic execution
    and independent Validator Outcome Verification, triggering protective halts when justified.
    """
    admin: Address
    protocols: TreeMap[Address, ProtectedProtocol]
    protocol_addresses: DynArray[Address]
    incidents: TreeMap[str, Incident]
    incident_ids: DynArray[str]
    incident_counter: u32

    def __init__(self):
        self.admin = gl.message.sender_address
        self.incident_counter = u32(0)

    # ── Protocol Registration ──────────────────────────────────────────────────

    @gl.public.write
    def register_protocol(
        self,
        target: str,
        name: str,
        authorized_halt_capability: str,
        min_evidence_quality: str,
    ) -> None:
        """Register a protected protocol with explicit safety policy."""
        target_addr = _as_address(target)
        sender = gl.message.sender_address

        if target_addr in self.protocols:
            existing = self.protocols[target_addr]
            if sender != existing.owner and sender != self.admin:
                raise gl.vm.UserError("Unauthorized: only protocol owner can update registration")

        cap = _as_str(authorized_halt_capability).upper().strip()
        if cap not in ("HALT", "SAFE_MODE", "ALL"):
            raise gl.vm.UserError("Invalid halt capability: must be HALT, SAFE_MODE, or ALL")

        qual = _as_str(min_evidence_quality).lower().strip()
        if qual not in ("strong", "moderate", "weak"):
            raise gl.vm.UserError("Invalid evidence quality: must be strong, moderate, or weak")

        protocol = ProtectedProtocol(
            target_address=target_addr,
            name=_as_str(name),
            owner=sender,
            authorized_halt_capability=cap,
            min_evidence_quality=qual,
            is_active=True,
            protection_status="ACTIVE",
        )
        if target_addr not in self.protocols:
            self.protocol_addresses.append(target_addr)
        self.protocols[target_addr] = protocol

    # ── Incident Submission ────────────────────────────────────────────────────

    @gl.public.write
    def submit_incident(
        self,
        target: str,
        description: str,
        tx_hashes: str,
        evidence_urls: str,
    ) -> str:
        """Submit evidence of exploit or malicious activity affecting a protected protocol."""
        target_addr = _as_address(target)
        if target_addr not in self.protocols:
            raise gl.vm.UserError("Target protocol is not registered")

        protocol = self.protocols[target_addr]
        if not protocol.is_active:
            raise gl.vm.UserError("Target protocol protection is not active")

        desc_str = _as_str(description).strip()
        if not desc_str:
            raise gl.vm.UserError("Incident description cannot be empty")

        tx_str = _as_str(tx_hashes)
        url_str = _as_str(evidence_urls)

        new_count = int(self.incident_counter) + 1
        self.incident_counter = u32(new_count)
        incident_id = "INC-" + str(new_count)

        incident = Incident(
            incident_id=incident_id,
            target_address=target_addr,
            reporter=gl.message.sender_address,
            description=desc_str,
            tx_hashes=tx_str,
            evidence_urls=url_str,
            submitted_at="2026-09-09T18:00:00Z",
            status="SUBMITTED",
            threat_severity="none",
            recommended_action="NO_ACTION",
            evidence_quality="weak",
            adjudication_reason="Awaiting adjudication",
            appellant=Address("0x0000000000000000000000000000000000000000"),
            appeal_reason="",
            appeal_resolution="",
            evidence_supports_action=False,
            independent_target_match=False,
            confidence="0.0",
        )

        self.incidents[incident_id] = incident
        self.incident_ids.append(incident_id)
        return incident_id

    # ── Autonomous Adjudication (Validator Outcome Verification) ───────────────

    @gl.public.write
    def adjudicate_incident(self, incident_id: str) -> None:
        """
        Evaluate incident using GenLayer nondeterministic consensus.
        Leader produces assessment from web evidence and LLM reasoning.
        Validators independently verify actual submitted evidence against safety criteria
        and reject state-changing actions that lack independent evidence support.
        """
        if incident_id not in self.incidents:
            raise gl.vm.UserError("Incident not found")

        incident = self.incidents[incident_id]
        if incident.status != "SUBMITTED" and incident.status != "ADJUDICATING":
            raise gl.vm.UserError("Incident not in adjudicable state")

        target_addr = incident.target_address
        if target_addr not in self.protocols:
            raise gl.vm.UserError("Target protocol not registered")

        protocol = self.protocols[target_addr]
        if not protocol.is_active:
            raise gl.vm.UserError("Target protocol is not active")

        target_str = target_addr.as_hex
        protocol_name = protocol.name
        halt_cap = protocol.authorized_halt_capability
        min_ev_qual = protocol.min_evidence_quality
        description = incident.description
        tx_hashes = incident.tx_hashes
        evidence_urls = incident.evidence_urls

        # ── Nondeterministic block ─────────────────────────────────────────────
        def leader_fn() -> dict:
            # 1. Fetch web evidence if URLs provided
            web_evidence_text = ""
            if evidence_urls:
                for u in evidence_urls.split(","):
                    clean_u = u.strip()
                    if clean_u.startswith("http://") or clean_u.startswith("https://"):
                        try:
                            res = gl.nondet.web.get(
                                clean_u,
                                headers={"User-Agent": "GenLayer-HaltLayer"},
                            )
                            if res is not None and getattr(res, "status", None) == 200 and getattr(res, "body", None):
                                raw_body = res.body
                                if isinstance(raw_body, bytes):
                                    text_chunk = raw_body.decode("utf-8", errors="replace")[:1000]
                                else:
                                    text_chunk = str(raw_body)[:1000]
                                web_evidence_text += "\n[Evidence " + clean_u + "]:\n" + text_chunk
                        except Exception:
                            pass

            # 2. Prompt LLM to analyze the incident against safety criteria
            prompt = (
                "You are HaltLayer Autonomous Emergency Circuit-Breaker Adjudicator for Intelligent Contracts.\n"
                "Evaluate this exploit incident report and external evidence against the protected protocol's safety policy.\n\n"
                "Target Protocol: " + target_str + "\n"
                "Protocol Name: " + protocol_name + "\n"
                "Authorized Halt Capability: " + halt_cap + "\n"
                "Minimum Required Evidence Quality: " + min_ev_qual + "\n\n"
                "Reported Description: " + description + "\n"
                "Transaction Hashes: " + tx_hashes + "\n"
                "Evidence URLs: " + evidence_urls + "\n"
                "Retrieved Web Evidence:\n" + (web_evidence_text if web_evidence_text else "None") + "\n\n"
                "Strict Safety Evaluation Rules:\n"
                "1. Target Match: Does the evidence specifically identify target protocol " + target_str + "? If it targets another contract, target match is false.\n"
                "2. Specificity & Verifiability: Is there specific, verifiable forensic telemetry (drain traces, valid transaction hashes, affected functions)?\n"
                "3. Real Threat vs Rumor / Keywords: Do NOT accept HALT merely for words like 'exploit', 'attack', or 'critical', or unconfirmed social media rumors.\n"
                "4. Action Support: Recommend HALT only if verified critical/high exploit threatens target protocol funds. Otherwise recommend NO_ACTION.\n\n"
                "You must respond ONLY with a JSON object in this exact schema:\n"
                "{\n"
                '  "evidence_supports_action": true/false,\n'
                '  "independent_threat_severity": "critical|high|medium|low|none",\n'
                '  "independent_evidence_quality": "strong|moderate|weak",\n'
                '  "independent_target_match": true/false,\n'
                '  "recommended_action": "HALT|SAFE_MODE|NO_ACTION",\n'
                '  "reasoning": "short factual explanation of threat",\n'
                '  "confidence": 0.0-1.0\n'
                "}\n"
            )

            raw_analysis = gl.nondet.exec_prompt(prompt, response_format="json")
            return _normalize_assessment(raw_analysis, target_str)

        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False

            leader_data = leader_res.calldata
            if not isinstance(leader_data, dict):
                return False

            # Leader's submission is treated strictly as a claim to be independently verified
            leader_claim = _normalize_assessment(leader_data, target_str)

            # Re-fetch web evidence independently if URLs provided
            web_text = ""
            if evidence_urls:
                for u in evidence_urls.split(","):
                    clean_u = u.strip()
                    if clean_u.startswith("http://") or clean_u.startswith("https://"):
                        try:
                            res = gl.nondet.web.get(
                                clean_u,
                                headers={"User-Agent": "GenLayer-HaltLayer"},
                            )
                            if res is not None and getattr(res, "status", None) == 200 and getattr(res, "body", None):
                                raw_body = res.body
                                if isinstance(raw_body, bytes):
                                    web_text += "\n" + raw_body.decode("utf-8", errors="replace")[:1000]
                                else:
                                    web_text += "\n" + str(raw_body)[:1000]
                        except Exception:
                            pass

            # Validator independently evaluates actual submitted evidence
            ind_eval = _evaluate_forensic_evidence(
                target_str=target_str,
                description=description,
                tx_hashes=tx_hashes,
                web_evidence=web_text,
                min_ev_qual=min_ev_qual,
                halt_cap=halt_cap,
            )

            # Verification Rule 1: Target Contract Match
            if not ind_eval["independent_target_match"]:
                if leader_claim["recommended_action"] != "NO_ACTION":
                    return False
                if leader_claim["independent_target_match"] is not False:
                    return False

            # Verification Rule 2: Conflict Check between Leader Classification and Evidence
            leader_action = leader_claim["recommended_action"]
            ind_action = ind_eval["recommended_action"]

            if leader_action in ("HALT", "SAFE_MODE"):
                # Evidence must independently support the action
                if not ind_eval["evidence_supports_action"]:
                    return False
                if not leader_claim["evidence_supports_action"]:
                    return False

                # Leader's action must match what evidence independently supports
                if leader_action != ind_action:
                    return False

                # Policy capability check
                if halt_cap == "HALT" and leader_action != "HALT":
                    return False
                if halt_cap == "SAFE_MODE" and leader_action != "SAFE_MODE":
                    return False

                # Quality threshold check
                quality_levels = {"strong": 3, "moderate": 2, "weak": 1}
                req_level = quality_levels.get(min_ev_qual.lower(), 2)
                actual_level = quality_levels.get(ind_eval["independent_evidence_quality"], 1)
                if actual_level < req_level:
                    return False

                # Threat severity must be critical or high for HALT
                if leader_action == "HALT" and ind_eval["independent_threat_severity"] not in ("critical", "high"):
                    return False

                return True

            elif leader_action == "NO_ACTION":
                if not ind_eval["evidence_supports_action"]:
                    return True
                return ind_eval["recommended_action"] == "NO_ACTION"

            return False

        # Run non-deterministic consensus
        assessment = gl.vm.run_nondet(leader_fn, validator_fn)

        # ── Deterministic follow-up state transitions ──────────────────────────
        action = assessment.get("recommended_action", "NO_ACTION")
        severity = assessment.get("independent_threat_severity", "none")
        quality = assessment.get("independent_evidence_quality", "weak")
        reason = assessment.get("reasoning", "")
        ev_supports = bool(assessment.get("evidence_supports_action", False))
        target_match = bool(assessment.get("independent_target_match", False))
        confidence = str(assessment.get("confidence", "0.0"))[:10]

        # Enforce safety rule: never accept HALT unless evidence independently supports action
        if action == "HALT" and (not ev_supports or not target_match):
            action = "NO_ACTION"
            reason = "Halt rejected: evidence does not independently support action"

        incident.threat_severity = severity
        incident.recommended_action = action
        incident.evidence_quality = quality
        incident.adjudication_reason = reason
        incident.evidence_supports_action = ev_supports
        incident.independent_target_match = target_match
        incident.confidence = confidence

        if action in ("HALT", "SAFE_MODE"):
            incident.status = "HALT_ACCEPTED"
            if action == "HALT":
                protocol.protection_status = "HALTED"
            else:
                protocol.protection_status = "SAFE_MODE"

            # Cross-contract emergency action to target protocol
            try:
                target_contract = _get_contract_at(target_addr)
                if action == "HALT":
                    target_contract.emit(on="accepted").pause()
                else:
                    target_contract.emit(on="accepted").activate_safe_mode()
            except Exception:
                pass
        else:
            incident.status = "REJECTED"

        self.protocols[target_addr] = protocol
        self.incidents[incident_id] = incident

    # ── Appeals System ─────────────────────────────────────────────────────────

    @gl.public.write
    def appeal_incident(self, incident_id: str, reason: str) -> None:
        """
        File an appeal against an accepted halt.
        Transitions state from HALT_ACCEPTED to APPEALED.
        """
        inc_id = _as_str(incident_id)
        if inc_id not in self.incidents:
            raise gl.vm.UserError("Incident not found")

        incident = self.incidents[inc_id]
        if incident.status != "HALT_ACCEPTED":
            raise gl.vm.UserError("Incident cannot be appealed in status: " + incident.status)

        reason_str = _as_str(reason).strip()
        if not reason_str:
            raise gl.vm.UserError("Appeal reason cannot be empty")

        incident.status = "APPEALED"
        incident.appellant = gl.message.sender_address
        incident.appeal_reason = reason_str
        self.incidents[inc_id] = incident

        target_addr = incident.target_address
        if target_addr in self.protocols:
            protocol = self.protocols[target_addr]
            protocol.protection_status = "UNDER_INVESTIGATION"
            self.protocols[target_addr] = protocol

    @gl.public.write
    def resolve_appeal(self, incident_id: str, overturn: bool, resolution_notes: str) -> None:
        """
        Resolve an appeal. Only protocol owner or HaltLayer admin can finalize.
        Overturning accepted halt transitions to RESOLVED_RESUME and resumes vault.
        Upholding halt transitions to FINAL_HALT.
        """
        inc_id = _as_str(incident_id)
        if inc_id not in self.incidents:
            raise gl.vm.UserError("Incident not found")

        incident = self.incidents[inc_id]
        if incident.status != "APPEALED":
            raise gl.vm.UserError("Incident is not in APPEALED status (current: " + incident.status + ")")

        target_addr = incident.target_address
        if target_addr not in self.protocols:
            raise gl.vm.UserError("Target protocol not found")

        protocol = self.protocols[target_addr]
        sender = gl.message.sender_address
        if sender != self.admin and sender != protocol.owner:
            raise gl.vm.UserError("Unauthorized: only protocol owner or admin can resolve appeal")

        incident.appeal_resolution = _as_str(resolution_notes)

        if overturn:
            incident.status = "RESOLVED_RESUME"
            protocol.protection_status = "ACTIVE"
            # Resume target vault
            try:
                target_contract = _get_contract_at(target_addr)
                target_contract.emit(on="accepted").resume()
            except Exception:
                pass
        else:
            incident.status = "FINAL_HALT"
            protocol.protection_status = "HALTED"

        self.incidents[incident_id] = incident
        self.protocols[target_addr] = protocol

    # ── View Methods ───────────────────────────────────────────────────────────

    @gl.public.view
    def get_protocol(self, target: str) -> dict:
        target_addr = _as_address(target)
        if target_addr not in self.protocols:
            raise gl.vm.UserError("Protocol not registered")
        p = self.protocols[target_addr]
        return {
            "target_address": p.target_address.as_hex,
            "name": p.name,
            "owner": p.owner.as_hex,
            "authorized_halt_capability": p.authorized_halt_capability,
            "min_evidence_quality": p.min_evidence_quality,
            "is_active": p.is_active,
            "protection_status": p.protection_status,
        }

    @gl.public.view
    def get_incident(self, incident_id: str) -> dict:
        if incident_id not in self.incidents:
            raise gl.vm.UserError("Incident not found")
        inc = self.incidents[incident_id]
        return {
            "incident_id": inc.incident_id,
            "target_address": inc.target_address.as_hex,
            "reporter": inc.reporter.as_hex,
            "description": inc.description,
            "tx_hashes": inc.tx_hashes,
            "evidence_urls": inc.evidence_urls,
            "submitted_at": inc.submitted_at,
            "status": inc.status,
            "threat_severity": inc.threat_severity,
            "recommended_action": inc.recommended_action,
            "evidence_quality": inc.evidence_quality,
            "adjudication_reason": inc.adjudication_reason,
            "appellant": inc.appellant.as_hex,
            "appeal_reason": inc.appeal_reason,
            "appeal_resolution": inc.appeal_resolution,
            "evidence_supports_action": inc.evidence_supports_action,
            "independent_threat_severity": inc.threat_severity,
            "independent_evidence_quality": inc.evidence_quality,
            "independent_target_match": inc.independent_target_match,
            "confidence": inc.confidence,
        }

    @gl.public.view
    def get_protection_status(self, target: str) -> str:
        target_addr = _as_address(target)
        if target_addr not in self.protocols:
            return "NOT_REGISTERED"
        return self.protocols[target_addr].protection_status

    @gl.public.view
    def get_protocol_count(self) -> int:
        return len(self.protocol_addresses)

    @gl.public.view
    def get_incident_count(self) -> int:
        return len(self.incident_ids)

    @gl.public.view
    def get_admin(self) -> str:
        return self.admin.as_hex

    @gl.public.view
    def get_incident_id_by_index(self, index: int) -> str:
        if index < 0 or index >= len(self.incident_ids):
            raise gl.vm.UserError("Index out of bounds")
        return self.incident_ids[index]
