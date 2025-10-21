# Beeline Helper

一个基于 Vite + Vue + vite-plugin-monkey 开发的浏览器扩展，在 beeline-ai.com 网站页面添加悬浮窗助手。

## 功能特性

- 🪟 **悬浮窗界面** - 在页面中央显示悬浮窗口
- 🖱️ **可拖动** - 可通过标题栏拖动悬浮窗到任意位置
- 📚 **全自动刷课** - 自动检测并点击课程完成按钮
- 🔧 **控制按钮** - 页面左下角的圆形控制按钮
- 🎨 **美观设计** - 渐变色彩和流畅动画效果
- ⚡ **轻量快速** - 使用 Vite 构建，体积小巧

## 安装使用

### 方法一：直接安装用户脚本

1. 安装 Tampermonkey 或 Violentmonkey 等用户脚本管理器
2. 打开 `dist/beeline-helper.user.js` 文件
3. 将内容复制到用户脚本管理器中安装

### 方法二：开发模式

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
beeline-helper/
├── src/
│   ├── main.js          # 入口文件
│   └── App.vue          # 主组件
├── dist/
│   └── beeline-helper.user.js  # 构建产物
├── vite.config.js       # Vite 配置
├── package.json
└── README.md
```

## 技术栈

- **Vite** - 构建工具
- **Vue 3** - 前端框架
- **vite-plugin-monkey** - 用户脚本插件

## 使用说明

1. 安装扩展后，访问任何 `beeline-ai.com` 域名下的页面
2. 页面左下角会出现一个圆形控制按钮
3. 点击按钮可以打开/关闭悬浮窗
4. 通过拖动标题栏可以移动悬浮窗到任意位置
5. 点击"全自动刷课"按钮进入子页面
6. 在子页面中选择"自动点击完成按钮"，系统会自动检测课程完成按钮并延迟3秒后点击

## 许可证

MIT License