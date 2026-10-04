# 涂色小游戏浏览器验收

日期：2026-10-04。通过 Codex 内嵌浏览器在独立来源 `http://127.0.0.1:4190` 实际操作；练习 PNG 写入 `work/coloring-qa-reports/`。没有读写日常使用来源的存档。

| 场景 | 验证结果 |
| --- | --- |
| 初始商店 | 初始 120 游戏币，展示 20 张独立原创线稿，价格 20–80 币；完整商店截图逐张查看，未出现破图或 SVG 路径解析错误 |
| 分类 / 余额不足 | 甜甜日常筛选显示 4 张；余额 75 时，80 币的猫头鹰提示差 5 币并提供去答题按钮 |
| 购买 | 20 币购买小猫后余额 100；再次进入画板直接创作，不再扣币 |
| 跨页重复购买 | 两标签页在余额 100 时同时持有兔子购买弹窗，先后点击购买，第一张成功，第二张提示已拥有；最终余额 75，拥有 2 张 |
| 色块操作 | 小猫的 23 个色块逐一通过 Tab / Enter 事件完成，显示 100%；真实鼠标点击星星也能填色 |
| 调色 | 用多种纯色、晴空海洋背景渐变、莓果梦境星星完成作品；48 个纯色与 8 种渐变的数量、唯一性和白色进度由自动测试覆盖 |
| 效果 | 闪亮星光覆盖效果正确；像素模式实际生成 80×80 采样再放大的 Canvas，保留原始 SVG 点击层；撤销回到闪亮，重做返回像素 |
| 橡皮与撤销 | 星星擦除后进度由 23/23 变 22/23，底部撤销恢复至 23/23；画板颜色与效果均参与撤销 |
| 收藏 | 命名并保存闪亮小猫，另存像素版本后共 2 幅；更新原有像素作品后仍为 2 幅 |
| 刷新恢复 | 刷新后余额、两张作品、名称、23 个色块及像素效果完整保留 |
| PNG | 实际点击作品下载，Canvas 编码与 Blob 生成完成，界面提示图片已生成；内嵌浏览器未返回下载事件，因此未验证操作系统下载目录落盘 |
| 手机 | 390×844 与 320×680 均无横向溢出；底部固定调色条可直接选色、擦除和撤销，像素覆盖层不会拦截点击 |
| 答题到账 | 实际提交 20 题中的 3 个答案（2 对、1 错、17 空白），成绩页发放 6 游戏币，余额从 75 变 81；再次从历史打开成绩，余额仍 81 |
| 控制台 | 验收操作结束后，应用 error / warn 为空 |

单元测试另外覆盖：非法/重复/超预算购买过滤、损坏存档恢复、SVG 属性注入过滤、未购买画板拒绝保存、作品快照与草稿隔离、按 ID 更新及另存多个版本、不同画板作品不能互相覆盖、并排 SVG 渐变和滤镜引用唯一。

截图证据保存在本地忽略目录 `work/coloring-qa/`。

## 同日效果与色板优化

- 普通色板扩为 72 个唯一纯色，增加正红 / 深红 / 酒红、湖水青、宝石蓝和大地棕，另外保留 8 种渐变；界面实测 72 个普通色按钮，正红点击后色块填充为 `#ff0000`。
- 闪亮改成细密的金银微小碎片和少量小亮点。纹理仅出现在已填色区域，遮罩保留黑色轮廓及五官；采用固定纹理，切换、刷新、导出不重新随机。
- 像素采样从 80×80 提高到 160×160，颗粒边长减半；浏览器目视确认耳朵、眼睛、嘴巴和花朵轮廓更清晰。画室与作品集均使用清晰的像素缩放，PNG 使用相同采样。
- 两种效果的 PNG 生成均成功，控制台无 error / warn；系统下载目录落盘仍受前述内嵌浏览器限制。
- 新截图：`work/coloring-qa/glitter-refined-72.png`、`work/coloring-qa/pixel-refined-72.png`。

## 画材、画框与作品上墙（2026-10-04）

本轮在独立的 `127.0.0.1:4190` 测试环境验证，没有改动日常使用站点的数据。

- 旧版的 2 幅作品、已购买画板和 81 游戏币正确恢复；依次另存蜡笔、水彩、油画、彩铅作品，重新加载后均可继续编辑。
- 四种材质保留色块点击区域和卡通轮廓。水彩去除了重复纹理接缝，油画用较柔和的厚笔触，彩铅用细密排线。使用实际 `coloringCanvas` 渲染 1440 × 1440 PNG，四种材质均生成非空 PNG Blob，视觉与 SVG 预览一致。
- 6 款画框有独立外观；原木免费。购买奶油圆角后余额从 81 变为 51，两幅作品可同时复用这个画框，上墙不再扣费。
- 两个浏览器窗口同时购买 45 币薄荷波点，仅一个窗口成交，另一个提示已拥有。刷新后余额为 6，未重复扣费。余额不足时显示缺少数量与答题入口。
- 客厅同时展示 3 幅作品，可更换原木 / 奶油 / 薄荷画框。改名并更新「油画小猫」后，已有展示位自动同步。
- 展示墙与小屋可双向跳转到对应房间；分别验证客厅、书房、卧室挂画和花园画架。室内位置避开窗户。像素作品在小屋中使用实际像素 Canvas，非原画替代。
- 撤下花园作品后展示位恢复为空，作品仍在收藏中。刷新后其他房间布置保留。自动测试另覆盖删除作品清除所有展示引用、旧存档迁移、非法引用恢复、购买与画板共享余额但不修改叶子币数据。
- 390 × 844 手机尺寸检查展示墙、画框商店与小屋，无页面横向溢出；4 个画室页签保持同一行，换框表单和保存上墙操作可用。
- 全套 `npm test`：91 项通过；`git diff --check` 与修改模块语法检查通过。

截图与材质渲染检查页保存在本地 `work/art-wall-qa/`（不进入版本控制）。PNG Blob 生成已验证；系统下载目录中的最终落盘不在此次浏览器验证范围内。

### 画材差异增强复核

根据「风格差异偏小」反馈，四种画材进一步独立处理线条、颜料和纸面：蜡笔采用粗糙粗线和蜡粒；水彩改成透明晕染与彩色积色边；油画加入方向性凹凸光照和宽笔触；彩铅采用细轮廓、明显排线和纸面留白。使用同一配色并排检查，避免仅靠换色区分。

最终 4 种材质都成功生成 1440 × 1440 PNG Blob，并与 SVG 对照检查；真实编辑器中水彩的键盘填色、撤销、自动保存均通过，控制台无错误。相关模型和渲染测试 19 项全部通过。对照图：`work/art-wall-qa/material-styles.png`。

### 水彩 / 彩铅二次优化

- 水彩去掉整张画的白雾叠层与整体降透明度；每个已填色区域单独使用颜料深浅、细颗粒纸纹、向内的积色边缘，保留表情与所选颜色。
- 彩铅用所选颜料生成短排线，并按色块改变方向；移除贯穿全画的灰色长划线，渐变保持连续，不按小纹理块重复。
- 同配色并排检查 SVG / 1440 × 1440 PNG；水彩与彩铅 PNG Blob 分别为 3,051,920 / 3,139,986 字节。两种效果在真实编辑器内键盘填色、撤销、自动保存通过，旧作品正常打开，控制台无错误。
- 相关 19 项测试通过，含有色区域纹理与无色区域留白、SVG 引用完整、作品保存及展示墙关联。
- 对照截图：`work/art-wall-qa/watercolor-pencil-refined.png`。

### 挂画定位与花园范围调整

- 原因：通用 `button:active` 的 `translateY(1px)` 覆盖了挂画的 `translateX(-50%)`。新增挂画专用按下样式，始终保留居中。
- 读取真实样式表的 `:active` 规则，在独立检查页映射为等权重属性选择器以检查持续按住状态，并禁用过渡以测量最终位置。修复前横移 55.72 px、纵移 1 px；修复后均为 0。真实小屋点击仍能正常进入作品展示墙。
- 花园取消挂画：真实花园页面挂画数和挂画入口数均为 0；展示墙房间页签及上墙表单仅有客厅、书房、卧室。
- 存储兼容测试确认旧花园挂画引用被移除，原作品、画框所有权、游戏币和其他房间展示保留。相关测试共 20 项通过；浏览器控制台无错误。

## 2026-10-04：进阶画板与新增效果

- 新增 8 张进阶画板，共 28 张；新画板 45–79 个区域，95–145 币。原有画板 ID、色块编号和价格保持不变。
- 原画在效果首位；油画改成按区域转向的厚涂色片、局部明暗和短刷痕；反色、雾化共用 SVG / PNG 渲染。
- 在 4190 的浏览器检查全部新画板线稿、配色预览及 Canvas 导出；4 种效果以同一张小猫配色比较，1440×1440 PNG 成功生成。
- SVG 几何采样检查全部新增区域是否被后续区域完全遮挡，移除旋转木马完全被扇面覆盖的底层顶棚；复查 8 张画板均无完全遮挡区域。
- 使用独立 localhost 存档购买温室（120 → 25 币），键盘给背景、墙面和猫脸填色，保存反色作品、另存雾化作品；刷新后画廊两幅作品、效果名称和余额均恢复正确。未修改 127.0.0.1 存档。
- 浏览器无报错。完整自动测试 94 项通过；删除遮挡区域后相关 21 项再次通过。
- 本地检查截图：`work/art-wall-qa/new-effects-comparison.png`、`work/art-wall-qa/advanced-boards-contact-sheet.png`；检查页面保存在同目录 `advanced-preview.html`，需要时临时复制到 dist 以使用相对模块路径。

## 2026-10-04：替换部分建筑题材

- 运河小镇 → 溪谷瀑布（60 区域 / 110 币），星象馆 → 海湾日落（46 / 115），珊瑚宫殿 → 星月宝石项链（68 / 120），森林书屋 → 花冠宝石首饰（87 / 145）。在售目录仍为 28 张，进阶仍为 8 张。
- 新画板使用新 ID；旧几何保留给已购画板、草稿、作品及展示墙，已购旧版仍能从画板列表进入。兼容测试确认颜色、完成度与余额不变。
- 浏览器检查 4 张完整线稿和配色 PNG；几何采样均未发现完全被遮挡的色块。截图：`work/art-wall-qa/nature-jewelry-preview.png`，复现页面：`work/art-wall-qa/nature-jewelry-preview.html`（临时放入 dist 后打开）。

## 2026-10-04: Advanced board refinement

- Refined all 8 current advanced boards: natural contours, botanical petals, horse silhouettes, crown curves, pearl highlights and fine engraving. Main outlines use 72% of the previous width; details retain their own finer strokes.
- Preserved board IDs, region IDs/names/counts, and prices. Existing colors and completion percentages remain valid. No changes to the original 20 or retired board geometry.
- Inspected 8 line-art previews and 4 before/after comparisons in the browser. Geometry sampling found no fully occluded regions. All 8 exported 1440x1440 PNGs with mixed solid/gradient fills; no browser errors.
- Full automated suite: 101 passed. Screenshots: `work/art-refinement/refined-boards.png` and `work/art-refinement/before-after.png`. Reproduction HTML is in the same directory (temporarily copy to dist to run module imports).

## 2026-10-04: Composition redesign after illustration references

- Reference research: https://dribbble.com/shots/25070706-Cute-Greenhouse (viewed actual artwork), https://www.behance.net/gallery/76448415/Minimal-Landscapes and https://www.colorfun.art/col/queens-jewelry-coloring-page/ (page descriptions). The ColorFun UI stopped at its security check; no bypass attempted. No third-party illustration assets are embedded in the app.
- Rebuilt the compositions of all 8 advanced boards: foreground cat and bear, diagonal waterfall with layered mountain scale, large framing palm and sunset, dominant moon pendant, tall tiara, dome canopy with a larger central horse, and close-up tea-party characters.
- Retained every region ID and total, prices and purchased state. Bakery menu regions now depict a bread basket and have matching accessible names. Existing saved colors and completion percentages remain usable.
- Added affine positioning of SVG regions with uniform final outline width; watercolor clips use local geometry to avoid applying the region transform twice.
- Geometry sampling accounts for transforms; all 8 boards have no completely hidden regions or geometry outside the canvas. All export 1440x1440 PNGs.
- In the independent localhost test profile, opened the existing greenhouse draft (3/72 colored), clicked its relocated window and colored the enlarged cat (5/72), selected watercolor and saved successfully. Browser error log empty. User profile on 127.0.0.1 untouched.
- Full suite: 102 passed; related suite after final illustration corrections: 24 passed. Screenshots and reproducible QA HTML are in `work/art-redesign/`: `before-after.png`, `all-boards.png`, `qa-redesign.html`, `qa-redesign-comparison.html`.

## 2026-10-04：清理未闭合装饰杂线

- 清理全部 8 张进阶画板的细装饰叠层：移除首饰周围悬空短线、珠链下重复弧线、错位高光及风景划痕。保留角色表情、猫须和吊盆连接线，木马眼睛与头部位置对齐。
- 与清理前数据逐项比较，全部色块几何、ID、数量和价格完全一致，不影响已有配色。
- 浏览器逐张检查线稿，全部区域仍可见；8 张画板均成功导出 1440×1440 PNG，浏览器错误日志为空。相关测试 24 项通过。
- 截图：`work/art-cleanup/all-boards.png`、`work/art-cleanup/before-after.png`。同目录 QA HTML 可临时复制到 dist 复现。
