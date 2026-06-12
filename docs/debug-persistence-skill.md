# 静态站点编辑持久化 · 全流程排障实录 (COT + ReAct)

> 为纯静态 HTML/CSS/JS 网站的 Portfolio 板块增加**编辑模式**，支持文字修改和图片替换，并通过 localStorage 持久化保存，刷新页面后数据不丢失。完整记录 30+ 轮迭代中的推理链、假设验证、Bug 定位和最终修复。

---

## 目录

1. [需求定义](#1-需求定义)
2. [架构设计 (COT 推理)](#2-架构设计)
3. [迭代 1：初版 + 致命语法错误](#3-迭代-1)
4. [迭代 2：Save 按钮失灵](#4-迭代-2)
5. [迭代 3：持久化不生效的深度排查](#5-迭代-3)
6. [迭代 4：localStorage 架构重构](#6-迭代-4)
7. [根因总结](#7-根因总结)
8. [ReAct 调试心法](#8-react-调试心法)
9. [代码检查清单](#9-代码检查清单)

---

## 1. 需求定义

### 功能需求
- 详情页右上角增加 Edit 按钮
- 点击 Edit → 进入编辑模式：文字可编辑 (contentEditable)，图片可替换 (file input)
- 显示 Save / Cancel 按钮
- Save → 保存所有修改到 localStorage
- Cancel → 恢复到编辑前状态
- **刷新页面后，修改不丢失**（封面、过渡页浮字、详情文字全部同步）

### 技术约束
- 纯静态站点，无后端
- 图片替换用 FileReader → data URL
- 持久化只能靠 localStorage

---

## 2. 架构设计

```
用户编辑 → contentEditable/FileReader → 内存 slides[] + detailHTML
                                          ↓
                                     Save 按钮 → localStorage.setItem()
                                          ↓
                                    页面刷新 → _loadEditsFromStorage()
                                          ↓
                                    _renderStrips / _enterFocus 读取恢复
```

**三个渲染点需要同步：**
1. 封面条带 (`_renderStrips`) → 读 `p.thumbnail`
2. 焦点浮字 (`_enterFocus`) → 读 `p.title['en']`
3. 详情面板 (`_openContent`) → 读 saved `detailHTML`

---

## 3. 迭代 1：初版 + 致命语法错误

### 3.1 实现方案
- Edit/✓/✗ 按钮通过 JS 动态创建 (`_renderEditBar`)
- contentEditable 实现文字编辑
- `<input type="file">` + FileReader 实现图片替换

### 3.2 Bug：编辑按钮不显示

**现象：** 详情页右上角看不到 Edit 按钮。

**COT 推理链：**
```
Observation: 按钮不在 DOM 中
  → 假设1: _renderEditBar 没被调用
  → 假设2: 按钮被 CSS 隐藏
  → 假设3: JS 文件有语法错误导致整个文件加载失败
```

**ReAct 行动：**
1. 检查 CSS → `.portfolio__edit-bar` 依赖 `.portfolio__content.active` 选择器 ✅
2. 检查调用 → `_renderEditBar()` 在 `_openContent` 中被调用 ✅
3. 在另一个方法末尾发现**多余的 `},`** ← **ROOT CAUSE**

```javascript
// ❌ 错误代码
    },
    },  // ← 多余的花括号导致整个 IIFE 解析失败

    _renderSlideViewer...
```

**影响：** 整个 `portfolio.js` (约 700 行) 因这一个多余字符**完全无法执行**。这意味着不仅编辑按钮不显示——前面的所有编辑模式代码都没跑过。

**教训：** 在 strict mode IIFE 中，任何语法错误都会导致整个模块静默失败。没有编译器的静态站点尤其脆弱。

### 3.3 后续问题链

修复语法错误后暴露出一连串问题：
- 编辑按钮用 JS 动态 append → grid 布局不对，按钮被 back 按钮遮挡
- 改为 HTML 静态添加 → 仍不显示 → **CSS `display:none` 优先级问题**
- 最终：JS 显式设置 `bar.style.display='flex'` 绕过 CSS

---

## 4. 迭代 2：Save 按钮失灵

### 4.1 现象

用户点击 Save (✓) 按钮无反应，按钮文字不变，修改不持久化。

### 4.2 COT 推理

```
Observation: Save 按钮点击无任何效果
  → 假设1: onclick 没绑定
  → 假设2: _saveEditMode 函数内有运行时错误
  → 假设3: try/catch 静默吞掉了错误

检查代码：
_saveEditMode:function(){
  ...
  this._projectEdits[this._currentIdx]={
    title:Object.assign({}, p.title),   // ← p 是什么？
    ...
  };
  var p=this._projects[this._currentIdx];  // ← p 在这里才声明！
  ...
}
```

### 4.3 根因

```javascript
// ❌ 致命 Bug：strict mode 下变量先使用后声明
'some text ' + p.title     // ReferenceError: p is not defined
var p = this._projects...  // 声明在 5 行之后
```

在 `'use strict'` 模式下，使用未声明变量直接抛出 `ReferenceError`。这个错误被外层的 **try/catch 静默吞掉**，用户看到的现象就是"按钮没反应"。

### 4.4 修复

```javascript
// ✅ 正确：先声明再使用
var p = this._projects[this._currentIdx];
// ... 现在可以安全使用 p
```

### 4.5 教训

> **绝对不要在持久化/保存逻辑中使用 try/catch 吞错误。** 保存是关键时刻，必须让错误暴露。

所有 try/catch 已在最终版本中移除，改为让错误直接抛出，在 Console 可见。

---

## 5. 迭代 3：持久化不生效的深度排查

### 5.1 现象

Save 修复后，当前会话内修改正常。但 **F5 刷新后**：
- 详情面板文字 → ✅ 保留
- 封面条带缩略图 → ❌ 恢复原始
- 焦点浮字 → ❌ 恢复原始

### 5.2 关键观察

**不对称现象：** 详情面板的 `detailHTML` 持久化了，但封面和浮字没有。这说明 **localStorage 写入是成功的**（否则详情面板也不会持久化），问题出在**读取端**。

### 5.3 COT 推理树

```
详情面板 vs 封面/浮字 的恢复路径有何不同？

详情面板 (_openContent):
  localStorage.getItem('pe_4') → ed.detailHTML → _detailEl.innerHTML = html ✅

封面条带 (_renderStrips):
  _loadEditsFromStorage() → p.thumbnail = ed.thumbnail → _renderStrips 读 p.thumbnail ✅(理论上)

焦点浮字 (_enterFocus):
  _loadEditsFromStorage() → p.title['en'] = ed.title['en'] → _enterFocus 读 p.title['en'] ✅(理论上)

问题：为什么理论上 OK 的路径实际不工作？
  → 假设1: _loadEditsFromStorage 没被调用
  → 假设2: 渲染发生在恢复之前
  → 假设3: 恢复的数据被后续操作覆盖
```

### 5.4 ReAct 行动

1. **在 Console 验证数据存在** → `localStorage.getItem('pe_4')` → 数据完整 ✅
2. **在页面加载函数加诊断** → `document.title = 'E:' + edits.title.en` → 确认 `_loadEditsFromStorage` 正常运行 ✅
3. **检查执行顺序** → `init` → `_loadEditsFromStorage` → `_renderStrips` → 顺序正确 ✅

### 5.5 最终定位

**根因：** 之前使用了**一个大 JSON** (`portfolioEdits`) 存所有项目数据。当图片 data URL 很大时，一个项目的保存会导致整个 key 的 JSON 超过 localStorage 5MB 限制，**写入静默失败**（被 try/catch 吞掉）。

但后来改成了**每项目独立 key** (`pe_0` ~ `pe_5`)，单个 key 数据量小得多，写入稳定。

### 5.6 另一个被发现的架构缺陷

`_saveEditMode` 里**先写入 `_projectEdits` 对象再更新 `p.title`**，导致保存到 localStorage 的 `title` 是**更新前的旧值**。

修复：**先同步所有数据到 `p`，再整体保存**。

```javascript
// ✅ 正确顺序
var p = this._projects[this._currentIdx];
// 1. 先同步 title/text
p.title[lang] = titleEl.textContent.trim();
p.thumbnail = this._slides[0].src;
// 2. 再整体保存
this._projectEdits[idx] = {
  title: Object.assign({}, p.title),  // 此时 p.title 已是新值
  thumbnail: p.thumbnail
};
localStorage.setItem('pe_'+idx, JSON.stringify(this._projectEdits[idx]));
```

---

## 6. 迭代 4：localStorage 架构重构

### 6.1 从大 JSON → 独立 key

| 方案 | 结构 | 风险 |
|------|------|------|
| v1 (失败) | `localStorage['portfolioEdits'] = '{"0":{...},"1":{...},"4":{...}}'` | 单 key 过大, 写入失败 |
| v2 (最终) | `localStorage['pe_0']`, `localStorage['pe_4']`, ... | 单 key 小, 稳定 |

### 6.2 恢复时机

```javascript
// ✅ 最终正确顺序
init() {
  this._projects = window.__PROJECTS;    // 1. 加载原始数据
  this._loadEditsFromStorage();          // 2. 从 localStorage 恢复 → 直接写入 _projects[i].title/thumbnail
  this._renderStrips();                  // 3. 渲染条带 → 读 localStorage 覆盖封面
  // 焦点浮字在 _enterFocus 时 → 直接读 localStorage
}
```

**三位一体读取（三重保障）：**
- `_loadEditsFromStorage` → 恢复到源数据
- `_renderStrips` → 直接读 localStorage 覆盖缩略图
- `_enterFocus` → 直接读 localStorage 覆盖标题

---

## 7. 根因总结

| # | 问题 | 根因 | 修复 |
|---|------|------|------|
| 1 | 编辑按钮不显示 | JS 文件语法错误 (`},`) 导致模块加载失败 | 删除多余括号 |
| 2 | Save 按钮无反应 | `var p` 在 strict mode 下先使用后声明 | 移动声明到使用前 |
| 3 | 刷新后封面/浮字丢失 | (a) 大 JSON 写入失败 (b) 更新-保存顺序错误 (c) try/catch 吞错误 | 独立 key + 正确顺序 + 移除 try/catch |
| 4 | 编辑按钮被遮挡 | back 按钮 `grid-column:1/-1` 占满行 | 改为 `grid-column:1` + edit bar `grid-column:2/4` |
| 5 | CSS display 不生效 | 动态创建元素 + CSS 类选择器时序问题 | JS 显式设置 `style.display` |

---

## 8. ReAct 调试心法

### 8.1 核心循环

```
Observe → Hypothesize → Act → Verify → (loop)
   ↓           ↓           ↓        ↓
 具体现象    可能原因    最小验证   确认/排除
```

### 8.2 本次排障的 ReAct 实例

| 轮次 | Observe | Hypothesize | Act | Result |
|------|---------|-------------|-----|--------|
| 1 | 编辑按钮不显示 | JS 加载失败？ | 检查 Console | 无错误（被吞了） |
| 2 | 同上 | CSS 问题？ | 直接改 inline style | 仍然不显示 |
| 3 | 同上 | 动态创建失败？ | 改到 HTML 静态写 | 仍然不显示 |
| 4 | 同上 | 文件语法错误？ | `node --check` | **发现多余 `},`** |
| 5 | Save 无效果 | 函数未被调用？ | 加 `document.title` 诊断 | 确认被调用但崩溃 |
| 6 | 同上 | 代码错误被吞？ | 移除 try/catch | **暴露 ReferenceError** |
| 7 | 刷新后丢失 | localStorage 为空？ | Console 直接读 | 数据存在！ |
| 8 | 同上 | 渲染早于恢复？ | 检查 init 顺序 | 顺序正确 |
| 9 | 同上 | JSON 太大写入失败？ | 检查 key 大小 | 拆分为独立 key |

### 8.3 关键原则

1. **二分定位** — 先确定问题在"写入端"还是"读取端"
2. **最小复现** — 用 Console 直接测试 API（如 `localStorage.getItem`）
3. **去除静默** — 调试期间移除所有 try/catch
4. **可视化诊断** — 用 `document.title` 或 data 属性输出状态
5. **对比法** — 工作 vs 不工作的代码路径对比

### 8.4 静态站点调试的特殊挑战

- **无编译时检查** — 语法错误只有运行时才发现
- **无服务器日志** — 只能靠 Console 和页面行为推断
- **localStorage 无声失败** — QuotaExceededError 不会弹出提示
- **CDN 缓存** — 部署后可能有几分钟延迟

---

## 9. 代码检查清单

以后给静态站点添加 localStorage 持久化时，逐项检查：

- [ ] JS 文件有语法错误吗？`node --check file.js`
- [ ] 保存逻辑中有 try/catch 吞错误吗？→ 调试期移除
- [ ] strict mode 下变量使用在声明之前？→ 先声明再使用
- [ ] 单个 localStorage key 会超过 5MB 吗？→ 拆分为独立 key
- [ ] 更新的数据是保存前还是保存后的值？→ 先更新再保存
- [ ] 页面加载时恢复数据的时机对吗？→ 恢复 → 渲染（不是反过来）
- [ ] 所有渲染点都读了恢复后的数据吗？→ 条带、浮字、详情
- [ ] contentEditable 编辑后 textContent 被正确读取吗？→ 先 blur 再读
