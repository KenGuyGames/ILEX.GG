Current Windows build: **1.22.0**. Both peers must use this build. **Cube matches/drafting are local/bot only and excluded from multiplayer.** Real external two-PC acceptance remains pending.

# ILEX.GG private Windows multiplayer preview

This preview adds invite-only Windows-to-Windows matches. No account, subscription, paid relay or hosted lobby is required. Both players must use the same preview build. The normal Windows release and Android APK remain separate.

## Start a match

1. Close any running ILEX.GG window, then launch this preview's `ILEX.GG.exe`. Keep its folder together. It uses your existing decks and workspace; online match recovery is stored separately from local/bot saves.
2. Open **Private multiplayer** on the forest main menu.
3. Host: choose the format, your deck and rules profile, then **Create invite**. Copy the entire `ILEX1.…` invite code and send it privately to your opponent.
4. Guest: paste the invite under **Join a friend**, then **Create response**. Return the entire response code to the host. Keep the window open.
5. Host: paste the response and select **Connect opponent**.
6. Guest: select a legal deck. Both players select **Ready to play**, then complete their own setup choices.

Invites contain connection addresses and authorize the guest seat. Share them only with your intended opponent. The host runs the complete rules engine and can inspect the full state on their computer, so this version is for trusted friends. The guest is sent only its own hand, public cards, pile counts and authorized effect choices, not the host's hand, hidden Prizes, deck order, random seed or private journal.

## Play and Undo

Drag a hand card onto an Active/Bench destination, or click it for play options. Click a field Pokémon for its enlarged attack/Ability regions and Retreat choices. Right-click a revealed card to magnify it. Follow the separate Energy, Prize and effect prompts. Costs and interactions are checked by the host's existing rules engine. Public GX/VSTAR markers follow format eligibility.

**Request Undo** pauses play on both sides. Only the opponent can **Approve Undo** or **Deny Undo**. No game action is rewound while approval is pending. Approval restores the last decision and its automatic effects; denial leaves the game unchanged. The requester can withdraw. Requests expire after 90 seconds and are canceled on disconnect. Previously seen information cannot be forgotten, which is why approval is required.

## Reconnect

Keep the host app open. If the connection drops, moves pause. The host creates a fresh invite; the same friend exchanges a fresh response to resume the existing guest seat. If the host app was closed, select **Resume hosted match**, then exchange new codes. Recovery requires the same rules/build fingerprint. This is local host recovery, not cloud storage or host migration.

## Connection requirements and current acceptance limit

Internet mode uses free public STUN discovery at `stun.cloudflare.com`; play then uses a WebRTC data channel directly between the two PCs. **Local network only** skips the public discovery service. There is no TURN relay, so some restrictive firewalls, mobile hotspots, VPNs or NAT combinations will not connect. Try the same local network first, then a different network if necessary. If Windows Firewall asks about ILEX.GG, allow the app on the network you intend to use. No firewall rules are changed automatically.

**Real two-PC / Internet connection acceptance is not yet verified.** In the development environment, real WebRTC handshakes failed, a basic UDP loopback exchange timed out, and a separate TCP loopback probe returned EACCES. Automated two-window acceptance therefore used explicitly simulated channel delivery. Those checks exercise the actual invite/response encoding, message framing, engine, views, UI, Undo and recovery; they do not establish real-network connectivity. This is a preview for that acceptance step, not a certified online release.

Catalog cards and existing historical profiles are supported. Custom-card networking, Android multiplayer, public matchmaking, spectators, emotes and ranked anti-cheat are not part of this first preview. BW-onward card interaction scope and Unlimited deferral remain unchanged.

References: [WebRTC peer connections and signaling](https://webrtc.org/getting-started/peer-connections), [WebRTC data channels](https://webrtc.org/getting-started/data-channels), [Cloudflare STUN FAQ](https://developers.cloudflare.com/realtime/turn/faq/), [Electron WebRTC interface policy](https://www.electronjs.org/docs/latest/api/web-contents#contentssetwebrtciphandlingpolicypolicy).
