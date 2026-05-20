# 小宇宙长期版本产品文档

## 核心方向

这个项目的定位不是普通情侣 App，也不是功能很重的管理工具。

它应该是：

> 一个很私密 很轻 只记录你们两个的小地方

当前告白页是 Chapter 01。她点「我愿意」之后，小宇宙被点亮。之后这个网站可以慢慢变成你们的私密时间线 相册 小纸条和约会计划。

## 关键原则

- 告白页负责情绪高潮，小宇宙负责长期陪伴
- 她点「我愿意」后，小宇宙可以立即开启
- 小宇宙第一版不能是空的，要先用现有 memories 和告白流程产生的内容撑起来
- Admin 不应该决定她答应后能不能看到小宇宙，而是用来管理内容和模式
- 上传照片和开相机很适合长期版本，但不要第一版就做成核心
- 不要把所有功能堆到告白流程里，告白流程要短，长期内容放进小宇宙

## 推荐模式

```ts
type SiteMode = "confession" | "cosmos";
```

### confession

显示现有告白体验：

1. 开场
2. 打字机告白
3. 回忆照片墙
4. 时间计时
5. 正式告白
6. Ending flow

### cosmos

显示长期小宇宙首页：

1. 欢迎回来
2. 我们的小宇宙今天也亮着
3. 时间线
4. 小宇宙收藏夹
5. 下次约会
6. Chapter 01 告白页回看入口

## 告白成功后的流程

当前推荐流程：

```text
点我愿意
↓
正式喜欢权限
↓
心跳同步小游戏
↓
解锁私密称呼
↓
第一页纪念卡
↓
选择第一场约会
↓
进入我们的小宇宙
```

隐藏选项「其实我也有一点点喜欢你」也进入同一条小宇宙流程，但文案更柔和。

## 小宇宙自动开启规则

她完成 Ending flow 后，应该自动开启小宇宙。

第一版可以用 localStorage：

```ts
localStorage.setItem("siteMode", "cosmos");
```

以后她在同一台设备回来时直接看到小宇宙。

注意：没有数据库时，换设备后不会同步这个状态。接 Supabase 后再做全设备永久开启。

## 小宇宙第一版内容

第一版不要空。至少包含这些：

### 1. 我们的第一页

来自当前告白流程的纪念卡：

- Chapter 01
- 我们的第一页
- 昵称
- 日期
- 双人模式
- 心跳同步 99.9%

### 2. 时间还在继续

继续使用认识日期：

```text
2026.03.25
```

文案：

```text
你的名字开始写进我的时间里
```

### 3. 回忆收藏

复用当前 `memories` Polaroid 内容。

文案建议：

```text
先把这些放进小宇宙
以后慢慢加新的
```

### 4. 下次约会

显示她选择的第一场正式约会：

- 一起吃饭
- 看电影
- 散步到很晚
- 你来安排

### 5. 小宇宙收藏夹 preview

不要做成新流程，只在 Cosmos Home 里展示轻量 preview：

```text
小宇宙收藏夹
先放三样东西
剩下的以后慢慢收藏
```

收藏项：

- 第一页纪念卡
- 第一场正式约会
- 以后慢慢加的回忆

## Admin 的定位

Admin 不用于阻止小宇宙开启。

Admin 用于：

- 切换站点模式
- 回到告白模式
- 编辑小宇宙标题
- 管理初始照片
- 管理小纸条
- 管理约会计划
- 控制是否开放上传
- 控制是否显示 reset/debug
- 控制是否需要密码

## Admin 推荐字段

```ts
type SiteConfig = {
  siteMode: "confession" | "cosmos";
  startDate: string;
  confessionDate?: string;
  coupleTitle: string;
  herNickname?: string;
  firstDateChoice?: string;
  uploadEnabled: boolean;
  passcodeEnabled: boolean;
};
```

## 实现阶段

### Phase 1 本地小宇宙

目标：先把产品体验走通，不接数据库。

- 点「我愿意」完成 flow 后写入 localStorage
- 下次同设备打开时显示 Cosmos Home
- Cosmos Home 使用现有 memories mock 内容
- 最后一页展示小宇宙收藏夹 preview
- 不做上传
- 不做 admin 后端

### Phase 2 本地 Admin

目标：方便自己调试和内容预览。

- 新增 `/admin`
- 先用 localStorage 控制配置
- 可以切换 `siteMode`
- 可以编辑标题 昵称 第一场约会
- 可以开关 reset/debug

这个阶段只适合本机或简单部署测试，不适合真正保存长期数据。

### Phase 3 Supabase 长期版

目标：真正长期使用。

技术：

```text
Next.js
Supabase
Vercel
```

Supabase 负责：

- site config
- 时间线
- 小纸条
- 约会计划
- 图片 storage
- 可选 passcode

### Phase 4 上传和拍照

目标：让小宇宙慢慢长出来。

先做上传照片，再做开相机拍摄。

原因：

- 上传更稳定
- 相机权限在手机浏览器里体验更复杂
- 照片需要压缩
- 需要删除和管理
- 需要考虑隐私和权限

## 数据模型建议

```text
site_config
- id
- site_mode
- start_date
- confession_date
- couple_title
- her_nickname
- first_date_choice
- upload_enabled
- passcode_enabled
- updated_at
```

```text
events
- id
- date
- title
- body
- image_url
- type
- created_at
```

```text
notes
- id
- body
- is_pinned
- created_at
```

```text
places
- id
- name
- note
- status
- created_at
```

```text
photos
- id
- image_url
- caption
- date
- created_at
```

## 长期 UX 建议

她以后打开网站时，不应该再默认看到告白页。

应该看到：

```text
欢迎回来
我们的小宇宙今天也亮着
```

首页入口：

- 时间线
- 收藏夹
- 下次约会

角落可以放一个很小的入口：

```text
Chapter 01 告白页
```

这样她可以回看告白，但不会每次都重复完整流程。

## 不建议第一版做的事

- 不要一开始就做复杂登录
- 不要一开始就做完整情侣 App
- 不要让告白流程继续变长
- 不要把上传和相机做成告白当天的核心步骤
- 不要让小宇宙空着
- 不要把 admin 做成公开入口

## 最推荐的下一步

下一步实现 Phase 1：

1. 抽出 `ConfessionExperience`
2. 新增 `CosmosHome`
3. 新增 `siteMode` localStorage 判断
4. 完成 ending flow 后写入 `siteMode = cosmos`
5. Cosmos Home 使用现有 memories 和当前 ending 数据
6. 保留 reset/debug 方便测试，最终发布前隐藏

## 一句话决策

> 她点「我愿意」后，小宇宙立即点亮  
> 但第一版小宇宙先用现有回忆和告白结果撑起来  
> Admin 负责管理内容，不负责阻止浪漫发生
