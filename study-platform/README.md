# 学习计划平台（学员打卡 + 教师看板）

## 启动

需要 **Node.js 22.5+**（使用内置 `node:sqlite`，无需安装 MySQL 等外部数据库）。

```bash
cd study-platform/server
npm install
npm start
```

浏览器打开：

- **学员端**：http://localhost:3847/student/
- **教师端**：http://localhost:3847/teacher/
- 首页（入口选择）：http://localhost:3847/

## 账号说明

| 角色 | 说明 |
|------|------|
| **学员** | 输入姓名注册；可选 PIN 防他人代登 |
| **教师** | 默认密码 `teacher123` |

修改教师密码：

```bash
TEACHER_PASSWORD=你的密码 npm start
```

## 功能

- **学员**：按教师分配的计划打卡，勾选自动同步
- **教师 · 进度看板**：查看全班进度、为学员分配专属计划
- **教师 · 计划规划**：可视化编辑学习计划（增删天/任务、保存、设默认、导入模板）

### 教师计划规划

1. 登录教师端 → **学习计划规划**
2. 新建 / 导入默认模板 / 编辑每日任务
3. **保存计划** → **设为全班默认**（新学员自动使用）
4. 在 **进度看板** 可为单个学员指定不同计划

## 数据存储

学员、计划、打卡数据保存在 SQLite 数据库 `server/data/platform.db`，重启服务不丢失。

首次启动时，若存在旧的 `store.json` 会自动迁移到数据库并备份为 `store.json.migrated`。

## 扩展内容（不限于八股）

平台核心能力是 **课表 + 打卡 + 督学**，具体内容通过配置文件扩展，无需改代码：

| 文件 | 作用 |
|------|------|
| `server/data/platform.json` | 平台名称、任务标签、资料库、任务预设 |
| `server/data/platform.db` | 学员、计划、打卡数据（SQLite） |

### 加一个新资料库（例如考研英语、前端课程）

在 `platform.json` 的 `libraries` 里追加一项：

```json
{
  "id": "english-course",
  "name": "考研英语",
  "type": "external",
  "items": [
    { "id": "unit-1", "name": "第一单元词汇", "short": "U1" }
  ]
}
```

### 加任务预设

在 `taskPresets` 里追加分组，任务可带 `tag`（阅读/视频/作业等）和 `link`（任意 URL）。

### 任务字段

每个任务支持：

- `text` — 学员可见描述
- `tag` — 类型标签（可在 `tags` 数组里自定义）
- `ref` — 关联资料库条目 ID
- `link` — 外链（视频、文档、飞书链接等）

现有八股分册只是第一个资料库 `bagu-volumes`，以后可以并存多个库。

## 线上部署

详见 **`deploy/DEPLOY.md`**（当前服务器 `47.97.176.185` · 华东1 杭州）。

- 学员：http://47.97.176.185:3850/student/
- 教师：http://47.97.176.185:3850/teacher/

上传代码后运行 `deploy/ubuntu-setup.sh` 或 `deploy/git-pull-update.sh` 更新。

## 局域网访问

同一 WiFi 下，学员可用 `http://你的电脑IP:3847` 访问（教师需先在本机启动服务）。
