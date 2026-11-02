# Windows multiplayer

Open **Arena → Multiplayer** in ILEX.GG 3.4.0. Create an account or sign in
with your existing ILEX.GG multiplayer account. Save your recovery code
somewhere private: it replaces email-based account recovery.

- Browse public lobbies, or create a room and choose a legal local deck.
- Add friends by username and accept incoming friend requests.
- Invite friends to your room, or share a private room code.
- Both players select their decks and press **Ready to play**.
- Return to **Lobbies and friends** from the match table.

The official HTTPS service owns match state and sends each player a filtered
view. Opponent hands and hidden Prizes stay hidden. Friends and accounts live
on the server; local decks, Campaign, bot games and offline saves stay on your
device. Sign-in lasts until the app closes; reload within the app resumes it.
Your browser and Windows multiplayer accounts work with the same service.

## Free beta limits

No payment or credit card is required. The service currently allows two
simultaneous rooms. Free hosting may sleep; sign-in can take several minutes
while it wakes up. Ranked is disabled. Multiplayer supports 60-card catalog
decks in Regular TCG, New Rule and Ken Guy Rules. Custom cards and Cube are
not supported online yet. Both players need Internet.

The original direct invite/response mode remains under **Arena → Private
Multiplayer**. Both players should use the same updated build.

## Install or update

Download ILEX.GG-Windows.zip, extract the entire ZIP to a new folder and run
ILEX.GG.exe. Windows 10/11 x64. Existing offline saves remain in the same
profile. The app is unsigned. For 3.4.1, use the complete Windows ZIP in a new folder. Local saves remain in the existing profile.

Android remains the unchanged 3.2.0-android.121 download and does not include
this Windows multiplayer integration. Earlier releases remain available.

## Verification scope

Hosted public lobbies, friends, filtered hidden hands, shared setup choice,
local artwork and reload recovery were tested against the live HTTPS service
in two isolated native Electron windows on one PC. Direct-private WebRTC,
opponent-approved Undo, reconnect and a complete pass-to-deck-out transport
endurance match also passed. Separate physical PCs/different networks and
competitive strategic-match acceptance remain pending. Ranked is not live.
