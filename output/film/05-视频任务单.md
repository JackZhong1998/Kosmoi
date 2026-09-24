# 生视频提交任务单（p01 / p02a / p02b / p02c / p03merge）

资产节点 9 个 + 镜头节点 53 个，全部**状态 prompt_ready，尚未调用**。T2I / I2V 模型名一律标 `<未核验>`，不作已可用的假设。

---

## 一、【提交总序】

规则：img- 全部先提交（先资产、后每镜静帧），全部通过硬验收后再放行 SH- 的 I2V。三条分支（07a 签 / 07b 抽赝品 / 07c 拍赝品）**并列提交，不合并**。

### A. 资产静帧（img-，9 条）

| # | 任务名 | 依赖 | 模型 | 入口 | 状态 |
|---|---|---|---|---|---|
| 1 | img-CHAR-player | — | `<T2I-未核验>` | T2I | prompt_ready |
| 2 | img-CHAR-cheng | — | `<T2I-未核验>` | T2I | prompt_ready |
| 3 | img-LOOK-player-default | img-CHAR-player | `<T2I-未核验>` | T2I | prompt_ready |
| 4 | img-LOOK-cheng-agent | img-CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 5 | img-SCENE-echo-store | — | `<T2I-未核验>` | T2I | prompt_ready |
| 6 | img-PROP-record-fake | img-SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 7 | img-PROP-intent-letter | — | `<T2I-未核验>` | T2I | prompt_ready |
| 8 | img-PROP-folder-kraft | — | `<T2I-未核验>` | T2I | prompt_ready |
| 9 | img-DETAIL-cheng-scar-ring | img-CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |

→ **门槛**：1–9 全部通过身份/服装/坏灯/空位/赝品三特征冻结后才开 B。

### B. 每镜关键帧静帧（img-SH-*，53 条）

| # | 任务名 | 依赖 | 模型 | 入口 | 状态 |
|---|---|---|---|---|---|
| 10 | img-SH-p01-01 | CHAR-player, SCENE-echo-store, PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 11 | img-SH-p01-02 | 同上 | `<T2I-未核验>` | T2I | prompt_ready |
| 12 | img-SH-p01-03 | SE-echo-store, PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 13 | img-SH-p01-04 | SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 14 | img-SH-p01-05 | SCENE-echo-store, PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 15 | img-SH-p01-06 | CHAR-player, PROP-intent-letter | `<T2I-未核验>` | T2I | prompt_ready |
| 16 | img-SH-p01-07 | CHAR-player, PROP-intent-letter, PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 17 | img-SH-p01-07a | 同 16 | `<T2I-未核验>` | T2I | prompt_ready |
| 18 | img-SH-p01-07b | 同 16 | `<T2I-未核验>` | T2I | prompt_ready |
| 19 | img-SH-p01-07c | 同 16 | `<T2I-未核验>` | T2I | prompt_ready |
| 20 | img-SH-p02a-01 | CHAR-player, CHAR-cheng, SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 21 | img-SH-p02a-02 | CHAR-player, PROP-intent-letter | `<T2I-未核验>` | T2I | prompt_ready |
| 22 | img-SH-p02a-03 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 23 | img-SH-p02a-04 | CHAR-player | `<T2I-未核验>` | T2I | prompt_ready |
| 24 | img-SH-p02a-05 | CHAR-player, CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 25 | img-SH-p02a-06 | CHAR-player, CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 26 | img-SH-p02a-07 | CHAR-player, PROP-intent-letter, PROP-folder-kraft | `<T2I-未核验>` | T2I | prompt_ready |
| 27 | img-SH-p02a-07a | PROP-folder-kraft | `<T2I-未核验>` | T2I | prompt_ready |
| 28 | img-SH-p02a-07b | PROP-folder-kraft | `<T2I-未核验>` | T2I | prompt_ready |
| 29 | img-SH-p02b-01 | PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 30 | img-SH-p02b-02 | CHAR-player, CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 31 | img-SH-p02b-03 | PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 32 | img-SH-p02b-04 | CHAR-player, CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 33 | img-SH-p02b-05 | CHAR-cheng, SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 34 | img-SH-p02b-06 | CHAR-player, CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 35 | img-SH-p02b-07 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 36 | img-SH-p02b-08a | CHAR-cheng, PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 37 | img-SH-p02b-08b | PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 38 | img-SH-p02c-01 | PROP-record-fake, SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 39 | img-SH-p02c-02 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 40 | img-SH-p02c-03 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 41 | img-SH-p02c-04 | CHAR-player, CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 42 | img-SH-p02c-05 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 43 | img-SH-p02c-06 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 44 | img-SH-p02c-07 | CHAR-player | `<T2I-未核验>` | T2I | prompt_ready |
| 45 | img-SH-p02c-08 | CHAR-cheng, SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 46 | img-SH-p02c-09 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 47 | img-SH-p02c-10 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 48 | img-SH-p02c-11 | CHAR-player, PROP-intent-letter, PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 49 | img-SH-p02c-12a | CHAR-player, CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 50 | img-SH-p02c-12b | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 51 | img-SH-p02c-13a | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 52 | img-SH-p02c-13b | CHAR-player, CHAR-cheng, DETAIL-cheng-scar-ring | `<T2I-未核验>` | T2I | prompt_ready |
| 53 | img-SH-p03merge-01 | CHAR-player, CHAR-cheng, SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 54 | img-SH-p03merge-02 | CHAR-cheng | `<T2I-未核验>` | T2I | prompt_ready |
| 55 | img-SH-p03merge-03 | CHAR-cheng, PROP-folder-kraft | `<T2I-未核验>` | T2I | prompt_ready |
| 56 | img-SH-p03merge-04 | SCENE-echo-store, PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 57 | img-SH-p03merge-05 | CHAR-cheng, SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 58 | img-SH-p03merge-06 | SCENE-echo-store | `<T2I-未核验>` | T2I | prompt_ready |
| 59 | img-SH-p03merge-07 | PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 60 | img-SH-p03merge-08 | PROP-record-fake | `<T2I-未核验>` | T2I | prompt_ready |
| 61 | img-SH-p03merge-09a | CHAR-player, PROP-folder-kraft | `<T2I-未核验>` | T2I | prompt_ready |
| 62 | img-SH-p03merge-09b | SCENE-echo-store, PROP-folder-kraft | `<T2I-未核验>` | T2I | prompt_ready |

### C. 镜头运动（SH-*，53 条）

| # | 任务名 | 依赖 | 模型 | 入口 | 状态 |
|---|---|---|---|---|---|
| 63 | SH-p01-01 | img-SH-p01-01 | `<I2V-未核验>` | I2V | prompt_ready |
| 64 | SH-p01-02 | img-SH-p01-02 | `<I2V-未核验>` | I2V | prompt_ready |
| 65 | SH-p01-03 | img-SH-p01-03 | `<I2V-未核验>` | I2V | prompt_ready |
| 66 | SH-p01-04 | img-SH-p01-04 | `<I2V-未核验>` | I2V | prompt_ready |
| 67 | SH-p01-05 | img-SH-p01-05 | `<I2V-未核验>` | I2V | prompt_ready |
| 68 | SH-p01-06 | img-SH-p01-06 | `<I2V-未核验>` | I2V | prompt_ready |
| 69 | SH-p01-07 | img-SH-p01-07 | `<I2V-未核验>` | I2V | prompt_ready |
| 70 | SH-p01-07a | img-SH-p01-07a | `<I2V-未核验>` | I2V | prompt_ready |
| 71 | SH-p01-07b | img-SH-p01-07b | `<I2V-未核验>` | I2V | prompt_ready |
| 72 | SH-p01-07c | img-SH-p01-07c | `<I2V-未核验>` | I2V | prompt_ready |
| 73 | SH-p02a-01 | img-SH-p02a-01 | `<I2V-未核验>` | I2V | prompt_ready |
| 74 | SH-p02a-02 | img-SH-p02a-02 | `<I2V-未核验>` | I2V | prompt_ready |
| 75 | SH-p02a-03 | img-SH-p02a-03 | `<I2V-未核验>` | I2V | prompt_ready |
| 76 | SH-p02a-04 | img-SH-p02a-04 | `<I2V-未核验>` | I2V | prompt_ready |
| 77 | SH-p02a-05 | img-SH-p02a-05 | `<I2V-未核验>` | I2V | prompt_ready |
| 78 | SH-p02a-06 | img-SH-p02a-06 | `<I2V-未核验>` | I2V | prompt_ready |
| 79 | SH-p02a-07 | img-SH-p02a-07 | `<I2V-未核验>` | I2V | prompt_ready |
| 80 | SH-p02a-07a | img-SH-p02a-07a | `<I2V-未核验>` | I2V | prompt_ready |
| 81 | SH-p02a-07b | img-SH-p02a-07b | `<I2V-未核验>` | I2V | prompt_ready |
| 82 | SH-p02b-01 | img-SH-p02b-01 | `<I2V-未核验>` | I2V | prompt_ready |
| 83 | SH-p02b-02 | img-SH-p02b-02 | `<I2V-未核验>` | I2V | prompt_ready |
| 84 | SH-p02b-03 | img-SH-p02b-03 | `<I2V-未核验>` | I2V | prompt_ready |
| 85 | SH-p02b-04 | img-SH-p02b-04 | `<I2V-未核验>` | I2V | prompt_ready |
| 86 | SH-p02b-05 | img-SH-p02b-05 | `<I2V-未核验>` | I2V | prompt_ready |
| 87 | SH-p02b-06 | img-SH-p02b-06 | `<I2V-未核验>` | I2V | prompt_ready |
| 88 | SH-p02b-07 | img-SH-p02b-07 | `<I2V-未核验>` | I2V | prompt_ready |
| 89 | SH-p02b-08a | img-SH-p02b-08a | `<I2V-未核验>` | I2V | prompt_ready |
| 90 | SH-p02b-08b | img-SH-p02b-08b | `<I2V-未核验>` | I2V | prompt_ready |
| 91 | SH-p02c-01 | img-SH-p02c-01 | `<I2V-未核验>` | I2V | prompt_ready |
| 92 | SH-p02c-02 | img-SH-p02c-02 | `<I2V-未核验>` | I2V | prompt_ready |
| 93 | SH-p02c-03 | img-SH-p02c-03 | `<I2V-未核验>` | I2V | prompt_ready |
| 94 | SH-p02c-04 | img-SH-p02c-04 | `<I2V-未核验>` | I2V | prompt_ready |
| 95 | SH-p02c-05 | img-SH-p02c-05 | `<I2V-未核验>` | I2V | prompt_ready |
| 96 | SH-p02c-06 | img-SH-p02c-06 | `<I2V-未核验>` | I2V | prompt_ready |
| 97 | SH-p02c-07 | img-SH-p02c-07 | `<I2V-未核验>` | I2V | prompt_ready |
| 98 | SH-p02c-08 | img-SH-p02c-08 | `<I2V-未核验>` | I2V | prompt_ready |
| 99 | SH-p02c-09 | img-SH-p02c-09 | `<I2V-未核验>` | I2V | prompt_ready |
| 100 | SH-p02c-10 | img-SH-p02c-10 | `<I2V-未核验>` | I2V | prompt_ready |
| 101 | SH-p02c-11 | img-SH-p02c-11 | `<I2V-未核验>` | I2V | prompt_ready |
| 102 | SH-p02c-12a | img-SH-p02c-12a | `<I2V-未核验>` | I2V | prompt_ready |
| 103 | SH-p02c-12b | img-SH-p02c-12b | `<I2V-未核验>` | I2V | prompt_ready |
| 104 | SH-p02c-13a | img-SH-p02c-13a | `<I2V-未核验>` | I2V | prompt_ready |
| 105 | SH-p02c-13b | img-SH-p02c-13b | `<I2V-未核验>` | I2V | prompt_ready |
| 106 | SH-p03merge-01 | img-SH-p03merge-01 | `<I2V-未核验>` | I2V | prompt_ready |
| 107 | SH-p03merge-02 | img-SH-p03merge-02 | `<I2V-未核验>` | I2V | prompt_ready |
| 108 | SH-p03merge-03 | img-SH-p03merge-03 | `<I2V-未核验>` | I2V | prompt_ready |
| 109 | SH-p03merge-04 | img-SH-p03merge-04 | `<I2V-未核验>` | I2V | prompt_ready |
| 110 | SH-p03merge-05 | img-SH-p03merge-05 | `<I2V-未核验>` | I2V | prompt_ready |
| 111 | SH-p03merge-06 | img-SH-p03merge-06 | `<I2V-未核验>` | I2V | prompt_ready |
| 112 | SH-p03merge-07 | img-SH-p03merge-07 | `<I2V-未核验>` | I2V | prompt_ready |
| 113 | SH-p03merge-08 | img-SH-p03merge-08 | `<I2V-未核验>` | I2V | prompt_ready |
| 114 | SH-p03merge-09a | img-SH-p03merge-09a | `<I2V-未核验>` | I2V | prompt_ready |
| 115 | SH-p03merge-09b | img-SH-p03merge-09b | `<I2V-未核验>` | I2V | prompt_ready |

---

## 二、【镜头任务卡】

按场压缩。每张卡字段：**本镜干什么 / Prompt 套 / 参考图职责 / 硬验收 / 失败降级**。Prompt 全文不重抄，指向对应 `SHOT_JOB id`。

### 场 P01（SH-p01-01 ~ SH-p01-07c）

**本场干什么**：翻页数到第四十一张 → 电话打断 → 坏灯与空位确认 → 门铃 → 扫货架确认赝品三特征 → 意向书与笔 → 停在选择，向三条互斥手部动作推出。

**Prompt 套**：`SH-p01-01` ~ `SH-p01-07`（各自引 `SHOT_JOB`）。
**参考图职责**：CHAR-player 控手部与服装；LOOK-player-default 控肤色温；SCENE-echo-store 控坏灯侧、货架层位、空位位置；PROP-record-fake 背面三特征；PROP-intent-letter 控纸笔朝向。

逐镜（每 id 一行）：

- **SH-p01-01｜数到第四十一张**：计数动作节点到位，坏灯一侧暗、另一侧暖；台面只在坏灯侧；画内不提前出现空位误显。降级：去掉数数过程，只留手停在第 41 张的终帧。
- **SH-p01-02｜电话打断**：手机亮屏插入不遮挡计数手势；player 视线由纸切到屏幕。降级：只留屏幕亮起的插入镜，不加接听。
- **SH-p01-03｜坏灯与空位**：坏灯一侧的位置与空位层必须与前镜一致。降级：改为静态对峙构图，无位移。
- **SH-p01-04｜门铃**：门的位置与店门内视角一致。降级：只保留门铃响时的门框近景。
- **SH-p01-05｜扫货架与赝品**：赝品三特征（封口、标签、边缘痕）在这一扫中不可提前全部露出，只露一到两个，留线索。降级：扫货架改为定点停留，不动镜。
- **SH-p01-06｜意向书与笔**：纸面朝向、笔的位置一致；不出现签名字样。降级：只保留纸+笔静置。
- **SH-p01-07｜选择停住镜**：手停在笔与赝品之间的中性位置。降级：改为半秒定帧，不加推近。
- **SH-p01-07a｜手将动（签）**：手朝笔方向，绝不触赝品。**与 07b/07c 互斥，不合并。**
- **SH-p01-07b｜手将动（抽赝品）**：手朝包外侧，绝不触笔。**互斥。**
- **SH-p01-07c｜手将动（拍赝品）**：手压在赝品上，不触笔不触包。**互斥。**

### 场 P02a（SH-p02a-01 ~ SH-p02a-07b）— 分支 A：签

**本场干什么**：台面关系 → 笔尖落纸 → 她低头看完最后一个字 → 从握到扣 →「行。」→「五年前。」→ 手停在笔上方 → 包外侧 / 包内袋。

**Prompt 套**：`SH-p02a-01` ~ `SH-p02a-07b`。
**参考图职责**：CHAR-cheng 控面部与手；PROP-intent-letter 定纸；PROP-folder-kraft 定包的外侧与内袋两视图。

- **SH-p02a-01｜台面关系**：两人位置与台面夹角与前镜一致。降级：改为单人半身×物件同框。
- **SH-p02a-02｜笔尖落纸**：只表现落笔瞬间，不出现完整签名。降级：只留笔尖触及纸面的静止帧。
- **SH-p02a-03｜她低头看完最后一个字**：视线落点与纸面文字方向一致。降级：只留低头姿态，不加眼神扫行。
- **SH-p02a-04｜从握到扣**：笔从握持到扣平的动作一次完成，不出现第二次抬手。降级：拆成两段——握→停，停→扣。
- **SH-p02a-05｜「行。」**：口型同步为单字，不叠加其他手势。降级：只留口型帧。
- **SH-p02a-06｜「五年前。」**：同上，不加多余动作。降级：只留口型帧。
- **SH-p02a-07｜手停在笔上方**：手悬停位置对齐笔轴心。降级：只留静止悬停。
- **SH-p02a-07a｜包外侧**：外侧无内袋翻折，皮质纹理一致。降级：单手部特写。
- **SH-p02a-07b｜包内袋**：内袋开口方向与 07a 反侧，不出现赝品。降级：只留袋口静止。

### 场 P02b（SH-p02b-01 ~ SH-p02b-08b）— 分支 B：抽赝品

**本场干什么**：背面三特征 → 谁卖给他的 → 收笔 → 五年前来过 → 靠住台角 → 要债 → 你还想问什么 → 把赝品推给她 / 翻回正面扣在台上。

**Prompt 套**：`SH-p02b-01` ~ `SH-p02b-08b`。
**参考图职责**：PROP-record-fake 背面三特征必须与前场一致；DETAIL-cheng-scar-ring 在对位时入画但**不做强调**。

- **SH-p02b-01｜背面三特征**：封口、标签、边缘痕三点全部同框且与前镜一致。降级：改为三点分切。
- **SH-p02b-02｜谁卖给他的**：视线方向指向前一场她所在侧，不越轴。降级：只留口型+正面。
- **SH-p02b-03｜收笔**：笔归位，纸不被带走。降级：只留笔入笔座。
- **SH-p02b-04｜五年前来过**：背景不出现 P01 已出现的空位误显。降级：只留正面提及。
- **SH-p02b-05｜靠住台角**：与台角接触点不穿模。降级：改为半身近景。
- **SH-p02b-06｜要债**：不做体积夸张；不出现纸币。降级：只留口型+半身。
- **SH-p02b-07｜你还想问什么**：视线落点对赝品，不对笔。降级：静止帧。
- **SH-p02b-08a｜把赝品推给她**：推向方向她一侧，不越轴；不触她手。**与 08b 互斥。**
- **SH-p02b-08b｜翻回正面扣在台上**：翻面过程不超过一次，正面朝上落台，三特征收起。**与 08a 互斥。**

### 场 P02c（SH-p02c-01 ~ SH-p02c-13b）— 分支 C：拍赝品

**本场干什么**：拍在台面 → 半秒 → 三个问题 → 六万落下 → 鼻腔笑 → 救店还是让叔叔高兴 → 你没回答 → 她走两步 → 手未触门把 → 你叔叔有话没跟你说 → 选择停住：手与笔 → 说你上过屋顶 → 她回头 → 她换手 → 你盯着她左手。

**Prompt 套**：`SH-p02c-01` ~ `SH-p02c-13b`。
**参考图职责**：DETAIL-cheng-scar-ring 只在 13b 被"看"，但在 13a 换手前**不进入前景**。

- **SH-p02c-01｜拍在台面上**：拍击点与赝品所在位置一致，无跳纸。降级：改为手压静止。
- **SH-p02c-02｜她的半秒**：不提前张嘴，"半秒"只靠静止体现。降级：缩为静止帧。
- **SH-p02c-03｜三个问题**：三问节点顺序不可调换。降级：拆为一问一镜。
- **SH-p02c-04｜六万落下**：不做货币特写，只靠语境落点。降级：只留口型帧。
- **SH-p02c-05｜鼻腔笑**：不做全脸笑，仅鼻翼与呼吸可见。降级：静止帧。
- **SH-p02c-06｜救店还是让叔叔高兴**：不出现店招特写。降级：只留口型。
- **SH-p02c-07｜你没回答**：player 此镜内不做反驳动作。降级：静止帧。
- **SH-p02c-08｜她走两步**：两步区间明确，不达门把。降级：拆为两步各一镜。
- **SH-p02c-09｜手未触门把**：门把手与手距离可辩，不接触。降级：加定格。
- **SH-p02c-10｜你叔叔有话没跟你说**：视线不提前指向左手。降级：只留口型。
- **SH-p02c-11｜选择停住：手与笔**：手与笔的距离位置复现 P01 的停住构图。降级：只留静止。
- **SH-p02c-12a｜说你上过屋顶**：背景不新增无来源元素。降级：静态。
- **SH-p02c-12b｜她回头**：回头一次，不出现二次晃头。降级：只留回头终帧。
- **SH-p02c-13a｜她换手**：换手过程完成，但**环不入前景特写**。降级：拆成前后两半。
- **SH-p02c-13b｜你盯着她左手**：她的左手在此时可入画；DETAIL-cheng-scar-ring 显特征。降级：改为近景局部。

### 场 P03merge（SH-p03merge-01 ~ SH-p03merge-09b）— 合并收束

**本场干什么**：门内一米 → 「住院」→ 包的外侧还是内袋 → 台面还是货架 → 出去的那一响 → 只剩坏灯一侧电流声 → 翻到背面 → 标签边缘铅笔痕 → 拉链上停 1 秒（09a）/ 放回货架看空位（09b）。

**Prompt 套**：`SH-p03merge-01` ~ `SH-p03merge-09b`。
**参考图职责**：SCENE-echo-store 定"只剩坏灯一侧"；PROP-record-fake 背三特征 + 标签铅笔痕；PROP-folder-kraft 外侧/内袋在此场被再选一次。

- **SH-p03merge-01｜门内一米**：门内外景与 P01-04 门位一致。降级：改为门口越肩。
- **SH-p03merge-02｜她说「住院」**：单字口型；不新增情绪夸张。降级：口型帧。
- **SH-p03merge-03｜包的外侧还是内袋**：外侧/内袋二选，视觉与 P02a-07a/07b 对齐。降级：改为物件静置。
- **SH-p03merge-04｜台面还是货架**：两个落点只表达一次，不重复。降级：改为静态合成。
- **SH-p03merge-05｜出去的那一响**：门响节点只一次。降级：只留门框近景。
- **SH-p03merge-06｜只剩坏灯一侧的电流声**：坏灯一侧作为唯一光源，无第二光源。降级：静止长镜。
- **SH-p03merge-07｜翻到背面**：翻背面一次，三特征重现。降级：直接切到背面静止。
- **SH-p03merge-08｜标签边缘那道铅笔痕**：铅笔痕位置与 P02b-01 一致。降级：局部特写。
- **SH-p03merge-09a｜手在拉链上停 1 秒（选择 p03merge-a）**：停在拉链，不拉动。**与 09b 互斥。**
- **SH-p03merge-09b｜放回货架，看一眼空位（选择 p03merge-b）**：货架层位与 P01-03 空位一致。**与 09a 互斥。**

---

## 三、【连续性队列】

**主链（trunk）end→start**：
`SH-p01-01 → 02 → 03 → 04 → 05 → 06 → 07`，每镜末帧即下一镜首帧；坏灯侧、空位、赝品三特征、纸笔朝向是四项跨镜锁。

**三条分支入口（互斥、并列提交，不合并）**：
- 07 → **07a**（签）→ 入 P02a 链
- 07 → **07b**（抽赝品）→ 入 P02b 链
- 07 → **07c**（拍赝品）→ 入 P02c 链

**分支内 end→start**：
- P02a：`01→02→03→04→05→06→07`；末镜 `07` 出两变体 `07a / 07b`（互斥）。
- P02b：`01→02→03→04→05→06→07`；末镜 `07` 出两变体 `08a / 08b`（互斥）。
- P02c：`01→02→…→13a`；`13a→13b`；`13a / 13b` 与 12a/12b 顺序保持（12a 说 →12b 回头 →13a 换手 →13b 盯着左手）。

**三条分支接 merge（不合并为单一尾镜，按播放选择接入）**：
- `SH-p02a-07b → SH-p03merge-01`
- `SH-p02b-08b → SH-p03merge-01`
- `SH-p02c-13b → SH-p03merge-01`

即三条分支各自以末镜接 `p03merge-01` 的招牌/门内一米构图；merge 内不再合并分支动作，只作共享后段。merge 内容段 `SH-p03merge-01 … 08` 三支共用；末镜再分二选 `09a / 09b`（互斥），此时 09a 与 09b 是两个不同尾帧，不是同一镜的两段。

**跨镜硬锁清单**：
1. 坏灯一侧光源方向（P01、P02b、P03merge）；  
2. 货架空位层位（P01-03 ↔ P03merge-09b）；  
3. 赝品三特征（P01-05、P02b-01、P03merge-07/08）；  
4. 纸笔朝向（P01-06 ↔ P02a-02/04 ↔ P02c-11）；  
5. 左手环（P02c-13a 之前不可入前景，13b 才被看）。

---

## 四、【预算与重试】

- **默认策略**：每条 SH- 先出 2–4 个低成本候选，锁定 I2V 关键帧后，再出 1 个精品定版。
- **互斥镜处理**：07a / 07b / 07c，以及 07a / 07b、08a / 08b、09a / 09b 各自独立记预算，不与兄弟镜共享候选，避免串味。
- **同镜失败 2–3 轮**：停止本镜，不自行改剧情、不改 Prompt 正文、不改分镜；**退回分镜 Agent 修设计**（拆镜、改插入、缩短动作、换走位），再由提示词 Agent 重编译 `SHOT_JOB`。
- **A 级资产优先**：CHAR-player、CHAR-cheng、SCENE-echo-store、PROP-record-fake 任一未过身份/特征冻结，**其下游全镜不再提交**。
- **未核验不提精度承诺**：所有模型列标 `<未核验>`，任何"能出片"都以静帧硬验收通过为前提。

---

## 五、【未执行声明】

- 模型调用：**尚未调用**。
- T2I：未调用；I2V：未调用；T2V：未调用（本剧不规划 T2V，全部走 I2V）。
- 所有节点状态：`prompt_ready`。
- 选择 UI（07a/b/c、08a/b、09a/b 的分支展示）为 overlay，**不提交视频任务**，不计入 I2V 预算。

---

**生视频前调度完成。获批静帧之前，不得批量提交镜头。**