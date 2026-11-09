# Santara custom content catalogue

This branch adds an **opt-in GM-only Firestore importer** to the Trainer Pokémon screen. It does not automatically populate Firestore when the page loads, edit assigned Pokémon, or grant gimmick unlocks.

## Using the importer

1. Merge/deploy the GM branch and hard-refresh the GM Trainer Pokémon page.
2. Sign in using the campaign GM Firebase account.
3. Open **Trainer Pokémon → + Import Santara Content**.
4. Choose one group and press **Import missing**. Review the spoiler warning.
5. The site checks live Firestore documents by their slug and creates only missing records in a batch. Existing definitions, uploaded artwork, and modified stats remain untouched.
6. To use an imported Mega, manually assign it to a compatible existing Pokémon in its GM editor. Existing Pokémon records never change automatically.

The importer uses existing Firestore collections: santara_species_overrides, santara_custom_abilities, santara_custom_moves, and santara_mega_forms.

## Content groups

| Group | Included | Who can read it after import |
| --- | --- | --- |
| Original fossils | 4 original species, Apex Predator, Tar Rend, Riptide Bite, Faultline Gore | Approved Trainers |
| Reworked Mega Evolutions | 17 Mega forms, 7 custom abilities, 4 Mega signature moves | Mega forms: GM only; associated move and ability definitions: approved Trainers |
| Story and alternate forms | Rotom-Server, Yveltal Eclipse Forme, Root Access | Approved Trainers |
| Provisional signature moves | Glitch Pulse, Nihil Light (clearly marked as working drafts) | Approved Trainers |

**Spoilers:** Do not import unrevealed story content early. The repository itself is public, so the source code can also be viewed outside Firestore.

## Original Pokémon

Stats: HP / Atk / Def / SpA / SpD / Spe.

| Pokémon | Type | Ability | Stats |
| --- | --- | --- | --- |
| Spinotroleum | Water/Poison | Apex Predator | 110/140/105/65/100/80 |
| Mosasord | Water/Dark | Strong Jaw | 95/125/95/60/85/90 |
| Obsidaalik | Water/Fire | Regenerator | 120/60/105/115/105/40 |
| Carnotremor | Fire/Ground | Reckless | 80/130/90/45/70/120 |

## Reworked Mega Evolutions

| Pokémon | Type | Ability | Stats |
| --- | --- | --- | --- |
| Mega Charizard Z | Fire/Dragon | Kingdom's End | **78/63/72/200/70/151** |
| Mega Lycanroc Dusk | Rock/Dark | Tough Claws | 75/157/85/55/80/135 |
| Mega Dragapult | Dragon/Ghost | Mega Launcher | 88/135/115/140/110/112 |
| Mega Ceruledge | Fire/Ghost | Sharpness | 75/160/110/60/120/100 |
| Mega Armarouge | Fire/Psychic | Bastion Furnace | 85/60/140/165/100/75 |
| Mega Greninja | Water/Dark | Perfected Ninjutsu | 72/110/77/148/81/142 |
| Mega Arbok | Poison/Dark | Strong Jaw | 60/135/99/65/89/100 |
| Mega Krookodile | Ground/Dark | Adaptability | 95/157/105/65/80/117 |
| Mega Hydreigon | Dragon/Electric | Tempest Crown | 92/105/110/170/105/118 |
| Mega Lapras | Water/Ice | Aurora Chorus | 130/85/115/135/105/65 |
| Mega Kilowattrel | Electric/Flying | Lightning Rod | 70/70/85/135/90/140 |
| Mega Garganacl | Rock | Purifying Salt | 100/125/175/45/120/35 |
| Mega Kingdra | Water/Dragon | Swift Swim | 75/95/110/160/110/90 |
| Mega Tyrantrum | Dragon/Fire | Molten Edge | 82/161/139/69/79/91 |
| Mega Crawdaunt | Water/Dark | Adaptability | 63/165/100/90/65/85 |
| Mega Porygon-Z | Normal/Electric | System Override | 85/80/85/165/100/125 |
| Mega Archaludon (new proposed) | Steel/Dragon | Siege Battery | 90/105/165/170/105/65 |

## Ability and move details

The full descriptions are stored in santara-catalog.js and appear in battle sheets after import.

- Apex Predator: physical attacks +30% versus injured targets; heal 25% of max HP on knockout.
- Kingdom's End: five rounds of Calamitous Sun; Fire ×1.5, Water fails, Fire resistances neutralized; ends on switching.
- Perfected Ninjutsu: combines Skill Link (multi-hit moves always hit the maximum number of times) and Technician (moves of 60 BP or less gain 50% power, calculated per hit for multi-hit moves). Water Shuriken always hits five times, at 22.5 BP per hit before STAB.
- Bastion Furnace: prevents Defense and Sp. Defense reductions; above half HP reduces super-effective damage 25%; at or below half boosts Fire and Psychic damage 30%.
- Tempest Crown: Royal Tempest for five rounds, Electric +30%, Thunder and Hurricane cannot miss.
- Aurora Chorus: establishes Aurora Veil without needing snow.
- Molten Edge: Fire and slicing damage +30%, but does not double-stack.
- System Override: inflicts Exposed (Ability suppression, Speed reduction, boosted Normal/Electric damage). The 20% damage modifier and expiry mechanics are working design proposals.
- Root Access: combines Levitate and Prankster.
- Siege Battery (new proposal): Electro Shot skips charging; first damaging hit each round gives +1 SpA.
- Tar Rend: 85 BP Poison Physical, guaranteed Defense −1 on hit.
- Riptide Bite: 85 BP Water Physical biting move, 30% Defense −1.
- Faultline Gore: 100 BP Ground Physical, recoil 25% of damage dealt.
- Psycannon: 120 BP Psychic Special, user Speed −1.
- Infernal Sweep: 95 BP Fire Special spread move.
- Schradebreaker: 130 BP Fire Special, 90 accuracy, destroys screens.
- Schrade's End: 180 BP Fire Special cone, one round to charge, once per battle.

**Superseded drafts:** Charizard Z's most recent revision has **200 SpA**, not the earlier 159 or 199. Ceruledge uses **Sharpness** instead of Soulrend; Greninja's **Perfected Ninjutsu** supersedes its earlier Technician-only design.

**Not previously finalized:** Mega Archaludon's spread and Siege Battery are newly authored proposals. Glitch Pulse and Nihil Light remain optional and separate because their descriptions were not finalized.

## Limitations

- This is a tracker; custom ability and move effects are readable descriptions, not automated turn/damage rules.
- Imported Mega definitions need to be manually assigned to Pokémon already owned by Trainers.
- GitHub cannot inspect live Firestore user data. The importer checks that data only after the authenticated GM clicks Import.
- The current Firestore collection rules already cover these document shapes; there is no additional rules file to deploy for this change.
