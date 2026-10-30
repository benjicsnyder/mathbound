# Mathbound: The Four Sigils

Open **index.html** in a web browser. No installation or server needed.

## GitHub Pages

This is a static website with relative asset paths and no build step.
In the repository's **Settings > Pages**, select **Deploy from a branch**,
choose **main** and **/ (root)**, and save. The `.nojekyll` file disables
Jekyll processing. The game runs at the Pages URL shown in those settings.
Saved progress is specific to the browser and site address; progress from
opening the local file does not transfer automatically to the hosted game.

An original pixel-art, top-down RPG. You are a white stick-figure wanderer in a
large, snowy math world populated by black stick-figure enemies. Snow falls over
frosted pines, snow dunes, frozen peaks, icy coasts, and the Zero Citadel.
The warm village fountain still heals you; thin ice remains impassable, so use bridges.

Walking, camera follow, roaming enemies, and articulated limbs animate smoothly.
Your footsteps leave fading tracks. Houses have drifting chimney smoke, and
battles have attack lunges, math projectiles, impact particles, and block shields.
The browser's **reduced motion** setting disables moving weather and battle effects.

## Explore

- Move with **WASD**, **arrow keys**, or the on-screen direction pad.
- Press **E** or **Space**, or click **Interact**, beside a character or fountain.
- Press **M** or click **World map** to see the entire island.
- Visit Pluswood (northwest), Minus Dunes (northeast), Product Peaks (southwest),
  and Fraction Coast (southeast) in any order. The northwest is easiest.
- Defeat each region's guardian to earn its sigil. All four sigils open the
  Zero Citadel in the far north, where the King of Chaos waits.
- Black roaming enemies challenge you on contact, or when you interact nearby.
  Defeated enemies stay defeated.
- The village's blue fountain, west of the blue guide, restores all HP.

## Fight

Choose one of four rectangular move buttons: **+**, **-**, **x**, or **divide**.
By default, their damage is 10, 16, 24, and 34. Solve the question and press **Enter** or **Attack**.
Solve incoming counterattack questions to block all damage.

## Math Facts and your strongest move

Every incorrect battle answer takes you to the **Math Facts Cabin**. It shows
the exact missed problem, its answer, and worked steps in the correct order.
Practice that same problem correctly before returning to battle. You can try
as often as needed without extra damage or turns. The original missed attack
or defense still counts, including if it ended the battle.

Open **Math Facts** in the sidebar between battles to revisit your missed
problems. The latest 100 distinct problems and their practiced status save
with your adventure. Missing a fact again marks it as needing practice.

Use **Most powerful move** in the sidebar to choose addition, subtraction,
multiplication, or division as your strongest attack. Your choice deals 34
damage; the other moves keep their relative order at 10, 16, and 24 damage.
The buttons show the actual damage. Change this setting between battles;
it saves automatically and is preserved when starting a new adventure.
Changing power does not change question difficulty.

## Difficulty modes

Use the **Mode** selector above the world. Change modes between battles without
losing sigils or map progress. The selector is locked during a fight.
First-time adventures start on Normal; existing saves without a mode keep the previous
Hard rules. Starting fresh keeps your currently selected mode.

| Mode | Questions | Enemy HP / attack | Enrage per turn | Victory healing (guardian / roamer) |
| --- | --- | --- | --- | --- |
| Easy | Small numbers; single-step counters | 65% / 55% | None | 30 / 12 HP |
| Normal | Medium numbers; later multi-step counters | 85% / 80% | +1, maximum +10 | 20 / 8 HP |
| Hard | Large numbers; multi-step counters | 100% / 100% | +2, maximum +16 | 15 / 5 HP |

Hard guardians have 110-260 HP. Easy enemies counter one turn less frequently.
A missed attack always triggers a counterattack on every mode.
Parentheses come first, then multiplication/division, then addition/subtraction.
Division answers are always whole numbers. There is no time limit.

Health carries between battles. Defeat returns you to the village with full HP without
losing collected sigils. The undefeated enemy resets to full health.

## Saving and offline use

Map position, difficulty, move power, missed facts, health, sigils, and defeated enemies save in this browser's local
storage. Reloading during a battle returns you to the overworld at the battle's
entry point; the enemy resets to full health.
If the browser blocks storage, the game still works but cannot save.
**New adventure** asks for confirmation before replacing your progress.

The game works entirely offline, with no downloads, libraries, or external art.

Open **tests.html** in a browser to run the rule and interface checks.
