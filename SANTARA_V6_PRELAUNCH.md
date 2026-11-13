# Santara V6 — Release hardening and one-time migration

This revision removes V5.3 damage dice from both Player and GM battle sheets. The old V5.3 markdown guide is marked archived; use `combat-guide.html` for live play.

## 1. Preserve private GM story data

The publicly served GM homepage no longer embeds the unreleased starter story. Existing work remains in the **same browser storage key** as before, so a browser that has saved its GM notebook should continue to load it.

Before making other changes:
1. Open the [GM Fieldwork dashboard](./index.html) using the usual browser and profile.
2. Open **Backup & help** and download a private GM JSON backup. Keep the file somewhere only you can access.
3. Deploy the updated `firestore.rules` in Firebase Console → Firestore Database → Rules. **Pushing the file to GitHub does not publish Firestore security rules.**
4. Sign into the GM cloud panel at the bottom of Fieldwork and choose **Back up GM story**. The private document is stored at `santara_gm_private_campaign/current` and can be read only by authenticated GMs.
5. On another device, sign in as GM and use **Restore GM story**. This asks for confirmation before replacing the local notebook. You can also import the exported private JSON backup.

If the dashboard says *Private notebook not loaded*, the browser has no saved GM story. Do not enter new campaign information until you import your old private JSON backup or restore the GM-only cloud copy.

**Important security limitation:** The GitHub repository is still public. Removing a secret from the latest HTML does not erase it from older Git commits, forks, caches, or other public GM files such as custom-content catalogues. For lasting secrecy, move the GM source and its full history into a private repository or private storage, while keeping a separate public Player site. Do not share the GM repository with players.

## 2. Migrate current Pokémon HP to V6

Direct link: `pokemon-party.html?tab=hp-migration`

1. Sign in to the GM Pokémon console and open **V6 HP Migration** from the sidebar or Pokémon roster.
2. Wait until all registered Pokémon finish loading. The preview identifies old V5.3 HP, already-V6 HP, unusual/boss overrides and malformed records.
3. By default, **only old V5.3 HP records are migrated**. Deliberately adjusted boss HP is skipped. Check **Include manually adjusted / boss HP** only if every Pokémon really should use standard V6 values.
4. Press **Migrate N Pokémon to V6**. A timestamped JSON HP backup is downloaded before updates begin. Keep it. The console asks for confirmation and checks each current server record before overwriting its HP.
5. Confirm the success/failure summary. If someone edited or took damage during the migration, their record is skipped rather than overwritten. Refresh and retry those records.
6. Inspect a few Pokémon in the Player console, including a fainted Pokémon, and confirm old damage remains recorded.

### HP policy

`V6 max HP = floor((2 × Base HP + 31 + floor(HP EV / 4)) × Level / 100) + Level + 10`, except Shedinja = 1. HP EVs default to 0 and IVs are always 31.

Missing HP is preserved: a Pokémon at 80/100 HP becomes 130/150 HP (20 damage remains). A fainted Pokémon remains at 0 HP. HP is stored in Firestore only after the GM explicitly confirms the migration.

## 3. Pre-release checks

- Both GitHub Pages sites deploy successfully, and their V6 automated tests pass.
- Publish the new Firestore rules before attempting GM private cloud backups.
- Verify the Player Pokémon page and calculator no longer show V5.3 dice.
- Test two normal Trainer accounts: no cross-account Pokémon access, and different unlocks remain isolated.
- Confirm hidden story content is not published through Player-facing catalogue selections.
- Keep only the Player website URL in the player invitation.
