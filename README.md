# Kukie Home

Kukie 的个人项目主站，用来展示做过的东西和折腾记录。使用原生 HTML、CSS 和 JavaScript，字体、图形与示例照片均在本地，适合部署到 Cloudflare Pages。

原创代码采用 [Apache License 2.0](LICENSE)。第三方资源保留各自的许可，完整声明见 [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt)。

## 本地预览

需要 Node.js 20 或更新版本，无需安装依赖：

    node tools/serve.mjs

打开 http://127.0.0.1:8096 。通过 PREVIEW_PORT 修改端口：

    PREVIEW_PORT=8106 node tools/serve.mjs

## 部署到 Cloudflare Pages

在 Cloudflare Pages 中导入此 GitHub 仓库，使用以下设置：

| 配置 | 值 |
| --- | --- |
| 框架预设 | None |
| 生产分支 | main |
| 构建命令 | node tools/build.mjs |
| 构建输出目录 | dist |
| 根目录 | 仓库根目录，留空即可 |

构建脚本只使用 Node.js 内置模块，将网页、资源、响应头和许可证整理到 dist。连接 Git 后，推送 main 即可触发 Pages 更新。

在本地检查发布目录：

    node tools/build.mjs
    PREVIEW_PORT=8106 node tools/serve.mjs --dist

配置方式参考 Cloudflare 官方的 [静态 HTML 部署说明](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)和[响应头说明](https://developers.cloudflare.com/pages/configuration/headers/)。

## 页面与交互

- 叠放的项目展示窗，映屿、茶馆和 Tunnel Manager 的图标粒子重组。
- 组件从左右错峰飞入，离场向外淡出。
- 顶栏标题初始由散开的字母拼好，点击标题才重新拼字，并给出点击反馈。
- 黑白 / 森林绿配色、浅色 / 深色外观，保存本地偏好。
- 项目筛选、项目介绍弹窗、折腾记录和个人介绍。
- 触屏点选与键盘操作，尊重系统减少动态效果设置，支持暂停动效。
- 粒子与自动轮换在离屏和后台时暂停。

## 修改内容

| 文件 | 用途 |
| --- | --- |
| index.html | 页面文案、项目列表、文章与外部链接 |
| site.js | 首屏项目数据、交互与粒子动画 |
| styles.css | 组件、配色、动效与响应式布局 |
| assets/ | 本地图片、字体、主页标记和资源说明 |
| _headers | Cloudflare Pages 的响应头 |
| 404.html | 未找到页面 |
| tools/build.mjs | 生成发布目录 |
| tools/serve.mjs | 源码与发布目录预览 |

设计说明见 [DESIGN.md](DESIGN.md)。本地截图、检查记录和生成的 dist 目录不纳入 Git。

## 资源与许可

项目标记来自 [映屿](https://github.com/qiuyuxc/yingyu)、[茶馆](https://github.com/qiuyuxc/chaguan)和 [Tunnel Manager](https://github.com/qiuyuxc/tunnel-manager)，保留原有版权和许可。其他项目使用说明性图形，主页 K 标记为本站绘制。

部分通用 SVG 图形沿用 Lucide / Feather 的图形结构，声明与许可文本收录在 THIRD_PARTY_NOTICES.txt。

Geist 字体采用 SIL Open Font License 1.1，许可保存在 [assets/Geist-OFL.txt](assets/Geist-OFL.txt)。三张示例照片采用 Unsplash License，来源与校验值见 [assets/README.md](assets/README.md)。
