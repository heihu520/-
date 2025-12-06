# Gemini Nexus Deployment Guide

**Gemini Nexus** 是一个基于 React + Node.js + MySQL 的全栈 AI 助手应用。它结合了 Windows 11 的玻璃拟态美学与 Google Gemini 3 Pro 的强大模型，并支持**多会话历史记录持久化**。

---

## 🛠 技术栈

*   **前端**: React 18, Vite, Tailwind CSS (Glassmorphism UI)
*   **后端**: Node.js, Express (API 服务)
*   **数据库**: MySQL 8.0+ 或 MariaDB (数据存储)
*   **AI**: Google GenAI SDK (Gemini 3 Pro / 2.5 Flash)

---

## 📦 环境准备

在开始之前，请确保您的电脑已安装以下软件：

1.  **Node.js**: 推荐版本 v18 或 v20 ([下载链接](https://nodejs.org/))
2.  **MySQL 或 MariaDB**: 数据库服务 ([下载链接](https://mariadb.org/download/))
3.  **Google API Key**: 从 [Google AI Studio](https://aistudio.google.com/) 获取。

---

## 🚀 快速启动教程 (Windows/Linux/Mac)

### 第一步：数据库准备

1.  启动您的 MySQL/MariaDB 服务。
2.  创建一个空的数据库（例如命名为 `gemini_nexus`）。
    *   *提示：您不需要手动创建表，后端启动时会自动检测并创建 `sessions` 和 `messages` 表。*

### 第二步：配置环境变量

在项目根目录下创建一个名为 `.env` 的文件，复制以下内容并修改：

```env
# 1. Google Gemini API Key (必填)
API_KEY=你的_AI_Studio_Key_粘贴在这里

# 2. Node.js 后端服务器配置 (推荐 3001)
# 注意：千万不要设置成 3306，那是数据库用的！
APP_PORT=3001

# 3. 数据库连接配置
DB_HOST=localhost
# 数据库端口 (MySQL默认3306)
DB_PORT=3306
# 数据库用户名 (通常是 root)
DB_USER=root
# 数据库密码 (安装数据库时设置的密码)
DB_PASSWORD=你的数据库密码
# 数据库名称 (需与第一步创建的一致)
DB_NAME=gemini_nexus
```

### 第三步：安装依赖

打开终端（PowerShell 或 CMD），进入项目目录运行：

```bash
npm install
```

### 第四步：启动服务

你需要打开**两个**终端窗口来分别运行后端和前端。

**窗口 1：启动后端 API**
```bash
npm run server
```
*成功标志：看到 `🚀 Server running on http://localhost:3001` 和 `✅ Database tables initialized`。*

**窗口 2：启动前端界面**
```bash
npm run dev
```
*成功标志：看到 `Local: http://localhost:5173`。*

现在，打开浏览器访问 **http://localhost:5173** 即可开始使用！

---

## ⚠️ 常见报错与解决

### 1. Error: listen EADDRINUSE :::3306
*   **现象**：启动 `npm run server` 时报错。
*   **原因**：端口冲突。您可能在 `.env` 中把 `APP_PORT` 设置成了 `3306`，但这已经被 MySQL 占用了。
*   **解决**：打开 `.env`，将 `APP_PORT` 改为 `3001`，保存后重启后端。

### 2. Access denied for user 'xxx'@'localhost'
*   **现象**：后端提示数据库连接失败。
*   **原因**：数据库账号或密码错误。
*   **解决**：
    1.  检查 `.env` 中的 `DB_USER` 和 `DB_PASSWORD` 是否正确。
    2.  如果您使用的是 `root` 用户且密码为空，请留空 `DB_PASSWORD=`。
    3.  确保 MySQL 服务正在运行。

### 3. 前端提示“数据库未连接”或无法保存历史
*   **原因**：前端无法连接到后端 API。
*   **解决**：
    1.  确保**窗口 1** (后端) 没有关闭且无报错。
    2.  点击侧边栏左下角的“未连接 (点击重试)”按钮。
    3.  按 `F12` 打开控制台，查看是否有红色的网络请求错误。

### 4. Client does not support authentication protocol
*   **原因**：MySQL 8.0 的加密方式与旧版客户端不兼容。
*   **解决**：进入 MySQL 命令行执行：
    ```sql
    ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的密码';
    FLUSH PRIVILEGES;
    ```

---

## 📂 项目结构说明

*   `server/` - 后端代码 (Express + MySQL)
    *   `index.js` - 服务器入口与数据库初始化逻辑
    *   `schema.sql` - 数据库结构参考 (自动初始化失败时可用此手动导入)
*   `src/` - 前端代码 (React)
    *   `services/apiService.ts` - 前后端通信接口
    *   `components/` - 聊天与视觉组件
    *   `types.ts` - TypeScript 类型定义
