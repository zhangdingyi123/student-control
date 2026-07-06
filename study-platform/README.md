# 学习计划平台（学员打卡 + 教师看板）

## 启动

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

进度保存在 `server/data/store.json`，重启服务不丢失。

## 扩展内容（不限于八股）

平台核心能力是 **课表 + 打卡 + 督学**，具体内容通过配置文件扩展，无需改代码：

| 文件 | 作用 |
|------|------|
| `server/data/platform.json` | 平台名称、任务标签、资料库、任务预设 |
| `server/data/store.json` | 学员、计划、打卡数据 |

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

## 双域名部署（学员 / 教师分离）

在 `server/data/platform.json` 中配置：

```json
"domains": {
  "student": "183ehjez.cn",
  "teacher": "185egugn.cn",
  "useHttps": true
}
```

也可用环境变量覆盖：`STUDENT_DOMAIN`、`TEACHER_DOMAIN`、`USE_HTTPS=true`。

| 域名 | 角色 | 访问 |
|------|------|------|
| **183ehjez.cn** | 学员端 | 打开即进 `/student/`，访问 `/teacher` 会跳到教师域名 |
| **185egugn.cn** | 教师端 | 打开即进 `/teacher/`，访问 `/student` 会跳到学员域名 |

### 上线步骤

详见 **`deploy/DEPLOY.md`**（当前服务器 `47.97.176.185` · 华东1 杭州）。

1. **DNS**：两个域名的 A 记录都指向 `47.97.176.185`
2. **安全组**：放行 80、443
3. **备案**：大陆 ECS + `.cn` 域名需 ICP 备案
4. **上传代码** + 运行 `deploy/ubuntu-setup.sh`
5. **SSL**：`certbot --nginx` 申请证书

本地开发不设域名时，仍用 `localhost:3847/student/` 与 `/teacher/`。

## 局域网访问

同一 WiFi 下，学员可用 `http://你的电脑IP:3847` 访问（教师需先在本机启动服务）。
