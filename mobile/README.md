# 看台 · 手机版

Google Play、App Store 和网页预览用的同一套手机比例界面。顶部一行是说明和动态，下一行是搜索。首页有比赛帖、热门和项目入口；主队在个人主页里按联赛设置。第一次登录会走和网页相同的四步引导。评分榜按运动和位置排；比赛帖可以打五维分、对比两名球员；还有评分专区、动态、说明、登录名和 VIP 预览。名单和样例比赛打在安装包里。未登录时评分留在这台设备上。用和网站相同的邮箱登录后，评分、比赛评论、昵称和主队会通过网站接口同步。个人页可以删除账号，云端和本机副本一起清除。比赛评论也可以在本机举报并隐藏。

手机访问的网站地址用环境变量 `EXPO_PUBLIC_API_URL`。没填时，浏览器预览用 `http://127.0.0.1:43147`。真机需要网站的公网地址。

屏幕底部有一条广告位，网页顶栏下面是同一块位置。这一版只留空位，没有接入广告 SDK。

包名与 Bundle ID：`com.grandstand.tribune`。版本 `1.0.0`（Android `versionCode` 1，iOS `buildNumber` 1）。

## 本地运行

在仓库根目录导出一次名单（会重写 `mobile/src/data/catalog.json` 和 `mobile/src/portraits.ts`，头像仍引用 `public/portraits/`）：

```bash
npx --yes tsx scripts/export-mobile-catalog.ts
```

然后：

```bash
cd mobile
npm install
npm run web
```

浏览器打开 [http://127.0.0.1:43149](http://127.0.0.1:43149)。手机上用 Expo Go 时，在 `mobile/` 里执行 `npm start`，扫终端里的二维码。

## 打 Android 包

这台环境没有 Android SDK，仓库里也不放 APK。在装了 Android Studio 的电脑上：

```bash
cd mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

或用 [EAS Build](https://docs.expo.dev/build/setup/)（需要你自己的 Expo 账号，本仓库没有填 `projectId`）：

```bash
npx eas-cli build --platform android --profile preview
```

`preview` 产出可侧载的 APK。`production` 产出上架用的 AAB，并在每次构建时递增版本号。

## 打 iOS 包

iOS 只能在 macOS 上编。用 EAS：

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

提交前在 App Store Connect 建好 App，Bundle ID 用 `com.grandstand.tribune`，加密问卷选“不使用受管制加密”（工程里已设 `ITSAppUsesNonExemptEncryption`）。

## 商店文案

中英文简介、完整说明和隐私政策正文在 `store/listing.md`。上架时把隐私政策放到一个公开网址，Play Console 和 App Store Connect 都要填这个链接。
