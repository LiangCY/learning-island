# Four-room decorating and unified art — browser verification

Verified on 2026-10-04 using Codex In-app Browser through CUA. Production URL: http://localhost:4173/. Purchase and destructive-layout tests used a separate http://127.0.0.1:4186/qa.html origin with a disposable fixture and its own storage prefix. No practice records or room arrangements on the user's origin were reset.

## Requirements and evidence

- Four rooms: living room, study, outdoor garden, bedroom. Rendered each actual room; garden uses an open landscape backdrop, bedroom moonlit architecture, study sage walls, living room warm cream walls.
- Free furniture placement: moved the golden rug horizontally with real pointer drag. DOM percent position changed from 50% to 58.14176245210728%, retained after reload. Dragging the same rug upward out of its region returned it to the saved position. Also exercised plant invalid-drop rollback.
- Placement constraints: wall hanging shows wall region; floor furniture shows ground region; rugs and pond show floor-spread region. Bounds account for artwork height, preserve entire silhouette, and keep wall hangings away from fixed windows. Arrow keys moved the arch and the dreamcatcher.
- Rug and selection correction: real artwork uses a 3.4:1 floor perspective; selected shape glows along its alpha, with a bottom anchor dot, no square selection outline. Golden rug is visibly on the floor; garden pond rests on grass. Ground limits keep rug top edges below the wall/floor boundary even at the widest 2:1 scene ratio.
- Empty rooms: clicked Clear, observed zero placed objects; reloaded and observed zero again. Placed the default sofa back from inventory. Removed a wall hanging with the selected-item toolbar, verified it remained available in inventory. Unit coverage additionally removes default wall, floor, rug, sofa and plant independently and preserves null finishes and empty objects across reload.
- Multiple objects: placed arch and pond together in garden, and bookcase and wall chart in study. Renderer and storage support more than one item of each category. New additions prefer less occupied horizontal positions.
- Room exclusivity: garden furniture filter only displayed garden-compatible furniture. Exclusive product detail offered only its matching room. Unit tests enforce restrictions on both placement and stored-data normalization.
- Shop artwork: all 48 movable objects and accessories use detailed transparent painterly artwork; the 10 wall/floor finishes preview the same illustrated rooms. Source atlases viewed and windows checked against RGBA PNG geometry. Shop tiles, inventory, wardrobe and rooms share the same itemArt renderer.
- Preview: viewed arch, canopy bed and acorn sofa at desktop and mobile sizes. Detail provides large artwork and room preview; changing preview does not mutate saved rooms. Unaffordable purchase is disabled and shows missing balance (80 coins vs 980-price sofa => 900 missing).
- Purchase and wardrobe: bought 100-coin daisy clip on isolated origin; wallet changed from 42090 to 41990; equipped rabbit; reloaded and verified the equipped button remained true. Actual accessory uses the same illustrated clip shown in the shop.
- Names in real app: 狐狸阿橙 / 兔子朵朵 / 熊猫团团 / 猫咪星米. Stable IDs retained.
- Responsive: desktop 1280px, narrow 504×807 and 375×812. At 504 and 375, document scrollWidth equaled viewport width. Existing horizontal nav remains scrollable. Dialog content scrolls normally on phones.
- Final real-app console check: no errors. An initial test-fixture-only invalid skin key was corrected before scenarios ran; no app runtime defect was involved.

## Local visual evidence

Saved outside the repository under the chat's `outputs/` directory:
- home-garden-v5.png — outdoor garden with arch, pond and rabbit, mobile width.
- home-shop-preview-v5.png — canopy bed artwork and bedroom preview, mobile width.
- home-unified-preview-v5.png — live localhost shop detail showing matching furniture and room materials.

Automated tests: `npm test`; detailed placement/migration/geometry/catalog checks are in `habitat-placement.test.mjs`. No new dependencies or external image URLs required.

## Foreground and plant scale follow-up

Verified on 2026-10-04 at 1280px and 511×807 on the isolated QA origin:
- Placed rabbit at its rear limit (bottom 24%, computed layer 276) and sofa at the front limit (top 96%, layer 96). Rabbit remains fully visible above the overlapping sofa. Real pointer drag moves the rabbit across the sofa normally.
- Furniture remains selectable in arranging mode (companions have pointer-events disabled there). Dragged the smaller plant from 80% to 74.2263% horizontally and observed the saved position.
- New-sprout plant room width changed from 15% to 9%, a 40% reduction. Mobile rendered height is 55.06px versus sofa 104.51px. Verified the same 9% width in study; shop artwork sizing is independent and unchanged.
- Browser console has no errors. Screenshot: `outputs/home-layer-scale-fix.png` in the chat workspace, outside the repository.

## Click outside to finish placement

Verified on 2026-10-04 using the isolated QA origin at desktop and 511×807:
- Selecting furniture from inventory enters arranging mode. Clicking empty room background or the blank page margin exits arranging mode, clears selection and hides placement bounds; companions return to full opacity.
- Switching from sofa to plant keeps arranging active. Real pointer drag moves the plant from 74.2263% to 80% without exiting or losing selection. Clicking blank space then completes placement; reload retains the 80% position.
- The explicit Finish Placement action uses the same completion path. The document listener is installed once, ignores interactive controls and dialogs, and only runs while the home panel is present.
- No browser console errors. Screenshot: `outputs/home-click-outside-finish.png` in the chat workspace.
