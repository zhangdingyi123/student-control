# 学习计划平台 — 阿里云完整部署指南

从零到学员/教师可访问，按顺序执行即可。

---

## 一、资源清单

| 项目 | 你的配置 |
|------|----------|
| ECS 公网 IP | `47.97.176.185` |
| 系统 | Ubuntu 22.04 64 位 |
| 地域 | 华东 1（杭州） |
| 学员域名 | `183ehjez.cn` |
| 教师域名 | `185egugn.cn` |
| Node 端口（仅本机） | `3847` |
| 对外端口 | `80` / `443`（Nginx 反代） |

| 访问地址 | 说明 |
|----------|------|
| https://183ehjez.cn/student/ | 学员打卡、日历 |
| https://185egugn.cn/teacher/ | 教师看板、课表管理 |

---

## 二、阶段 0：域名交割 & 备案

### 0.1 等待域名交割

1. 登录 [阿里云域名控制台](https://dc.console.aliyun.com/)
2. 找到 `183ehjez.cn`、`185egugn.cn`
3. 状态从 **处理中** 变为 **正常** 后再做 DNS

### 0.2 ICP 备案（大陆服务器必做）

你的 ECS 在**杭州（大陆）**，`.cn` 域名绑定大陆服务器通常需要备案，否则可能无法访问。

1. 阿里云控制台 → **备案** → 开始备案
2. 按向导填写主体信息、域名、服务器（选当前 ECS）
3. 备案审核约 **7～20 个工作日**
4. 备案期间可先把服务部署好，用服务器 IP 内测

> 若暂时不想备案：可把 ECS 换到香港节点，或先用 `http://47.97.176.185` 临时访问（需改 Nginx，见文末附录）。

---

## 三、阶段 1：阿里云控制台配置

### 1.1 安全组放行端口

1. ECS 控制台 → 实例 `launch-advisor-20260604` → **安全组**
2. **入方向** → 添加规则：

| 授权策略 | 协议 | 端口 | 源 | 说明 |
|---------|------|------|-----|------|
| 允许 | TCP | 22 | 0.0.0.0/0 | SSH（建议后期改为你的 IP） |
| 允许 | TCP | 80 | 0.0.0.0/0 | HTTP |
| 允许 | TCP | 443 | 0.0.0.0/0 | HTTPS |

**不要**开放 `3847` 到公网。

### 1.2 DNS 解析

域名交割完成后：

1. 控制台 → **云解析 DNS** → 分别进入两个域名
2. 每个域名添加 **2 条 A 记录**：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | `@` | `47.97.176.185` | 10 分钟 |
| A | www | `47.97.176.185` | 10 分钟 |

3. 等待 5～30 分钟生效，本机验证：

```bash
ping 183ehjez.cn
ping 185egugn.cn
```

应解析到 `47.97.176.185`。

---

## 四、阶段 2：用 Git 上传代码（推荐）

### 4.1 本地已初始化 Git

项目目录 `~/Desktop/八股` 已是 Git 仓库，首次提交已完成。  
**不会提交** `store.json`（含学员 PIN 和登录 token）。

### 4.2 创建远程仓库（GitHub 或 Gitee 均可）

**GitHub（推荐）**

1. 打开 [github.com/new](https://github.com/new) 登录
2. Repository name 例如：`bagu`
3. 选 **Private**（资料库建议私有）
4. **不要**勾选 Add a README
5. 复制地址，HTTPS 形如：  
   `https://github.com/你的用户名/bagu.git`  
   SSH 形如：  
   `git@github.com:你的用户名/bagu.git`

**Gitee（国内访问更快，步骤相同）**

1. [gitee.com](https://gitee.com) → 新建仓库 → 不初始化 README  
2. 地址形如：`https://gitee.com/你的用户名/bagu.git`

### 4.3 本机推送到远程

在 Mac 终端（把 URL 换成你的 GitHub 地址）：

```bash
cd ~/Desktop/八股

# 若之前加过 origin，先删掉：git remote remove origin
git remote add origin https://github.com/zhangdingyi123/student-control.git

git push -u origin main
```

- **HTTPS**：输入 GitHub 用户名 + [Personal Access Token](https://github.com/settings/tokens)（不是登录密码）
- **SSH**：本机已配 `~/.ssh/id_ed25519` 且加到 GitHub 时，可用 `git@github.com:你的用户名/bagu.git`

### 4.4 以后改代码后更新

```bash
cd ~/Desktop/八股
git add -A
git commit -m "描述你的修改"
git push
```

---

## 五、阶段 3：服务器 Git 部署

SSH 登录服务器后 **一条命令** 完成克隆 + 安装 + 启动：

```bash
GIT_REPO='https://github.com/zhangdingyi123/student-control.git' \
TEACHER_PASSWORD='你的强密码' \
sudo -E bash ubuntu-setup.sh
```

若已克隆过，第二次只需：

```bash
cd /opt/study-platform/study-platform/deploy
TEACHER_PASSWORD='你的强密码' sudo -E bash ubuntu-setup.sh
```

### 5.1 服务器上拉取更新

```bash
sudo bash /opt/study-platform/study-platform/deploy/git-pull-update.sh
```

---

## 六、阶段 4（备选）：rsync 上传

不用 Git 时，在 Mac 上：

```bash
cd ~/Desktop/八股
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.cursor' \
  ./ root@47.97.176.185:/opt/study-platform/
```

然后 SSH 执行 `ubuntu-setup.sh`（不设 `GIT_REPO`）。

---

## 七、阶段 5：服务器一键部署

SSH 登录后执行（**先完成 Git 推送**，把 URL 换成你的）：

```bash
GIT_REPO='https://github.com/zhangdingyi123/student-control.git' \
TEACHER_PASSWORD='你的强密码' \
sudo -E bash /opt/study-platform/study-platform/deploy/ubuntu-setup.sh
```

首次若目录为空，先克隆：

```bash
git clone https://github.com/zhangdingyi123/student-control.git /opt/study-platform
cd /opt/study-platform/study-platform/deploy
TEACHER_PASSWORD='你的强密码' sudo -E bash ubuntu-setup.sh
```

看到 **✅ 部署完成** 即成功。

### 7.1 部署后自检

```bash
pm2 status
curl -I http://127.0.0.1:3847/teacher/
curl -I -H "Host: 185egugn.cn" http://127.0.0.1/teacher/
```

---

## 八、阶段 6：配置 HTTPS

DNS 解析生效后，在服务器执行：

```bash
apt install -y certbot python3-certbot-nginx

certbot --nginx \
  -d 183ehjez.cn -d www.183ehjez.cn \
  -d 185egugn.cn -d www.185egugn.cn
```

按提示：

1. 输入邮箱（证书到期提醒）
2. 同意服务条款
3. 选择是否跳转 HTTP → HTTPS（建议选 **是**）

证书自动续期：

```bash
certbot renew --dry-run
```

完成后用 HTTPS 访问：

- https://183ehjez.cn/student/
- https://185egugn.cn/teacher/

---

## 七、阶段 5：教师端初始化（首次使用）

1. 打开 https://185egugn.cn/teacher/
2. 输入部署时设的 **教师密码** 登录
3. **课表管理**（`/teacher/plan.html`）：
   - 点击 **导入默认课表**（21 天 Hot 100 全覆盖版）
   - 点击 **设为活跃课表**
   - 可选：**同步开课日期** 给所有学员
4. **学员看板**（`/teacher/dashboard.html`）：
   - **添加学员** → 填写姓名、批次
   - 把学员登录链接/账号发给学员
5. 学员打开 https://183ehjez.cn/student/ 登录打卡

---

## 八、阶段 6：学员使用流程

1. 访问 https://183ehjez.cn/student/
2. 输入教师分配的姓名登录
3. 日历中点击 D1、D2… 查看当日任务
4. 左侧勾选表示完成；算法题可点链接跳转 LeetCode
5. 八股类任务无外链，学完自行勾选

---

## 九、日常运维

### 9.1 更新代码（改完本地后）

Mac 上重新上传：

```bash
cd ~/Desktop/八股
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.cursor' \
  ./ root@47.97.176.185:/opt/study-platform/
```

服务器上重启：

```bash
cd /opt/study-platform/study-platform/server
npm install --production
pm2 restart study-platform
```

### 9.2 常用命令

```bash
pm2 status                  # 进程状态
pm2 logs study-platform     # 查看日志
pm2 restart study-platform  # 重启
nginx -t && systemctl reload nginx   # 重载 Nginx
```

### 9.3 修改教师密码

```bash
pm2 delete study-platform
cd /opt/study-platform/study-platform/server
TEACHER_PASSWORD='新密码' pm2 start index.js --name study-platform
pm2 save
```

### 9.4 数据备份

学员打卡、课表数据在：

```
/opt/study-platform/study-platform/server/data/store.json
```

定期下载备份：

```bash
scp root@47.97.176.185:/opt/study-platform/study-platform/server/data/store.json \
  ~/Desktop/store-backup-$(date +%Y%m%d).json
```

---

## 十、故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 域名无法访问 | DNS 未生效 / 未备案 | 检查解析、备案状态 |
| `ERR_CONNECTION_REFUSED` | 安全组未放行 80/443 | 检查安全组 |
| 502 Bad Gateway | Node 未启动 | `pm2 status` → `pm2 restart study-platform` |
| 教师密码不对 | 环境变量未生效 | 按 9.3 重设并 pm2 save |
| HTTPS 证书错误 | certbot 未跑成功 | 确认 DNS 已指向本机后重跑 certbot |
| 学员/教师跳错站 | 域名配置不对 | 检查 `server/data/platform.json` 中 domains |

服务器上快速诊断：

```bash
pm2 status
curl -s http://127.0.0.1:3847/teacher/ | head -5
systemctl status nginx
```

---

## 十一、本地开发（不影响线上）

在本机 Mac 调试，无需域名：

```bash
cd ~/Desktop/八股
./启动学习计划平台.sh
```

- 学员：http://localhost:3847/student/
- 教师：http://localhost:3847/teacher/
- 默认密码：`teacher123`

---

## 附录 A：用 IP 临时访问（未备案 / DNS 未就绪）

在服务器编辑 Nginx，增加：

```nginx
server {
    listen 80 default_server;
    server_name 47.97.176.185;
    location / {
        proxy_pass http://127.0.0.1:3847;
        proxy_set_header Host $host;
    }
}
```

```bash
nginx -t && systemctl reload nginx
```

浏览器访问：http://47.97.176.185/teacher/

---

## 附录 C：与旧项目共存（端口 / Nginx 冲突）

若服务器上已有其他项目（例如「直播竞拍」占用了 Nginx 80 端口），会出现：

- 访问 IP 的 `/teacher/` 却打开旧项目页面
- 学习计划平台需单独部署，靠**域名**区分，不靠 IP

### 诊断（SSH 登录后执行）

```bash
# 谁占用了 80 / 3847
ss -tlnp | grep -E ':80|:443|:3847'

# 现有 Nginx 配置
ls -la /etc/nginx/sites-enabled/
grep -r "server_name\|proxy_pass\|root " /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null

# 学习计划平台 Node 是否在跑
pm2 list
curl -s http://127.0.0.1:3847/teacher/ | head -3
```

### 方案 A：两个项目共存（推荐）

旧项目继续用 IP 或旧域名；学习计划平台只用新域名。

1. **不要停**旧项目的 Nginx 配置
2. 部署学习计划平台（`ubuntu-setup.sh` 会新增 `study-platform` 配置，**不删** default）
3. 确保 `nginx-domains.conf` 已启用：

```bash
ls /etc/nginx/sites-enabled/study-platform
nginx -t && systemctl reload nginx
```

4. **DNS 解析** `183ehjez.cn`、`185egugn.cn` → `47.97.176.185`
5. 用域名访问（不要用 IP）：
   - http://183ehjez.cn/student/
   - http://185egugn.cn/teacher/

Nginx 按 `Host` 头分流：新域名 → `:3847` 学习计划；IP / 其他 → 旧项目。

### 方案 B：停掉旧项目，只跑学习计划

```bash
# 查看旧项目 pm2 进程
pm2 list
pm2 stop <旧项目名>    # 或 pm2 delete <旧项目名>

# 禁用旧 Nginx 站点（文件名以你服务器为准）
mv /etc/nginx/sites-enabled/旧项目.conf /etc/nginx/sites-enabled/旧项目.conf.bak
# 或 rm /etc/nginx/conf.d/旧项目.conf

nginx -t && systemctl reload nginx
```

再部署学习计划平台。

### 3847 端口被占用

```bash
ss -tlnp | grep 3847
# 结束占用进程（把 PID 换成上面看到的）
kill <PID>
# 或改学习计划端口
PORT=3850 TEACHER_PASSWORD='xxx' pm2 start index.js --name study-platform
# 并同步修改 nginx-domains.conf 里 proxy_pass 端口
```

---

## 附录 B：一键命令速查

```bash
# ── Mac：上传代码 ──
cd ~/Desktop/八股 && rsync -avz --exclude node_modules --exclude .git --exclude .cursor ./ root@47.97.176.185:/opt/study-platform/

# ── 服务器：首次部署 ──
cd /opt/study-platform/study-platform/deploy && TEACHER_PASSWORD='你的密码' sudo -E bash ubuntu-setup.sh

# ── 服务器：HTTPS ──
apt install -y certbot python3-certbot-nginx && certbot --nginx -d 183ehjez.cn -d www.183ehjez.cn -d 185egugn.cn -d www.185egugn.cn

# ── 服务器：更新后重启 ──
cd /opt/study-platform/study-platform/server && npm install --production && pm2 restart study-platform
```

---

**预计总耗时**：代码部署约 15 分钟；DNS 生效 5～30 分钟；备案 7～20 个工作日（可与部署并行）。
