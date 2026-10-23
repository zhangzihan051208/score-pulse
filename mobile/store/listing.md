# 商店文案

应用名：看台  
英文名：Grandstand  
包名 / Bundle ID：`com.grandstand.tribune`  
类目：体育  
版本：1.0.0

## 简短说明

中文（80 字以内）：

比赛、评分榜、专区和主队，按手机比例排好。底部留着广告位。

English (80 characters):

Matches, boards, zones, and your clubs, at phone size. Ad space reserved.

## 完整说明

中文：

看台把网页上的看台收成手机比例。首页有比赛、主队和热门球员。NBA、足球、电竞、NFL、F1、网球、UFC 都有现役榜、球队榜和名宿榜，能按位置再排。比赛帖可以给上场的人打五维分，也可以把两个人放在一起比。搜索、评分专区、我的主队、动态和说明都在。

屏幕底部留着广告位，和网页上的是同一块位置。这一版只留空位，没有接入广告 SDK，不读取通讯录。

English:

Grandstand on a phone: matches, clubs, and the players people are talking about. NBA, soccer, esports, NFL, F1, tennis, and UFC each have active, club, and legend boards, and the bigger sports can be ranked again by role. Open a match to grade five axes or compare two players. Search, DIY zones, your clubs, a feed, and the rules are included.

A banner is reserved at the bottom of the app and under the header on the web. This version leaves that space empty. It does not include an ad SDK and does not read contacts.

## 新功能

中文：和网页同一套功能的手机比例：比赛帖、五维评分、对比、专区、主队，以及三端广告位。

English: Phone-scale parity with the site: matches, five-axis grades, comparisons, zones, clubs, and a shared ad slot.

## 隐私政策

把下面这段放到公开网页，商店后台填那个网址。应用内「隐私政策」页使用同一段话。

中文：

看台在 iOS、Android 和网页留出同一块广告位。这一版只留空位，没有接入广告 SDK，不会因广告读取设备标识。比赛样例、评分榜和头像在安装包里。登录名、主队、评分和专区保存在这台设备上，不上传通讯录。系统崩溃日志由 Google Play 或 App Store 按它们自己的政策处理。

English:

Grandstand reserves the same ad space on iOS, Android, and the web. This build leaves the space empty and does not include an ad SDK, so ads do not read a device id. Sample matches, boards, and portraits ship in the install. Your name, clubs, ratings, and zones stay on this device. The store may keep crash logs under its own policy.

## 数据安全（Play Console）

- 不向开发者服务器上传数据。登录名、评分、主队和专区只存在这台设备上。
- 广告位为空，未接入广告 ID，无定位，无通讯录。
- 用户可以在本机写评论。带联系方式或导流的专区评论会先待审核，不会公开。

## 提交前你需要自己准备

- Google Play 开发者账号，以及签名密钥（EAS 或 Android Studio 生成，不要提交到仓库）。
- Apple Developer 账号，以及 App Store Connect 里同名的 App ID。
- 一张 1024×1024 图标：已放在 `mobile/assets/icon.png`。
- 手机截图：首页项目格、足球榜与位置筛选、球员页、球队阵容。商店要求的尺寸以当时后台为准。
