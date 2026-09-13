import { GenLayerRpcClient } from "./rpcClient";
import { Incident, ProtectedProtocol, ProtectionStatus } from "./types";

export class HaltLayerClient {
  private rpc: GenLayerRpcClient;
  public address: string;

  constructor(rpc: GenLayerRpcClient, address: string) {
    this.rpc = rpc;
    this.address = address;
  }

  public setAddress(address: string) {
    this.address = address;
  }

  public async getAdmin(): Promise<string> {
    return await this.rpc.readContract(this.address, "get_admin", []);
  }

  public async getProtocolCount(): Promise<number> {
    const count = await this.rpc.readContract(this.address, "get_protocol_count", []);
    return Number(count || 0);
  }

  public async getIncidentCount(): Promise<number> {
    const count = await this.rpc.readContract(this.address, "get_incident_count", []);
    return Number(count || 0);
  }

  public async getProtectionStatus(targetAddress: string): Promise<ProtectionStatus> {
    const status = await this.rpc.readContract(
      this.address,
      "get_protection_status",
      [targetAddress]
    );
    return status as ProtectionStatus;
  }

  public async getProtocol(targetAddress: string): Promise<ProtectedProtocol> {
    const raw = await this.rpc.readContract(this.address, "get_protocol", [targetAddress]);
    return {
      target_address: raw.target_address,
      name: raw.name,
      owner: raw.owner,
      authorized_halt_capability: raw.authorized_halt_capability,
      min_evidence_quality: raw.min_evidence_quality,
      is_active: Boolean(raw.is_active),
      protection_status: raw.protection_status,
    };
  }

  public async getIncident(incidentId: string): Promise<Incident> {
    const raw = await this.rpc.readContract(this.address, "get_incident", [incidentId]);
    return {
      incident_id: raw.incident_id,
      target_address: raw.target_address,
      reporter: raw.reporter,
      description: raw.description,
      tx_hashes: raw.tx_hashes,
      evidence_urls: raw.evidence_urls,
      submitted_at: raw.submitted_at,
      status: raw.status,
      threat_severity: raw.threat_severity,
      recommended_action: raw.recommended_action,
      evidence_quality: raw.evidence_quality,
      adjudication_reason: raw.adjudication_reason,
      appellant: raw.appellant,
      appeal_reason: raw.appeal_reason,
      appeal_resolution: raw.appeal_resolution,
    };
  }

  public async getIncidentIdByIndex(index: number): Promise<string> {
    return await this.rpc.readContract(this.address, "get_incident_id_by_index", [index]);
  }

  public async getAllIncidents(): Promise<Incident[]> {
    const count = await this.getIncidentCount();
    if (count <= 0) return [];

    const incidents: Incident[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const id = await this.getIncidentIdByIndex(i);
        if (id) {
          const inc = await this.getIncident(id);
          incidents.push(inc);
        }
      } catch (err) {
        console.warn(`Failed to fetch incident at index ${i}:`, err);
      }
    }
    // Return newest first
    return incidents.reverse();
  }

  // --- Transactions ---

  public async submitIncident(
    targetAddress: string,
    description: string,
    txHashes: string,
    evidenceUrls: string
  ): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "submit_incident", [
      targetAddress,
      description,
      txHashes,
      evidenceUrls,
    ]);
  }

  public async adjudicateIncident(incidentId: string): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "adjudicate_incident", [
      incidentId,
    ]);
  }

  public async appealIncident(incidentId: string, reason: string): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "appeal_incident", [
      incidentId,
      reason,
    ]);
  }

  public async resolveAppeal(
    incidentId: string,
    overturn: boolean,
    notes: string
  ): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "resolve_appeal", [
      incidentId,
      overturn,
      notes,
    ]);
  }
}
