# Git 账户管理器 (Git Account Manager)

这是一个基于 **Electron** + **Vue 3** + **Element Plus** 开发的跨平台 Git 账户管理工具。旨在解决开发者在同一台机器上管理多个 Git 身份（如个人 GitHub 和公司 GitLab）时的痛点。

## 🌟 核心特性

*   **一键切换身份**: 自动更新全局 `user.name` 和 `user.email`。
*   **智能 SSH 管理**: 通过 `core.sshCommand` 自动绑定账户对应的 SSH 私钥，**无需手动修改 `~/.ssh/config`**，互不冲突。
*   **自动识别**: 首次启动会自动读取当前系统全局的 Git 配置作为默认账户。
*   **安全存储**: 账户配置保存在本地用户数据目录，不上传任何服务器。
*   **中文界面**: 全中文 UI 和代码注释，易于使用和二次开发。

## 🛠️ 技术栈

*   **Runtime**: [Node.js](https://nodejs.org/) (推荐 v20+), [Electron](https://www.electronjs.org/)
*   **Frontend**: [Vue 3](https://vuejs.org/) (Composition API), [Element Plus](https://element-plus.org/), [Vite](https://vitejs.dev/)
*   **Git Ops**: [simple-git](https://github.com/steveukx/git-js)

## 🚀 快速开始

### 1. 环境准备

确保你的环境已安装 Node.js (建议 v20 或更高版本) 和 Git。

### 2. 安装依赖

```bash
# 安装所有依赖
npm install
```

### 3. 开发模式运行

启动开发服务器，支持热重载（HMR）：

```bash
npm run electron:dev
```

### 4. 构建打包

生成生产环境的可执行文件。

**Windows (默认 x64)**:
```bash
# 生成标准安装程序 (.exe) 和绿色免安装版 (.zip)
# 安装程序包含完整的安装向导（选择目录、创建快捷方式）
npm run dist:win
# 构建 ARM64 版本
npm run dist:win:arm64
```

**macOS**:
```bash
# 生成 .dmg 和 .zip
npm run dist:mac
# 构建 ARM64 (Apple Silicon) 版本
npm run dist:mac:arm64
```
> 注意：在 Windows 上构建 macOS 应用可能无法进行代码签名和公证，生成的应用可能需要在 macOS 上允许"任何来源"才能运行。

**Linux**:
```bash
# 生成 AppImage, .deb, .rpm
npm run dist:linux
# 构建 ARM64 版本
npm run dist:linux:arm64
```

**构建所有平台**:
```bash
npm run dist:all
```

> **注意**: 构建 Windows 安装包需要非管理员权限或正确配置 `winCodeSign` 环境。如果遇到网络问题导致下载构建工具失败，请配置相应的镜像源。

## 📖 使用指南

### 添加账户

1.  点击界面右侧的 **"添加新账户"**。
2.  输入 **用户名** (Git user.name) 和 **邮箱** (Git user.email)。
3.  (可选) 点击 **"浏览"** 选择该账户对应的 SSH 私钥文件（例如 `id_rsa_company`）。
4.  点击 **"添加账户"** 保存。

### 切换账户

1.  在左侧 **"已保存账户"** 列表中找到目标账户。
2.  点击 **"切换"** 按钮。
3.  系统会自动更新全局 Git 配置。顶部状态栏会实时显示当前生效的身份。

### 原理说明

当切换到一个配置了 SSH 密钥的账户时，本工具会执行：

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global core.sshCommand "ssh -i '/path/to/private/key' -o IdentitiesOnly=yes"
```

这确保了接下来的所有 Git 操作（Clone, Push, Pull）都会强制使用指定的私钥，从而避免了 SSH 密钥混淆的问题。

## 📂 项目结构

```
git-account-manager/
├── electron/
│   ├── main.js        # Electron 主进程 (后端逻辑)
│   └── preload.js     # 预加载脚本 (安全桥接)
├── src/
│   ├── App.vue        # Vue 主组件 (UI 逻辑)
│   └── main.js        # Vue 入口
├── dist/              # 前端构建产物
├── package.json       # 项目配置
└── vite.config.js     # Vite 配置
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！
