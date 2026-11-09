# Trainer Character Sheet — rollout

The Player Edition Trainer Passport now has a **Character Sheet** tab. It is an optional roleplay dossier attached to the existing `santara_trainer_cards/{uid}` document.

## Fields and rules

- Four non-combat attributes: Physique, Agility, Intellect, Presence. Assign **+2, +1, +1, +0**.
- Three proficiencies chosen from Athletics, Acrobatics, Stealth, Perception, Investigation, Survival, Pokémon Handling, Pokémon Knowledge, Technology, Medicine, Persuasion, and Deception.
- Checks use **d20 + relevant attribute + 2 if proficient**.
- Optional age, occupation, life before the journey, reason for accepting the invitation, personal goal, strength, flaw, connection to Luma Town, relationships with trainers and NPCs, and first Pokémon's story.
- Incomplete drafts can be saved. Invalid allocations and more than three proficiencies are blocked in the player UI.
- Only the owner may save their dossier; approved Trainers and GMs can read it with the rest of their Trainer Passport.
- Character stats do **not** affect Pokémon damage, Pokémon HP, or combat moves. Pokémon parties still sync from My Pokémon.

## REQUIRED: publish Firestore rules

The GM repository's `firestore.rules` was updated to allow the optional `characterSheet` map and validate its structure. **GitHub commits do not deploy Firebase security rules.**

1. Open Firebase Console → Firestore Database → Rules for the Santara Firebase project.
2. Replace the existing rules with the complete latest `firestore.rules` from the GM repository, then Publish.
3. Allow the GitHub Pages deployment to finish if it is enabled; hard-refresh Player Edition Trainer Passport.
4. Sign in as an approved Trainer, open **Trainer Passport → Character Sheet**, enter attributes and proficiencies, then save.
5. Open that Trainer's card from another approved account and confirm the read-only dossier is visible.

Old Trainer Cards without `characterSheet` remain valid. There is no migration requirement. If Firebase rules are not published, the new editor will display a permission-denied error upon saving.

## Security and privacy

Dossier text is shared with other **approved Trainers**, not stored privately. Players should not enter real addresses, contact details, or other information they do not wish to share. The Firestore validator restricts keys and field lengths.

Pure JavaScript model/renderer validation is covered by the Player Edition `tests/trainer-character-sheet.test.mjs`. Live authenticated Firebase acceptance testing is still required.
