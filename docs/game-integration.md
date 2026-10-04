# 新游戏接入

游戏乐园的入口是 `#/games`。大厅根据 `dist/game-catalog.js` 中的注册目录自动生成卡片。当前接入的正式游戏是涂色小画室；新增游戏无需修改大厅和主应用的页面分支。

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

## 验证

运行 `npm test`。`tests/game-platform.test.mjs` 使用测试游戏验证迁移、共享余额、游戏数据隔离、重复购买、透支、并发事务、失败回滚和 UI 生命周期。每个新增游戏还应验证自己的存档规范化、玩法和浏览器交互。
