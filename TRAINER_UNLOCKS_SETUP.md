# Santara Trainer Unlocks — GM deployment and usage

## Where to manage
- GM Fieldwork sidebar: **Player Unlocks**.
- Direct route: `pokemon-party.html?tab=unlocks`.
- Select an approved Trainer or authorized requester.
- Use the overview grid to compare Tera, Z-Moves, Mega, Dynamax and reveal counts across players.
- Enable per-Trainer battle gimmicks and custom species, Megas, move, ability and special-weather *visibility*.
- Press **Save**. These changes affect only the selected Trainer.

Unlocking a species or ability means it appears in the player-facing selection UI; it does **not** assign or teach it. Unlocking a Mega form's name does **not** grant that form to a Pokémon. Use the GM Pokémon editor to assign a Mega and its stone. Use Move Memory for specific move learning, and Trainer Bag for items/TMs.

## Required Firestore security rules update
**The static GitHub Pages deployment does not publish Firestore security rules.**

1. Go to Firebase Console -> the Santara project -> Firestore Database -> **Rules**.
2. Compare the project's current active rules to the updated full `firestore.rules` in the GM repository. Merge any changes that exist only in Firebase rather than blindly overwriting them.
3. Publish the resulting rules. The `santara_trainer_gimmicks/{uid}` validation must permit the five optional content lists: `speciesUnlocks`, `megaFormUnlocks`, `moveUnlocks`, `abilityUnlocks`, and `weatherUnlocks`.
4. Reload the GM Player Unlocks tab and save a test grant. Without the rules update, expanded saves will be rejected as permission denied.

No data migration is required: older per-Trainer gimmick documents with only Tera/Mega/Z/Dynamax still work and are normalized in the client.

## Player-side behavior
- The Player Pokémon site receives the gimmick and catalogue visibility grants through the existing Trainer gimmicks document.
- Saved Pokémon and their equipped/learned moves stay visible regardless of catalogue grants.
- The Player damage calculator reads the same Trainer document on load or when the **Reload Pokémon** control is used. It disables locked transformations and hides ungranted custom species, moves, abilities and special weather from selectors.
- A content grant may not become usable until the definition has been published or assigned.

## Spoiler/privacy limitations
The visibility controls are enforced by the player-facing interfaces. They are **not a security boundary** for underlying shared catalogue records: existing `santara_species_overrides`, `santara_custom_moves`, and `santara_custom_abilities` Firestore collections are readable by approved members under the current rules. Keep truly unrevealed definitions GM-only until the server-side publishing architecture is separated into public and per-player collections.

## Suggested smoke check
1. Choose Trainer A and grant Tera and one custom species; save.
2. Reload Trainer A's Player app; verify Tera is enabled and the species appears.
3. Choose Trainer B, leave both locked; save.
4. Verify Trainer B does not see the species or have a Tera toggle.
5. As GM, verify Move Memory and Trainer Bag still work independently.
