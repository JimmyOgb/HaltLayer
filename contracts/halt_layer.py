# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import json
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


def _normalize_assessment(raw_data: dict, target_str: str) -> dict:
    if not isinstance(raw_data, dict):
        return {
            "danger": False,
            "severity": "none",
            "recommended_action": "NO_ACTION",
            "evidence_quality": "weak",
            "target_match": False,
            "reason": "Invalid LLM response format",
        }
    danger = bool(raw_data.get("danger", False))
    severity = str(raw_data.get("severity", "none")).lower().strip()
    if severity not in ("critical", "high", "medium", "low", "none"):
        severity = "none"

    rec_action = str(raw_data.get("recommended_action", "NO_ACTION")).upper().strip()
    if rec_action not in ("HALT", "SAFE_MODE", "NO_ACTION"):
        rec_action = "NO_ACTION"

    quality = str(raw_data.get("evidence_quality", "weak")).lower().strip()
    if quality not in ("strong", "moderate", "weak"):
        quality = "weak"

    target_match = bool(raw_data.get("target_match", True))
    reason = str(raw_data.get("reason", "Assessment completed"))[:300]

    return {
        "danger": danger,
        "severity": severity,
        "recommended_action": rec_action,
        "evidence_quality": quality,
        "target_match": target_match,
        "reason": reason,
    }


def _has_exploit_indicators(description: str, tx_hashes: str, web_evidence: str) -> bool:
    combined = (description + " " + tx_hashes + " " + web_evidence).lower()
    indicators = (
        "exploit", "drain", "reentrancy", "unauthorized", "malicious",
        "hack", "theft", "vulnerability", "overflow", "compromised",
        "flash loan", "flashloan", "insolvent", "anomaly", "abnormal", "attack"
    )
    for ind in indicators:
        if ind in combined:
            return True
    return False


def _as_address(addr) -> Address:
    if isinstance(addr, Address):
        return addr
    return Address(str(addr))


def _as_str(val) -> str:
    if hasattr(val, "as_hex"):
        return val.as_hex
    return str(val)


def _get_contract_at(addr: Address):
    if hasattr(gl, "contract") and hasattr(gl.contract, "get_at"):
        return gl.contract.get_at(addr)
    if hasattr(gl, "get_contract_at"):
        return gl.get_contract_at(addr)
    raise gl.vm.UserError("No contract proxy method found")



class HaltLayer(gl.contract.Contract):
    """
    HaltLayer: Autonomous Emergency Circuit-Breaker for Intelligent Contracts.
    Evaluates submitted exploit incidents via GenLayer nondeterministic execution
    and Equivalence Principle validation, triggering protective halts when justified.
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
        )

        self.incidents[incident_id] = incident
        self.incident_ids.append(incident_id)
        return incident_id

    # ── Autonomous Adjudication (Equivalence Principle) ─────────────────────────

    @gl.public.write
    def adjudicate_incident(self, incident_id: str) -> None:
        """
        Evaluate incident using GenLayer nondeterministic execution.
        Leader produces threat assessment from web evidence and LLM reasoning.
        Validator independently verifies that conclusion satisfies the safety policy.
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
                            if res.status == 200 and res.body:
                                text_chunk = res.body.decode("utf-8", errors="replace")[:1000]
                                web_evidence_text += "\n[Evidence " + clean_u + "]:\n" + text_chunk
                        except gl.vm.UserError:
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
                "Analyze the reported activity:\n"
                "1. Is there abnormal, malicious, or exploit activity affecting the target?\n"
                "2. What is the severity (critical, high, medium, low, none)?\n"
                "3. What is the evidence quality (strong, moderate, weak)?\n"
                "4. What is the recommended emergency action (HALT, SAFE_MODE, NO_ACTION)?\n\n"
                "You must respond ONLY with a JSON object in this exact schema:\n"
                "{\n"
                '  "danger": true/false,\n'
                '  "severity": "critical|high|medium|low|none",\n'
                '  "recommended_action": "HALT|SAFE_MODE|NO_ACTION",\n'
                '  "evidence_quality": "strong|moderate|weak",\n'
                '  "target_match": true/false,\n'
                '  "reason": "short factual explanation of threat"\n'
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

            # Equivalence Principle Verification:
            # 1. Target identification
            if not leader_data.get("target_match", False):
                return False

            danger = bool(leader_data.get("danger", False))
            severity = str(leader_data.get("severity", "none")).lower()
            rec_action = str(leader_data.get("recommended_action", "NO_ACTION")).upper()
            evidence_qual = str(leader_data.get("evidence_quality", "weak")).lower()

            if rec_action in ("HALT", "SAFE_MODE"):
                # Must demonstrate genuine danger
                if not danger:
                    return False

                # Check policy capability permissions
                if halt_cap == "HALT" and rec_action != "HALT":
                    return False
                if halt_cap == "SAFE_MODE" and rec_action != "SAFE_MODE":
                    return False

                # Check evidence quality threshold: strong (3) >= moderate (2) >= weak (1)
                quality_levels = {"strong": 3, "moderate": 2, "weak": 1}
                req_level = quality_levels.get(min_ev_qual.lower(), 2)
                actual_level = quality_levels.get(evidence_qual, 1)
                if actual_level < req_level:
                    return False

                # Severity threshold
                if rec_action == "HALT" and severity not in ("critical", "high"):
                    return False
                if rec_action == "SAFE_MODE" and severity not in ("critical", "high", "medium"):
                    return False

                # Independent substantive check of exploit indicators
                if not _has_exploit_indicators(description, tx_hashes, ""):
                    return False

                return True

            elif rec_action == "NO_ACTION":
                if not danger or severity in ("none", "low"):
                    return True
                return False

            return False

        # Run non-deterministic consensus
        assessment = gl.vm.run_nondet(leader_fn, validator_fn)

        # ── Deterministic follow-up state transitions ──────────────────────────
        action = assessment.get("recommended_action", "NO_ACTION")
        severity = assessment.get("severity", "none")
        quality = assessment.get("evidence_quality", "weak")
        reason = assessment.get("reason", "")

        incident.threat_severity = severity
        incident.recommended_action = action
        incident.evidence_quality = quality
        incident.adjudication_reason = reason

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
