# HaltLayer Premium Frontend (Hackathon Edition)

Autonomous emergency circuit-breaker interface for Intelligent Contracts on the GenLayer blockchain, purpose-built for the **GenLayer Agent Tank Hackathon**.

Deployed natively on **Vercel** with pure on-chain truth.

---

## 1. Executive Objective

The frontend communicates the autonomous security lifecycle:

$$\text{OBSERVE} \longrightarrow \text{INVESTIGATE} \longrightarrow \text{CONSENSUS} \longrightarrow \text{INTERVENE} \longrightarrow \text{PROTECT}$$

It makes HaltLayer immediately understandable within the first 10 seconds of a judge's visit while adhering strictly to the **Trust Rule**:
- **Protocol status** comes directly from the actual contracts (`DemoVault` / `HaltLayer`).
- **Incident data** is retrieved from live contract state (`get_incident`, `get_incident_count`).
- **Adjudication status** reflects actual GenLayer Equivalence Principle consensus transactions.
- **Halt status** mirrors the real `is_paused()` on DemoVault.
- **Zero fake validator counts or fabricated consensus** exist in the production bundle.

---

## 2. Brand Identity

- **Original Custom Logo Component**: [`HaltLogo.tsx`](./src/components/brand/HaltLogo.tsx)
  - Geometric abstract **H**
  - Protective defensive shield perimeter
  - Dynamic circuit-breaker bridge (locks when active, severs with diagnostic gap when halted)
  - High-tech central consensus node core
  - Works seamlessly in monochrome, favicon, navigation, and hero sizes (from 24px to 120px)
- **Wordmark**: [`HaltWordmark.tsx`](./src/components/brand/HaltWordmark.tsx)
- **Status Badging**: [`StatusBadge.tsx`](./src/components/brand/StatusBadge.tsx) covering `ACTIVE`, `INVESTIGATING`, `HALTED`, `SAFE_MODE`, and incident lifecycle statuses.

---

## 3. Cinematic Introduction Sequence

A 12-stage animated technical introduction designed for judges:
1. **A**: Deep obsidian void.
2. **B**: Central beacon of light emerges.
3. **C**: Beacon expands into the HaltLayer geometric shield mark.
4. **D**: Fine circuit traces propagate outward.
5. **E**: GenLayer validator nodes materialize around the perimeter.
6. **F**: Inter-validator consensus connections establish.
7. **G**: External anomaly telemetry signal enters the network.
8. **H**: System transitions to amber investigation state.
9. **I**: Validators converge toward an Equivalence Principle decision.
10. **J**: Central circuit breaker locks into protective posture.
11. **K & L**: Resolves into **HALTLAYER: Autonomous protection for the agentic economy.**
12. **M**: Interactive call-to-actions reveal: `[ Launch Console ]` and `[ How It Works ]`.

### Accessibility & Reduced Motion
- Fully honors `prefers-reduced-motion`. When enabled, skips straight to the revealed state with zero waiting.
- Users can click **Skip Intro** at any time.

---

## 4. Architecture & Component Tree

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Dark theme root layout & ProtocolProvider
│   │   ├── page.tsx                  # Main page coordinating intro, hero, console & docs
│   │   ├── globals.css               # Obsidian theme, scanlines, glow filters
│   │   └── api/
│   │       ├── rpc/route.ts          # Server-side JSON-RPC proxy to avoid browser CORS
│   │       └── tx/route.ts           # Server-side transaction dispatcher
│   ├── components/
│   │   ├── brand/
│   │   │   ├── HaltLogo.tsx          # Original SVG shield circuit-breaker mark
│   │   │   ├── HaltWordmark.tsx      # High-tech typography wordmark
│   │   │   └── StatusBadge.tsx       # Live status indicators
│   │   ├── cinematic/
│   │   │   └── CinematicIntro.tsx    # 12-stage cinematic intro
│   │   ├── hero/
│   │   │   └── HeroSection.tsx       # Hero with 5-stage defense pipeline
│   │   ├── console/
│   │   │   ├── SecurityConsole.tsx   # Master operations console
│   │   │   ├── ProtocolStatusCard.tsx# Live DemoVault & HaltLayer metrics
│   │   │   ├── HaltBanner.tsx        # Dramatic emergency halt state banner
│   │   │   ├── IncidentList.tsx      # Real incidents retrieved from contract
│   │   │   ├── IncidentReportModal.tsx# Serious incident submission workflow
│   │   │   ├── IncidentDetailModal.tsx# Deep telemetry dossier
│   │   │   ├── AppealModal.tsx       # Decentralized appeal & resolution
│   │   │   ├── InvestigationVisualizer.tsx# Live consensus state machine
│   │   │   └── LiveVaultControls.tsx # Interactive test to prove withdrawals revert
│   │   ├── how-it-works/
│   │   │   └── HowItWorksSection.tsx # 5 stages: OBSERVE -> INVESTIGATE -> CONSENSUS -> INTERVENE -> PROTECT
│   │   ├── navigation/
│   │   │   ├── Header.tsx            # Sticky nav, wallet connect, network switcher
│   │   │   └── NetworkModal.tsx      # Switch between StudioNet, Testnet, or Localnet
│   │   └── ui/
│   │       └── CircuitBackground.tsx # Faint circuit traces & ambient radial lighting
│   └── lib/
│       ├── contracts/
│       │   ├── codec.ts              # Pure TypeScript GenLayer ULEB128 calldata codec
│       │   ├── rpcClient.ts          # GenLayer JSON-RPC client
│       │   ├── haltLayerClient.ts    # Typed HaltLayer contract wrapper
│       │   ├── demoVaultClient.ts    # Typed DemoVault contract wrapper
│       │   └── types.ts              # Strict TypeScript interfaces
│       └── context/
│           └── ProtocolContext.tsx   # Global React context for live state & txs
```

---

## 5. Vercel Deployment & Environment Variables

The application is 100% production-ready for Vercel.

### Environment Variables

| Variable | Scope | Description | Safe for Client? |
|---|---|---|---|
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | Public | RPC endpoint (`https://studio.genlayer.com/api`) | YES |
| `NEXT_PUBLIC_HALT_LAYER_ADDRESS` | Public | Deployed HaltLayer Intelligent Contract address | YES |
| `NEXT_PUBLIC_DEMO_VAULT_ADDRESS` | Public | Deployed DemoVault Intelligent Contract address | YES |
| `NEXT_PUBLIC_NETWORK_NAME` | Public | Name of active network (`studionet`, `testnet_bradbury`, `localnet`) | YES |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | Public | State polling frequency in ms (default: `3000`) | YES |
| `GENLAYER_RELAY_PRIVATE_KEY` | **Private (Server Only)** | Optional key for backend transaction relay | **NO (Server Only)** |

### Deploy to Vercel in 1-Click:
1. Connect your repository to Vercel.
2. Set Root Directory to `frontend`.
3. Set the environment variables from `.env.example`.
4. Deploy!

---

## 6. Live Hackathon Demo Walkthrough (60-90 Seconds)

1. **0:00 - 0:15 | First Impression & Hero**:
   - Judge visits the app. The technical cinematic sequence establishes HaltLayer's thesis: Autonomous protection for the agentic economy.
   - Click `[ Launch Console ]`.
2. **0:15 - 0:30 | Healthy Baseline**:
   - DemoVault displays `ACTIVE` with $5,000,000 USD in protected reserves.
   - Click `Test Vault Defense` -> execute a test deposit of $1,000 USD. It succeeds immediately on-chain.
3. **0:30 - 0:50 | Threat Ingestion & Consensus**:
   - Click `Submit Threat Report` -> click `Fill Sample Threat Telemetry` (reentrancy drain trace + web security advisory URL).
   - Click `Broadcast Incident`. The transaction broadcasts to GenLayer.
   - Click `Run Consensus` on the incident. GenLayer leader ingests the web telemetry, runs LLM reasoning against the safety policy, and validator consensus independently verifies invariants under the Equivalence Principle.
4. **0:50 - 1:10 | Emergency Halt Tripped**:
   - The contract state confirms `HALT_ACCEPTED`.
   - The UI undergoes a dramatic transition: the `HaltBanner` appears, the circuit breaker opens, and DemoVault switches to `HALTED`.
   - Click `Test Vault Defense` -> attempt withdrawal of $500 USD. The transaction **REVERTS ON-CHAIN** with `"Vault is paused: withdrawals disabled"`.
5. **1:10 - 1:30 | Decentralized Appeal & Safe Resume**:
   - Click `File Formal Appeal` -> enter verified mitigation note.
   - Council resolves the appeal with `Overturn & Resume Vault`.
   - DemoVault safely transitions back to `ACTIVE`, and normal operations resume.
