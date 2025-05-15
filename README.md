# 死记硬背

一个简洁的 Web Application，旨在帮助用户进行题目练习和记忆。支持从 CSV 文件加载题目，提供顺序练习、随机练习和模拟考试等多种模式。

## ✨ 功能特性

  * **题目加载:** 从本地 `static/data.csv` 文件解析题目数据。
  * **支持题型:** 单选题、多选题、判断题。
  * **练习模式:**
      * **顺序练习:** 按照题目在文件中的原始顺序进行练习。
      * **随机练习:** 每次开始时打乱所有题目的顺序进行练习。
      * **对错反馈:** 练习模式下，答题后立即显示每道题的对错及正确答案。
      * **对错计数:** 统计练习过程中的答对和答错题目数量。
  * **模拟考试模式:**
      * 固定题量和题型比例：抽取 70 道单选题、20 道判断题、10 道多选题（总计 100 题，如果题库数量足够）。
      * 固定题型顺序：按单选、判断、多选的顺序进行考试。
      * 考试过程中不显示即时对错。
      * 考试结束后显示最终得分和答对/答错数量。
  * **响应式设计:** UI 适应不同屏幕尺寸，支持移动端访问。
  * **应用内导航:** 状态栏提供返回主页功能，避免浏览器历史记录问题。

## 🛠️ 使用技术

  * **构建工具:** Rsbuild
  * **前端框架:** React
  * **语言:** TypeScript
  * **UI 样式:** Tailwind CSS
  * **路由:** React Router DOM
  * **图标 (可选):** react-icons (如果使用了后退箭头图标)

## 🚀 快速开始

### 环境要求

  * Node.js (推荐 v14 或更高版本)
  * npm, yarn 或 pnpm 包管理器

### 安装

1.  **克隆仓库:**
    ```bash
    git clone <你的仓库地址>
    cd app # 进入项目目录
    ```
2.  **安装依赖:**
    ```bash
    npm install
    # 或者 yarn install
    # 或者 pnpm install
    ```

### 数据准备

  * 在项目根目录下创建或修改 `static` 文件夹，并确保其中包含 `data.csv` 文件。
  * `data.csv` 文件应为 CSV 格式，且包含以下列，按顺序排列：
      * `no`: 题号 (数字)
      * `type`: 题型 ('单选题', '多选题', '判断题')
      * `title`: 题目内容 (字符串)
      * `A`: 选项 A 的内容 (字符串)
      * `B`: 选项 B 的内容 (字符串)
      * `C`: 选项 C 的内容 (字符串)
      * `D`: 选项 D 的内容 (字符串)
      * `answer`: 正确答案 (单选/判断如 'A', 'B'；多选如 'BC', 'ABD')
  * 注意：题目内容或选项内容中的逗号需要用双引号 `"` 包裹。

### 运行项目

  * **开发模式 (含热重载):**
    ```bash
    npm run dev
    # 或者 yarn dev
    # 或者 pnpm dev
    ```
    应用将在浏览器中打开。
  * **构建生产版本:**
    ```bash
    npm run build
    # 或者 yarn build
    # 或者 pnpm build
    ```
    构建好的文件将输出到 `dist` 目录中。
  * **预览生产版本 (可选):**
    ```bash
    npm run preview
    # 或者 yarn preview
    # 或者 pnpm preview
    ```
    在本地启动一个简单的服务器预览 `dist` 目录中的构建结果。

## 📂 项目结构 (示例)

```
死记硬背-app/
├── public/        # 静态资源，如 index.html, favicon 等
├── src/
│   ├── components/  # React 组件
│   │   └── StatusBar.tsx
│   ├── pages/       # 应用页面
│   │   ├── Home.tsx
│   │   ├── Exercise.tsx
│   │   └── Exam.tsx
│   ├── App.tsx      # 应用入口和路由配置
│   └── index.tsx    # React 渲染入口
├── static/        # 数据文件等，会被复制或处理
│   └── data.csv
├── .gitignore
├── package.json
├── rsbuild.config.ts # Rsbuild 配置
├── tailwind.config.ts # Tailwind CSS 配置
├── tsconfig.json    # TypeScript 配置
└── README.md        # 你正在阅读的文件
```

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](https://www.google.com/search?q=LICENSE) 文件。

## 🤝 贡献

欢迎贡献代码，提出建议或报告 Bug。

-----
