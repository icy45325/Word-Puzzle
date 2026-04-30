# DataScienceEcosystem

## WordScapes ZH · 拼词学英语

一款 Wordscapes 风格的单词拼写游戏，拼完一个单词会立即展示 **中文释义 / 音标 / 英文例句 + 翻译 / 发音** 等扩展知识。代码位于 `app/` 目录，使用 **Expo (React Native) + TypeScript**。

### 运行方式

需要 Node 18+ 和可选的 Xcode / Android Studio，或手机装一个 Expo Go。

```bash
cd app
npm install
npx expo start
# 然后：按 i 在 iOS 模拟器打开，按 a 在 Android 模拟器打开，
# 或用手机 Expo Go 扫描终端里的二维码。
```

### 打独立 APK（离线安装到手机）

两条路二选一，详细说明见 [`app/BUILD_APK.md`](app/BUILD_APK.md)。

**A. EAS Build（云端，推荐，不用装 Android SDK）**

项目已绑定 EAS project `03dbff27-1493-4159-9fab-ab9b79202c73`：

```bash
cd app
npm install -g eas-cli
eas login
eas build -p android --profile preview
# 编译完终端会给出 APK 下载链接，手机直接装
```

**B. 本地 Gradle 编译（完全离线，需 JDK 17 + Android SDK）**

```bash
cd app
npm run apk
# 产物：app/android/app/build/outputs/apk/release/app-release.apk
adb install -r app/android/app/build/outputs/apk/release/app-release.apk
```

### 当前 MVP 能做什么

- 圆形字母转盘 + 手势滑动拼词
- 交叉填字网格，命中答案自动填入
- 单词详情弹窗：中文释义、音标、词性、例句（中英）、扩展知识；自动朗读（`expo-speech`）
- 关卡完成弹窗 → 自动进入下一关
- 额外发现（bonus words）单独展示，可点击复看
- 金币 HUD：拼词/通关奖励金币（消费入口在 MVP 里先置灰）
- 匿名用户自动生成 UUID、进度与经济数据本地持久化

### 架构亮点（为长线盈利预留的扩展点）

所有后端相关能力都抽象成 **`src/services/*`** 接口，MVP 用本地 / no-op 实现，未来换真 SDK 只改一处：

| 模块 | 接口 | MVP 实现 | 未来可替换为 |
|---|---|---|---|
| `auth` | `AuthService` | `AnonymousAuth`（本地 UUID） | Firebase Auth / Apple / 微信 / Google |
| `progress` | `ProgressRepo` | `LocalProgressRepo`（AsyncStorage） | 云端同步 + `migrate(from, to)` 合并 |
| `leaderboard` | `LeaderboardService` | `LocalLeaderboard`（仅 self 域） | 服务端排行榜、好友圈、每日榜 |
| `economy` | `EconomyService` | `LocalEconomy`（金币/提示/连胜） | 服务端经济，RemoteConfig 调参数 |
| `ads` | `AdsService` | `NoopAds`（只打点） | AdMob / IronSource / 穿山甲等 |
| `iap` | `IapService` | `NoopIap`（SKU 清单已就位） | RevenueCat / expo-in-app-purchases |
| `analytics` | `AnalyticsService` | `ConsoleAnalytics`（console.log） | GA4 / Amplitude / 神策 / 火山 |
| `remoteConfig` | `RemoteConfig` | `StaticRemoteConfig`（bundled JSON） | Firebase Remote Config / 自建 |

**所有功能开关、经济参数**都走 `src/data/remoteConfigDefaults.json`。上线后只要远程下发配置，广告/内购/排行榜/每日挑战即可一键开启，客户端无须发版。

**完整的事件漏斗**已经在 MVP 里打点（`app_open`、`level_start`、`word_found`、`word_detail_shown`、`level_complete`、`hint_used`、`ad_requested/shown/rewarded`、`iap_checkout_start/purchased/failed`），接真分析 SDK 时直接替换 sink。

**多用户数据结构**从第一天就存在：`ws:{userId}:progress|economy|scores` 命名空间 + `schemaVersion` 字段，匿名用户登入正式账号时通过 `ProgressRepo.migrate(fromId, toId)` 搬迁本地数据。

### 目录结构

```
app/
├── App.tsx                          # GestureHandler + ServicesProvider + Stack Navigator
├── src/
│   ├── screens/                     # Home / Game / Profile
│   ├── components/                  # LetterWheel / CrosswordGrid / WordDetailModal ...
│   ├── hooks/                       # useGameState / useEconomy
│   ├── services/                    # 所有后端接口 + 本地/no-op 实现
│   ├── store/                       # AsyncStorage 命名空间封装
│   ├── utils/                       # wordValidation / gridLayout / scoring / speech / uuid
│   ├── i18n/                        # 中文文案（预留多语言结构）
│   └── data/                        # levels.json / dictionary.json / remoteConfigDefaults.json
└── assets/
```

### 验证清单

1. `cd app && npm install` 无报错
2. `npx expo start` 后能在 Expo Go / 模拟器打开
3. 黄金路径：首页 → 开始游戏 → 按住字母滑动 → 拼出答案 → 弹出单词详情 → 听到朗读 → 关闭 → 全部找齐 → 关卡完成 → 下一关
4. 金币 HUD 随拼词/通关增加
5. Console 能看到完整的 `[analytics]` 事件流
6. 重启 app 后匿名用户 UUID、金币、进度仍然保留
