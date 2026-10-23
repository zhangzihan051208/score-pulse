# 看台 · 手机版

Google Play 与 App Store 用的客户端。安装包里带上评分榜：七个项目的现役前 100、球队前 50、名宿榜，以及按位置筛选、球员页、球队阵容和隐私说明。

这个版本在手机上离线打开。名单、评分和头像都打进安装包，不注册账号，不上传通讯录，不投放广告，也不接统计 SDK。网站上的当场评分、登录和赛程仍留在网页，等有公开接口后再接进商店版。

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
