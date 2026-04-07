# Google OAuth + D1 数据库设置步骤

已经完成代码修改，现在逻辑是：
- **不登录不能用** → 强制要求登录
- **登录用户**：免费 3 次/天
- **3 次用完** → 提示去订阅页面订阅
- **订阅用户** → 无限使用

接下来你需要在 Cloudflare 完成以下步骤：

## 1. 创建 D1 数据库

在你的项目根目录执行：

```bash
cd apps/worker
npx wrangler d1 create background_remover_users
```

执行完会输出类似这样的内容：
```
✅ Successfully created DB 'background_remover_users'
[[d1_databases]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "background_remover_users"
database_id = "xxxx-xxxx-xxxx-xxxx-xxxx-xxxx"
```

把输出的 `database_id` 复制到 `wrangler.toml`，替换掉空的 `database_id = ""`。

## 2. 创建用户表

执行建表 SQL（包含订阅字段）：

```bash
npx wrangler d1 execute background_remover_users --file=./schema.sql
```

确认表创建成功：
```bash
npx wrangler d1 execute background_remover_users --command="SELECT * FROM users;"
```

## 3. 配置 Worker API URL

修改 `apps/frontend/next.config.js`：

找到这两行：
```javascript
{
  source: '/api/:path*',
  destination: 'https://image-background-remover.YOUR_WORKER.workers.dev/api/:path*',
},
{
  source: '/remove-background',
  destination: 'https://image-background-remover.YOUR_WORKER.workers.dev/remove-background',
},
```

把 `YOUR_WORKER.workers.dev` 换成你实际的 Worker 域名。

然后修改 `apps/frontend/app/page.tsx`：

```javascript
const WORKER_API_URL = 'https://image-background-remover.YOUR_WORKER.workers.dev';
```

同样换成你的 Worker 域名。

## 4. 重新部署 Worker

```bash
cd apps/worker
npx wrangler deploy
```

## 5. 给订阅用户手动设置订阅状态

如果你需要给某个用户开订阅，可以这样：

```bash
npx wrangler d1 execute background_remover_users --command="UPDATE users SET is_subscribed = 1 WHERE email = 'user@example.com';"
```

## 6. 重新部署前端

因为你的仓库已经和 Cloudflare 联动，push 到 GitHub 后会自动部署：

```bash
git add .
git commit -m "Add Google OAuth login + subscription logic"
git push
```

## 7. Google Cloud Console 重要操作

> ⚠️ 你之前把 Client Secret 泄露出来了，建议：
> 1. 打开 [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
> 2. 找到你的 OAuth 2.0 客户端 ID
> 3. 点击「创建新的密钥」获取新的 Client Secret（不过我们这个方案没用 Client Secret，所以不影响功能，但还是建议换一下）
> 4. 确认你的 **Authorized JavaScript origins** 包含你前端部署的域名
> 5. 确认 OAuth consent screen 已经 Published，否则只有测试用户能登录

## 修复登录按钮不显示问题

**已经修复了**：现在把 Google GSI 脚本放到 `layout.tsx` 的 `<head>` 里，打开页面就能加载出来。

## 功能说明

现在你的网站具备：

| 用户类型 | 额度 |
|---------|------|
| 未登录 | ❌ 不能使用 |
| 免费登录用户 | 3 次/天，每天重置 |
| 订阅用户 | ✅ 无限次使用 |

用户表结构：
| 字段 | 说明 |
|------|------|
| `id` | 自增主键 |
| `google_id` | Google 唯一 ID，唯一索引 |
| `email` | 用户邮箱，唯一索引 |
| `name` | 用户姓名 |
| `picture` | 头像 URL |
| `is_subscribed` | 是否订阅：0=免费，1=订阅 |
| `subscription_expires_at` | 订阅到期时间（预留） |
| `created_at` | 注册时间 |
| `last_login_at` | 最近登录时间 |
| `daily_free_count` | 今日已用免费次数 |
| `last_reset_date` | 上次重置日期 |

## 流程：

1. 用户打开网站 → 右上角看到「Sign in with Google」按钮
2. 必须登录才能看到上传区域
3. 登录后显示剩余免费次数
4. 用完 3 次 → 报错带链接跳转到 `/pricing` 订阅页面
5. 你手动在 D1 里把 `is_subscribed` 设为 1 → 用户就可以无限使用

## 问题排查

- 如果登录按钮还是不显示：检查网络面板 → 看 `https://accounts.google.com/gsi/client` 是否成功加载
- 如果登录失败，检查浏览器控制台 Network → 看 `/api/auth/google` 返回什么错误
- 如果 CORS 报错，检查 Worker 域名配置对不对
- 如果用完额度还是能继续用，检查 D1 计数更新是否正常

## 后续扩展

- 接入支付网关（Stripe/PayPal）自动设置 `is_subscribed = 1`
- 支持按月/按年订阅，用 `subscription_expires_at` 过期自动取消
- 查看用户统计数据（注册人数、活跃用户等）
