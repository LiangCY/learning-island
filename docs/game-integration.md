# 新游戏接入

游戏乐园的入口是 `#/games`。大厅根据 `dist/game-catalog.js` 中的注册目录自动生成卡片。当前接入花园小园丁、欢乐水族馆、伙伴五子棋和涂色小画室；新增游戏无需修改大厅和主应用的页面分支。

## 文件与职责

- `game-catalog.js`：游戏 ID、展示信息、存档规范化函数和 UI 工厂。
- `games-ui.js`：大厅与公共钱包展示。
- `game-platform.js`：游戏宿主、实例切换、离开保护、存档迁移与原子事务。
- `game-wallet.js`：练习奖励、游戏币收入、消费记录、购买去重与余额校验。
- `coloring-ui.js`：画室、草稿、作品等涂色交互。
- `coloring.js`：涂色的数据规则；旧接口仍可用于单独验证和小屋挂画读取。

## 1. 注册游戏

创建自己的逻辑和 UI 文件，在 `game-catalog.js` 导入，并向注册数组加入一项：

```js
{
  id: 'puzzle',
  name: '趣味拼图',
  category: '观察与思考',
  icon: '◇',
  description: '拼出一幅自己的小风景。',
  features: ['关卡进度自动保存'],
  normalize: normalizePuzzle,
  createUI: createPuzzleUI
}
```

`id` 必须唯一，由字母、数字、下划线或连字符组成，最长 80 字符；禁止原型保留名称。已发布的 ID 保持稳定。`normalize(value, history)` 必须同步返回可 JSON 序列化的存档，能处理空数据和损坏字段；各游戏在自己的数据里维护版本和迁移规则。UI 工厂只在进入该游戏时运行。

## 2. 实现界面接口

```js
export function createPuzzleUI({app, game, go, toast, onRouteChange, isActive}) {
  const events = new AbortController();
  let params = {}, saving = false;

  function openRoute(next = {}) {
    params = {level: String(next.level || 1)};
    // 用自己的界面渲染 app；通过 game.read() 读取当前进度。
    onRouteChange(params);
  }

  return {
    openRoute,
    routeParams: () => params,
    beforeLeave: () => !saving,
    dispose: () => events.abort()
  };
}
```

四个方法都是必需的。`openRoute` 渲染或恢复游戏页面；`routeParams` 返回该游戏的路由参数；`beforeLeave` 在保存尚未完成或失败时返回 `false` 并给出提示；`dispose` 取消定时器、监听器及仍在运行的交互。窗口、键盘和共享弹窗事件使用自己的 `AbortController.signal`，并用 `isActive()` 检查当前游戏。异步渲染也应检查当前实例是否仍有效。

共享上下文还提供 `modal`、`history()`、`toast()`、`chime()`、`visitRoom(room)` 和主应用导航 `go(view, params)`。`storage` 为现有画室的编辑上下文兼容而保留；新游戏的持久数据统一通过 `game` 写入，不直接覆盖公共存档。

## 3. 保存与购买

```js
const state = game.read();                  // 当前游戏的独立快照
const balance = game.wallet().balance;      // 全游戏共享余额
await game.update(state => ({...state, bestScore: 100}));

await game.purchase(
  {id: 'level-2', paid: 30},
  state => ({...state, unlocked: [...state.unlocked, 'level-2']})
);
const unlocked = game.owns('level-2');
```

更新回调必须同步、无外部副作用；从参数获得最新存档，避免用之前读取的完整存档覆盖它。返回的数据会经过该游戏的 `normalize`。`purchase` 将消费和新进度放在同一笔事务中，金额必须为正整数。余额不足、重复购买、回调失败或浏览器写入失败都不会提交存档；UI 要捕获错误并提示。消费 ID 在当前游戏内唯一，不同游戏可以使用同一个 ID。按次消费应为每次生成独立 ID，例如 `crypto.randomUUID()`。

也可以像画室一样声明 `purchases(state)`，返回持有物品的 `{id, paid}` 列表。平台在 `game.update` 中自动对新增条目收费，适合已有独立购买逻辑的游戏。该方式和 `game.purchase` 不能对同一物品同时使用。消费记录不会因为删除作品、重置进度或暂时移除游戏而退还。

平台将事务排入队列，在每次执行时重读最新存档；支持 Web Locks 的浏览器还会使用同一把锁协调多个标签页。无 Web Locks 时仍有当前页面的串行队列，但无法保证多个标签页同时写入的互斥；日常使用避免在此类浏览器中同时操作多个标签页。

## 4. 路由与离开

- 大厅：`go('games', {})`，地址 `#/games`。
- 游戏：`go('games', {game: 'puzzle', level: '2'})`。
- 游戏内切换：`onRouteChange({level: '3'})`；宿主自动补上当前游戏 ID。
- 游戏内更新：`onRouteChange(params, {replace: true})`，适合更新当前作品 ID。

游戏参数由各游戏验证。未知游戏会返回大厅并提示；主路由处理刷新、前进、后退和保存保护。离开游戏、返回大厅或切换到其他游戏时，宿主调用 `dispose()`；再次进入会创建新的 UI 实例。

旧画室链接如 `#/games?tab=gallery`、`#/games?tab=studio&board=cat` 和小屋的展示墙入口仍可用，并会规范化为带 `game=coloring` 的地址。

## 5. 存档兼容

继续使用 `math-island-v1:games`，不新增账号或数据库：

```js
{
  version: 3,
  wallet: {
    purchases: [{gameId: 'coloring', id: 'board-cat', paid: 20}]
  },
  modules: {
    coloring: {version: 2, purchases: [], framePurchases: [], drafts: {}, works: [], wall: []},
    puzzle: {version: 1, unlocked: [], bestScore: 0}
  }
}
```

旧 v1/v2 画室存档在读取时转换为这个结构；首次成功写入才落盘。旧画板、画框、草稿、作品、展示墙及游戏币余额继续保留。奖励收入仍从练习历史计算，初始 120 币、每个非空填答 2 币，同一轮去重。公共钱包记录成交金额，读取时不按新商品价格重新计算公共消费。

未注册游戏的存档和消费记录会保留，后续恢复注册可以继续使用。小屋通过涂色兼容读取接口获取挂画，画室更新不会覆盖其他游戏的进度。

## 画室内的作品拼图

作品拼图属于涂色游戏的玩法，通过 `#/games?game=coloring&tab=puzzle` 进入；选图地址携带 `work` 和 `level`，进行中的地址携带 `session`。`coloring-ui.js` 管理 tab 和生命周期，`artwork-puzzle-ui.js` 通过画室的同一事务接口保存进度，离开时释放指针监听、拖动浮层和图片 Blob URL。

`modules.coloring.puzzles` 是可选字段，不修改画室 v2 旧字段：`{version:1,current,records}`。当前会话保存作品快照、难度、打乱顺序、已放好的图块、尝试次数、提示次数及完成时间；最多保留 60 条完成记录，并按会话 ID 去重。作品快照仍通过画室的画板、色块、颜色和效果校验，能够独立于原作品继续恢复。

`artwork-puzzle.js` 管理 4×4、5×5、6×6 规则及互补接口。`coloringCanvas` 先渲染完整作品，图块和原图参考再共用这张图片，保留水彩、像素等效果。拼图免费，不新增消费记录，也不会更新原作品、草稿或展示墙。作品编辑和删除时必须继续保留该字段。

模型与事务测试见 `tests/artwork-puzzle.test.mjs`，实际桌面和手机交互记录见 `tests/artwork-puzzle-browser-qa.md`。

原来的 3×3（`easy`）已从难度选项移除。旧会话保留作品快照，转换成新的 6×6（`expert`）会话并重置进度；旧槽位不能直接映射到新网格。旧已完成记录继续按 9 块保留原统计，4×4 和 5×5 存档不变。

## 验证

运行 `npm test`。`tests/game-platform.test.mjs` 使用测试游戏验证迁移、共享余额、游戏数据隔离、重复购买、透支、并发事务、失败回滚和 UI 生命周期。每个新增游戏还应验证自己的存档规范化、玩法和浏览器交互。


## 已接入的布置与棋类游戏

花园与水族馆共用 `decor-ui.js`，差异在 `decor-catalog.js`：商品、分类、免费收藏、初始场景、鱼缸/灯光装备和素材编号。新增同类物品时，使用稳定商品 ID，添加独立素材窗口，并验证所有尺寸下的摆放边界。图集的原始 PNG 不做二次像素修改；`scripts/prepare-playground-art.py` 分析连通透明区域，生成 CSS 裁切窗口，避免鱼鳍和叶片跨格时被截断。

每次成交通过 `game.purchase` 原子解锁并摆放；同一物品后续通过 `game.update` 免费复用。物品实例使用独立 UUID，收藏 ID 与实例 ID 分开，收起/清空不会丢失已购收藏。装备切换只改变槽位，不占场景物品数量。

五子棋将棋谱、双方伙伴、模式、难度、执子颜色和偏好放在自己的模块。AI 与提示使用模块 Worker；离开、开新局或悔棋时取消旧任务。落子事务校验原始局面，避免其他标签页先落子后，旧计算结果再落入新局面。规则、棋力与界面分开，新增难度可在 `gomoku.js` 调整搜索参数和策略，并补充实际战术验证。


### 水族馆多缸与水体约束

`aquarium` 模块存档版本为 5，保存 `{owned, activeTankId, tanks, migrationNotice}`。每口缸有稳定 `id`，独立 `name / water / tank / light / objects`，`water` 为 `fresh`（淡水）或 `salt`（海水）。收藏共享，布局不共享。物品 `water` 为 `fresh / salt / both`；配饰与灯光为 `both`。添加物品时必须明确其水体，模型与商店都要校验，不能只隐藏按钮。新增图集物品通过 `atlas` 指定素材来源。

`addAquariumTank` 每次创建空缸，最多 12 口。框架商品是款式，持有同款不代表下一口缸免费：通过 `game.purchase({id: 'tank-'+唯一编号, paid: aquariumTankPrice(item)}, ...)` 原子扣款并添加。原木首缸赠送，再购原木缸 28 币；每款价格固定，以商品价格为准。水体在购买时选择并固定，避免切换水体时误清理现有生物。收藏中的生物、配饰及灯光继续按解锁一次、反复使用处理。

布局修改通过 `decorScene`、`updateDecorScene` 和带 `tankId` 的摆放/撤下函数定向操作；异步排队前捕获目标缸 ID，避免其他标签切换当前缸造成写错。旧版平面存档迁移到首缸；旧混养场景将不兼容生物保留位置并迁入另一水体的独立缸。若已有 12 缸无法新建，物品撤回共享收藏并显示迁移提示。保存失败不扣币，不覆盖原存档。

`aquarium-motion.js` 使用瞬态二维速度、平滑转向和不同物种速度模拟活动，保存坐标只代表编辑锚点。编辑暂停游动；离开或重绘销毁动画帧及鱼食。喂食不扣币、不改存档；生物趋近食物后移除对应食物，显示爱心并更新实际进食数。减少动态偏好下停止持续游动，喂食即时反馈。


### 固定款式鱼缸与海底伙伴

`TANK_MODELS` 为 11 款鱼缸分别配置宽高、展示宽度、边框颜色与圆角。尺寸属于款式，不保存独立 `size` 字段；购买只选择水体。`tankStyle` 将款式映射为主场景、列表及购买预览共用的 CSS 变量；`tankDimensions` 统一显示宽高。新增款式时在商品目录和 `TANK_MODELS` 使用相同稳定 ID。

`aquariumTankPrice(item)` 返回固定价格，`addAquariumTank(..., water)` 创建对应款式。大小不参与摆放上限计算，全部鱼缸沿用每缸 48 件、18 位伙伴的既有规则。`decorObjectWidth` 和 `decorBounds` 根据鱼缸实际比例计算素材大小及边界，长缸中的素材按高度适配；拖动、规范化和游动都传入当前鱼缸款式，避免细长场景裁切生物。

版本 5 迁移移除旧大中小字段，保留鱼缸款式、名字、水体及原布置。原有三款仍是紧凑桌景，宽高比分别保持 3:2；旧混养存档按既有水体迁移规则处理。

`starfish` 与 `urchin` 使用独立 `seafloor` 2×1 原创透明图集，分类为海底伙伴，`water: salt`、`fish: true`、`motion: crawl`。共 20 种水中伙伴、52 款商品。爬行速度低于海蟹，不进行鱼类的左右翻转；喂食落在附近缸底，避免慢速生物追不到远处鱼食。添加新图集时在素材脚本中配置列数与行数。
