# Latest feature — private Windows multiplayer preview (October 19, 2026)

Separate 1.18.0-private.1 Windows preview implements invite/response codes, host-authoritative catalog rules, filtered guest state, format-first decks, ready confirmation, native card controls, reconnect and separate host recovery. Undo freezes play until the opponent approves or denies; no rewind before approval. Free STUN/direct WebRTC, no paid infrastructure or TURN fallback. Real two-PC/Internet acceptance remains UNVERIFIED: sandbox real RTC failed, UDP loopback timed out and TCP returned EACCES. Controlled native two-window tests explicitly simulate channel delivery; do not claim real networking passed.

Frozen engine d31da38c530531718e546471fbf59ae49714b70a2bc02133132385b322a0378d includes Evosoda and Psychic Embrace fixes; shared development engine left alone. Stable Windows app and Android APK not replaced by this task. Separate outputs/ILEX.GG-Private-win32-x64 and Private-Windows ZIPs. See work/rules-research/private-preview-release.json, PRIVATE-MULTIPLAYER-PROGRESS.md and work/desktop/PRIVATE-MULTIPLAYER.md for verification and limitations. Trusted host can inspect full state. Custom-card networking/Android/matchmaking deferred; BW onward, Unlimited deferred. No subagents or GitHub publication.

---

Verification reports retain exact engine/module hashes. Unit checks: 15 host-rule/privacy/Undo groups and 4 invite/framing groups. Full inherited native acceptance passes fresh and restored on the final engine; each launch also passes 20 private two-window checks using explicitly simulated delivery. 23,838 scans and 209 existing finish images are verified. See the final release JSON for actual completion and archive hashes. Previous failed real-network attempts are retained under work/private-native-v1 through v8.

Next acceptance: two separate Windows PCs, first on one LAN and then separate Internet connections. Exchange codes, complete setup, resolve a normal turn and prompts, deny and approve Undo, disconnect/reconnect, then restart the host and resume. Do not mark online complete before real connectivity passes.

Real transport recheck: invite/answer succeeded, actual data-channel handshake timed out and guest ICE failed. No second PC available and no full network match completed. Evidence: private-real-network-recheck.json and work/private-real-recheck-v1. Preview remains unverified for real networking; no release files changed.
