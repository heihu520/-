# Gemini Nexus Deployment Guide

这是一个基于 React + Node.js + MySQL 的全栈 AI 助手应用，支持 Gemini 3 Pro 模型、流式对话、视觉分析及历史记录持久化。

---

## 🛠 技术栈
*   **前端**: React 18, Vite, Tailwind CSS, Lucide React
*   **后端**: Node.js, Express
*   **数据库**: MySQL 8.0+
*   **AI**: Google GenAI SDK

---

## 📦 部署前准备

无论是在 Windows 还是 Linux 上部署，您都需要先安装以下基础软件：

1.  **Node.js**: 推荐版本 v18 或 v20 ([下载链接](https://nodejs.org/))
2.  **MySQL**: 推荐版本 8.0 ([下载链接](https://dev.mysql.com/downloads/installer/))
3.  **Google API Key**: 从 [Google AI Studio](https://aistudio.google.com/) 获取。

---

## 💻 Windows 本地部署教程

### 1. 数据库初始化
1.  打开 MySQL Workbench 或命令行工具。
2.  打开项目目录下的 `server/schema.sql` 文件。
3.  执行文件中的 SQL 语句以创建数据库 `gemini_nexus` 和所需的表。

### 2. 项目配置
在项目根目录下创建一个名为 `.env` 的文件，填入以下内容：

```env
# Google Gemini API Key
API_KEY=你的_AI_Studio_Key_粘贴在这里

# MySQL 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=gemini_nexus
PORT=3001
```

### 3. 安装依赖与启动
打开 PowerShell 或 CMD，进入项目根目录：

```powershell
# 安装依赖 (同时安装前端和后端依赖)
npm install

# 启动后端服务器 (保持此窗口开启)
npm run server
```

打开**第二个** PowerShell 窗口：
```powershell
# 启动前端开发服务器
npm run dev
```

现在，浏览器打开 `http://localhost:5173` 即可使用。

---

## 🐧 Linux 服务器部署教程 (Ubuntu/CentOS)

### 1. 安装环境
```bash
# Ubuntu
sudo apt update
sudo apt install nodejs npm mysql-server git -y

# 验证安装
node -v
mysql --version
```

### 2. 配置 MySQL
```bash
sudo mysql
# 在 MySQL 提示符下:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的强密码';
FLUSH PRIVILEGES;
exit;
```
*注意：将上述命令中的密码替换为你 `.env` 文件中计划使用的密码。*

初始化数据库表：
```bash
mysql -u root -p < server/schema.sql
```

### 3. 获取代码与安装依赖
将项目代码上传到服务器（例如 `/var/www/gemini-nexus`），然后进入目录：

```bash
cd /var/www/gemini-nexus
npm install
```

### 4. 配置环境变量
创建 `.env` 文件：
```bash
nano .env
```
粘贴 Windows 教程中的配置内容，并保存 (Ctrl+O, Enter, Ctrl+X)。

### 5. 生产环境构建与运行

**构建前端资源：**
```bash
npm run build
```
*这将在 `dist/` 目录下生成静态文件。*

**配置后端托管静态文件 (可选优化):**
目前后端 `server/index.js` 主要处理 API。在生产环境中，你可以修改 `server/index.js` 让 Express 同时托管 `dist` 目录，或者使用 Nginx 反向代理。

**简单启动 (使用 PM2 守护进程):**
推荐使用 PM2 让服务在后台运行。

```bash
sudo npm install -g pm2

# 启动后端服务
pm2 start server/index.js --name "gemini-backend"

# 对于前端，由于是开发模式，生产环境通常建议使用 Nginx 托管 dist 目录。
# 但为了简单测试，你可以继续使用 vite preview
pm2 start "npm run preview -- --host --port 80" --name "gemini-frontend"
```

现在访问服务器 IP 即可。

---

## 常见问题排查

1.  **无法连接数据库 (ECONNREFUSED)**: 检查 `.env` 中的 DB_PASSWORD 是否正确，MySQL 服务是否已启动。
2.  **API 请求 404**: 确保后端服务器正在运行（默认端口 3001）。
3.  **AI 无响应**: 检查 API_KEY 是否有效，以及服务器是否能访问 Google API (部分国内服务器需配置代理)。
