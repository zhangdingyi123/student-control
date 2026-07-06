# 后端开发八股文汇总（基于小林 coding）

> 资料来源：[小林 coding](https://xiaolincoding.com/) 图解系列 + 面试题合集  
> 面试结构：**八股 + 项目 + 算法**（三大方向）  
> 建议复习顺序：计算机基础 → 语言/框架 → 数据库/缓存 → 中间件/分布式 → 系统设计

---

## 目录

> 已拆分为 15 个独立文档（问答题格式），位于 `分册/` 目录

| 序号 | 专题 | 文档 |
|------|------|------|
| 01 | Java 基础 | [分册/01-Java基础.md](分册/01-Java基础.md) |
| 02 | Java 集合 | [分册/02-Java集合.md](分册/02-Java集合.md) |
| 03 | Java 并发（JUC） | [分册/03-Java并发.md](分册/03-Java并发.md) |
| 04 | JVM | [分册/04-JVM.md](分册/04-JVM.md) |
| 05 | Spring 全家桶 | [分册/05-Spring全家桶.md](分册/05-Spring全家桶.md) |
| 06 | MySQL | [分册/06-MySQL.md](分册/06-MySQL.md) |
| 07 | Redis | [分册/07-Redis.md](分册/07-Redis.md) |
| 08 | 计算机网络 | [分册/08-计算机网络.md](分册/08-计算机网络.md) |
| 09 | 操作系统 | [分册/09-操作系统.md](分册/09-操作系统.md) |
| 10 | 消息队列 | [分册/10-消息队列.md](分册/10-消息队列.md) |
| 11 | 分布式 | [分册/11-分布式.md](分册/11-分布式.md) |
| 12 | 系统设计 | [分册/12-系统设计.md](分册/12-系统设计.md) |
| 13 | 数据结构与算法 | [分册/13-数据结构与算法.md](分册/13-数据结构与算法.md) |
| 14 | Linux / Git / Docker | [分册/14-Linux-Git-Docker.md](分册/14-Linux-Git-Docker.md) |
| 15 | 复习建议 | [分册/15-复习建议.md](分册/15-复习建议.md) |

---

## 快速导航（本页汇总）

1. [Java 基础](#一java-基础)
2. [Java 集合](#二java-集合)
3. [Java 并发（JUC）](#三java-并发juc)
4. [JVM](#四jvm)
5. [Spring 全家桶](#五spring-全家桶)
6. [MySQL](#六mysql)
7. [Redis](#七redis)
8. [计算机网络](#八计算机网络)
9. [操作系统](#九操作系统)
10. [消息队列](#十消息队列)
11. [分布式](#十一分布式)
12. [系统设计](#十二系统设计)
13. [数据结构与算法](#十三数据结构与算法)
14. [Linux / Git / Docker](#十四linux--git--docker)
15. [复习建议](#十五复习建议)

---

## 一、Java 基础

### 1.1 核心概念

| 概念 | 要点 |
|------|------|
| **跨平台** | 源码 → 字节码（.class）→ JVM 翻译为各平台机器码；跨平台的是 Java 程序，不是 JVM |
| **JDK / JRE / JVM** | JDK = 开发工具包（含 JRE）；JRE = 运行环境（JVM + 类库）；JVM = 执行字节码的虚拟机 |
| **编译 + 解释** | javac 编译为字节码；JVM 解释执行 + JIT 编译热点代码为机器码 |
| **值传递** | Java 只有值传递：基本类型传值副本；引用类型传引用副本（可改对象内容，不能改原引用指向） |

### 1.2 数据类型（高频）

- **8 种基本类型**：byte(1B)、short(2B)、int(4B)、long(8B)、float(4B)、double(8B)、char(2B)、boolean
- **装箱/拆箱**：自动装箱调用 `valueOf()`，拆箱调用 `xxxValue()`
- **Integer 缓存**：-128 ~ 127 之间会缓存，`==` 比较可能为 true；超出范围比较的是对象地址
- **BigDecimal**：金融计算用 BigDecimal，不用 double（精度丢失）

### 1.3 面向对象（必考）

- **三大特性**：封装、继承、多态
- **多态体现**：方法重载（编译期）、方法重写（运行期）、接口多态
- **重载 vs 重写**：重载同类不同参；重写子类覆盖父类，签名相同，访问权限不能更严
- **抽象类 vs 接口**：抽象类可有构造器、成员变量；接口 JDK8+ 可有 default/static 方法

### 1.4 高频考点

| 考点 | 核心答案 |
|------|----------|
| **String 不可变** | final char[]、字符串常量池、线程安全；修改产生新对象 |
| **String / StringBuffer / StringBuilder** | String 不可变；StringBuffer 线程安全；StringBuilder 非线程安全、性能最好 |
| **equals 和 hashCode** | 重写 equals 必须重写 hashCode；HashMap/HashSet 依赖两者一致性 |
| **深拷贝 vs 浅拷贝** | 浅拷贝只复制引用；深拷贝递归复制对象本身（序列化、克隆、手动复制） |
| **反射** | 运行时获取类信息、动态创建对象；Spring IOC、动态代理都依赖反射 |
| **异常体系** | Error（不可恢复）vs Exception；Checked vs Unchecked |
| **Java 8 新特性** | Lambda、Stream API、Optional、接口默认方法、新日期 API |

---

## 二、Java 集合

### 2.1 体系结构

```
Collection
├── List：ArrayList、LinkedList、Vector
├── Set：HashSet、LinkedHashSet、TreeSet
└── Queue：PriorityQueue、Deque

Map：HashMap、LinkedHashMap、TreeMap、ConcurrentHashMap、Hashtable
```

### 2.2 高频考点

| 集合 | 要点 |
|------|------|
| **ArrayList** | 动态数组，随机访问 O(1)，扩容 1.5 倍，非线程安全 |
| **LinkedList** | 双向链表，头尾操作 O(1)，随机访问 O(n) |
| **HashMap** | 数组 + 链表/红黑树；负载因子 0.75；扩容 2 倍；JDK8 链表 > 8 转红黑树 |
| **ConcurrentHashMap** | JDK7 分段锁；JDK8 CAS + synchronized 锁桶头节点 |
| **HashSet** | 底层 HashMap，值存 key，value 为固定 PRESENT |

### 2.3 HashMap 核心

- **put 流程**：计算 hash → 定位桶 → 无冲突直接放 → 有冲突拉链/树化 → 超阈值扩容
- **为什么容量是 2 的幂**：`(n-1) & hash` 等价取模，分布均匀
- **为什么线程不安全**：并发 put 可能丢数据、形成环（JDK7）

---

## 三、Java 并发（JUC）

### 3.1 线程基础

- **创建方式**：继承 Thread、实现 Runnable、实现 Callable、线程池
- **线程状态**：NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED
- **sleep vs wait**：sleep 不释放锁（Thread）；wait 释放锁（Object），需 notify 唤醒

### 3.2 synchronized

- **作用**：原子性、可见性、有序性
- **锁升级**：无锁 → 偏向锁 → 轻量级锁 → 重量级锁
- **锁对象**：实例方法锁 this；静态方法锁 Class；代码块锁指定对象

### 3.3 volatile

- **保证**：可见性、禁止指令重排
- **不保证**：原子性（i++ 仍需 synchronized 或 Atomic）
- **原理**：MESI 缓存一致性 + 内存屏障

### 3.4 CAS 与 AQS

- **CAS**：Compare And Swap，无锁乐观锁，ABA 问题用版本号解决
- **AQS**：抽象队列同步器，ReentrantLock、Semaphore、CountDownLatch 底层实现
- **ReentrantLock vs synchronized**：可中断、可公平、多 Condition

### 3.5 线程池

```java
// 7 大参数
corePoolSize, maximumPoolSize, keepAliveTime, unit,
workQueue, threadFactory, handler
```

- **执行流程**：核心线程 → 队列 → 非核心线程 → 拒绝策略
- **拒绝策略**：AbortPolicy、CallerRunsPolicy、DiscardPolicy、DiscardOldestPolicy
- **为什么不推荐 Executors**：Fixed/Single 队列无界可能 OOM；Cached 线程数无界

### 3.6 并发工具

| 工具 | 用途 |
|------|------|
| CountDownLatch | 一个或多个线程等待其他线程完成 |
| CyclicBarrier | 一组线程互相等待到达屏障点 |
| Semaphore | 控制并发访问数量 |
| ThreadLocal | 线程本地变量，注意内存泄漏（弱引用 key） |

### 3.7 死锁

- **四个条件**：互斥、占有且等待、不可抢占、循环等待
- **避免**：固定加锁顺序、超时、银行家算法
- **排查**：jstack 看死锁信息

---

## 四、JVM

### 4.1 内存结构

```
┌─────────────────────────────────────┐
│  线程私有：程序计数器、虚拟机栈、本地方法栈  │
├─────────────────────────────────────┤
│  线程共享：堆（新生代+老年代）、方法区/元空间  │
└─────────────────────────────────────┘
```

- **堆**：对象实例；`-Xms` 初始、`-Xmx` 最大
- **栈**：局部变量、方法调用
- **元空间**：类元信息（JDK8 后替代永久代，使用本地内存）

### 4.2 类加载

- **过程**：加载 → 验证 → 准备 → 解析 → 初始化
- **双亲委派**：先委派父加载器；保证核心类不被篡改
- **破坏双亲委派**：SPI（JDBC）、OSGi、热部署

### 4.3 垃圾回收

**判断垃圾**：
- 引用计数法（有循环引用问题）
- **可达性分析**（主流）：从 GC Roots 不可达即为垃圾

**GC Roots**：栈中引用、静态变量、常量、JNI 引用、锁持有对象等

**回收算法**：

| 算法 | 特点 |
|------|------|
| 标记-清除 | 有碎片 |
| 标记-整理 | 无碎片，移动对象有开销 |
| 复制 | 无碎片，浪费一半空间，适合新生代 |
| 分代收集 | 新生代复制，老年代标记-整理/清除 |

**垃圾收集器**：

| 收集器 | 区域 | 特点 |
|--------|------|------|
| Serial | 新生代 | 单线程 |
| ParNew | 新生代 | 多线程（已 deprecated） |
| Parallel Scavenge | 新生代 | 吞吐量优先 |
| CMS | 老年代 | 低延迟，已移除（JDK14） |
| **G1** | 全堆 | 默认，Region 划分，可预测停顿 |
| **ZGC** | 全堆 | 超低延迟（<1ms），TB 级堆 |
| Shenandoah | 全堆 | 类似 ZGC |

**Minor GC / Major GC / Full GC**：
- Minor GC：新生代，频繁，快
- Major GC：老年代
- Full GC：整堆 + 方法区，STW 长，应尽量避免

### 4.4 调优与排查

- **OOM 类型**：堆溢出、栈溢出、元空间溢出、直接内存溢出
- **工具**：jps、jstat、jmap、jstack、MAT、VisualVM
- **排查思路**：看日志 → jstack 看线程 → jmap dump 分析堆

---

## 五、Spring 全家桶

### 5.1 Spring 核心

**IOC（控制反转）**：
- 对象创建交给容器管理，通过 DI 注入依赖
- 实现：XML、注解（@Component/@Service/@Repository/@Controller）、Java Config

**AOP（面向切面）**：
- 横切关注点：日志、事务、权限
- 实现：JDK 动态代理（接口）/ CGLIB（类）
- 概念：切面、切点、通知（Before/After/Around/AfterReturning/AfterThrowing）

**Bean 生命周期**：
```
实例化 → 属性注入 → Aware 回调 → BeanPostProcessor 前置
→ 初始化（@PostConstruct/InitializingBean/init-method）
→ BeanPostProcessor 后置 → 使用 → 销毁
```

**循环依赖**：
- 单例 + 属性注入：三级缓存解决
- 构造器注入：无法解决

**事务**：
- 传播行为：REQUIRED（默认）、REQUIRES_NEW、NESTED 等 7 种
- 失效场景：非 public、同类自调用、异常被捕获、异常类型不匹配

### 5.2 Spring MVC

- **流程**：DispatcherServlet → HandlerMapping → Controller → 返回 ModelAndView → ViewResolver → 渲染
- **常用注解**：@RequestMapping、@RestController、@RequestBody、@PathVariable
- **拦截器 vs 过滤器**：Filter 是 Servlet 规范，Interceptor 是 Spring 的

### 5.3 Spring Boot

- **自动配置原理**：@SpringBootApplication → @EnableAutoConfiguration → spring.factories 加载自动配置类 → @Conditional 条件装配
- **启动流程**：创建 SpringApplication → 准备 Environment → 创建 ApplicationContext → refresh → 启动内嵌 Tomcat
- **常用注解**：@SpringBootApplication、@Configuration、@Bean、@ConditionalOnXxx

### 5.4 MyBatis

- **#{} vs ${}**：#{} 预编译防 SQL 注入；${} 字符串拼接
- **一级缓存**：SqlSession 级别，默认开启
- **二级缓存**：Mapper 级别，需手动开启
- **延迟加载**：association/collection 的 fetchType=lazy

### 5.5 Spring Cloud（了解）

- 注册中心：Nacos / Eureka
- 配置中心：Nacos Config
- 网关：Gateway
- 熔断限流：Sentinel / Hystrix
- 负载均衡：Ribbon / LoadBalancer
- 远程调用：OpenFeign

---

## 六、MySQL

### 6.1 执行流程

```
连接器 → 查询缓存（8.0 已移除）→ 分析器 → 优化器 → 执行器 → 存储引擎
```

### 6.2 存储引擎

| 特性 | InnoDB | MyISAM |
|------|--------|--------|
| 事务 | 支持 | 不支持 |
| 行锁 | 支持 | 表锁 |
| 外键 | 支持 | 不支持 |
| 崩溃恢复 | 支持（redo log） | 不支持 |
| 默认 | MySQL 5.5+ 默认 | 已淘汰 |

### 6.3 索引（最高频）

**为什么用 B+ 树**：
- 相比 B 树：非叶子节点不存数据，一页能存更多索引，树更矮
- 相比 Hash：支持范围查询、排序
- 叶子节点双向链表，适合范围扫描

**索引分类**：
- 聚簇索引（主键索引）：叶子节点存完整行数据
- 二级索引：叶子节点存主键值，需回表
- 覆盖索引：查询列全在索引中，无需回表

**最左匹配原则**：
- 联合索引 (a, b, c)：可用 a / a,b / a,b,c；不可用 b / c / b,c

**索引失效场景**：
- 对索引列运算（函数、类型转换）
- 左模糊查询 `LIKE '%xx'`
- OR 一侧无索引
- 违反最左匹配
- 优化器判断全表扫描更快

### 6.4 事务

**ACID**：
- 原子性：undo log
- 一致性：业务 + 其他三者保证
- 隔离性：锁 + MVCC
- 持久性：redo log

**隔离级别**：

| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|------|-----------|------|
| 读未提交 | ✓ | ✓ | ✓ |
| 读已提交 | ✗ | ✓ | ✓ |
| 可重复读（默认） | ✗ | ✗ | 部分解决 |
| 串行化 | ✗ | ✗ | ✗ |

**MVCC**：
- 隐藏列：trx_id（事务 ID）、roll_pointer（回滚指针）
- Read View：creator_trx_id、m_ids、min_trx_id、max_trx_id
- RC：每次 SELECT 生成新 Read View
- RR：首次 SELECT 生成 Read View，之后复用

### 6.5 锁

| 锁类型 | 说明 |
|--------|------|
| 全局锁 | FTWRL，全库只读 |
| 表锁 | LOCK TABLES |
| 行锁 | 记录锁、间隙锁、临键锁（记录+间隙） |
| 意向锁 | 表级，IS/IX，与行锁兼容 |

**加锁规则**（RR）：
- 唯一索引等值查询：退化为记录锁
- 非唯一索引等值查询：间隙锁 + 记录锁
- 范围查询：间隙锁 + 记录锁

**死锁排查**：`SHOW ENGINE INNODB STATUS`

### 6.6 日志（必考）

| 日志 | 作用 | 层次 |
|------|------|------|
| **redo log** | 崩溃恢复，保证持久性 | InnoDB 引擎层 |
| **undo log** | 回滚、MVCC 多版本 | InnoDB 引擎层 |
| **binlog** | 主从复制、数据恢复 | Server 层 |

**两阶段提交**：prepare（redo log）→ commit（binlog），保证 redo 和 binlog 一致

**update 流程**：
1. 加载数据到 Buffer Pool
2. 写 undo log
3. 更新内存
4. 写 redo log（prepare）
5. 写 binlog
6. 提交事务（redo log commit）

### 6.7 架构与优化

- **主从复制**：binlog → relay log → 从库重放
- **分库分表**：垂直拆分（按业务）、水平拆分（按数据量）
- **慢查询优化**：EXPLAIN 看 type、key、rows、Extra

---

## 七、Redis

### 7.1 数据结构

| 类型 | 底层实现 | 应用场景 |
|------|----------|----------|
| String | SDS | 缓存、计数器、分布式锁 |
| Hash | 压缩列表/哈希表 | 对象缓存、购物车 |
| List | 压缩列表/链表 | 消息队列、时间线 |
| Set | 整数集合/哈希表 | 去重、共同关注 |
| ZSet | 压缩列表/跳表 | 排行榜 |

**跳表**：多层有序链表，查找 O(logN)，Redis 随机层高（概率 25%）

### 7.2 线程模型

- **Redis 6.0 前**：单线程处理命令（IO 多路复用 epoll）
- **Redis 6.0+**：多线程处理网络 IO，命令执行仍单线程
- **为什么快**：内存、单线程无锁、IO 多路复用、高效数据结构

### 7.3 持久化

| 方式 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **RDB** | 快照 | 恢复快、文件小 | 可能丢数据 |
| **AOF** | 记录写命令 | 数据安全 | 文件大、恢复慢 |
| **混合持久化** | RDB + AOF 增量 | 兼顾两者 | Redis 4.0+ |

**AOF 重写**：fork 子进程，根据内存数据生成新 AOF，避免命令冗余

### 7.4 缓存问题（必考）

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| **缓存穿透** | 查不存在的数据，打到 DB | 布隆过滤器、缓存空值 |
| **缓存击穿** | 热点 key 过期，并发打 DB | 互斥锁、逻辑过期 |
| **缓存雪崩** | 大量 key 同时过期 | 过期时间加随机值、多级缓存、熔断降级 |

### 7.5 集群

**主从复制**：
- 全量同步：RDB 快照
- 增量同步：复制缓冲区 + repl_backlog

**哨兵（Sentinel）**：
- 监控、自动故障转移
- 选举 Leader 哨兵 → 选新 Master（Raft 类似）

**Cluster 分片**：
- 16384 个哈希槽
- 槽 → 节点映射
- MOVED/ASK 重定向

### 7.6 分布式锁

```
SET key unique_value NX EX 30
```
- 解锁用 Lua 脚本保证原子性（校验 value 再 DEL）
- Redisson：看门狗自动续期

---

## 八、计算机网络

### 8.1 网络模型

```
应用层 → 传输层 → 网络层 → 数据链路层 → 物理层
```

### 8.2 HTTP/HTTPS

**HTTP 1.1 vs 2.0 vs 3.0**：
- 1.1：长连接、管道化
- 2.0：多路复用、头部压缩、服务器推送
- 3.0：基于 QUIC（UDP），解决队头阻塞

**HTTPS 握手**：
1. Client Hello（支持的加密套件）
2. Server Hello + 证书
3. 客户端验证证书，生成随机数，用公钥加密发送
4. 双方生成会话密钥，对称加密通信

**状态码**：200 成功、301/302 重定向、400 客户端错误、401 未认证、403 禁止、404 未找到、500 服务端错误

**GET vs POST**：GET 幂等、参数在 URL；POST 非幂等、参数在 Body

### 8.3 TCP（最高频）

**三次握手**：
1. SYN（seq=x）
2. SYN+ACK（seq=y, ack=x+1）
3. ACK（ack=y+1）

**为什么三次**：
- 防止历史连接
- 同步双方初始序列号
- 避免服务端资源浪费

**四次挥手**：
1. FIN
2. ACK
3. FIN
4. ACK

**TIME_WAIT**：等待 2MSL，确保最后一个 ACK 到达、让旧连接报文消散

**可靠传输**：序列号、确认应答、超时重传、滑动窗口、流量控制、拥塞控制

**滑动窗口**：接收方告知可接收数据量，发送方据此控制发送

**拥塞控制**：慢启动 → 拥塞避免 → 快重传 → 快恢复

### 8.4 经典场景题

**键入 URL 到页面显示**：
1. DNS 解析
2. TCP 三次握手
3. TLS 握手（HTTPS）
4. 发送 HTTP 请求
5. 服务器处理并返回
6. 浏览器解析渲染（HTML → DOM、CSS → CSSOM → Render Tree → 布局 → 绘制）

---

## 九、操作系统

### 9.1 进程与线程

| 对比 | 进程 | 线程 |
|------|------|------|
| 资源 | 独立地址空间 | 共享进程资源 |
| 切换开销 | 大 | 小 |
| 通信 | IPC（管道、消息队列、共享内存） | 直接读写共享变量 |

**进程状态**：创建 → 就绪 → 运行 → 阻塞 → 终止

**进程通信**：管道、消息队列、共享内存、信号量、Socket

### 9.2 线程同步

- **互斥锁（Mutex）**：同一时刻只有一个线程持有
- **信号量（Semaphore）**：控制并发数量
- **条件变量**：等待某个条件成立
- **读写锁**：读共享、写独占

### 9.3 死锁

- **四个条件**：互斥、占有且等待、不可抢占、循环等待
- **处理**：预防、避免（银行家）、检测+恢复

### 9.4 内存管理

- **分页**：固定大小页框，页表映射，内部碎片
- **分段**：按逻辑分段，外部碎片
- **虚拟内存**：请求分页、页面置换算法（LRU、LFU、FIFO）

### 9.5 IO 多路复用

| 模型 | 特点 |
|------|------|
| select | bitmap，有上限 1024，需遍历 |
| poll | 链表，无上限，仍需遍历 |
| **epoll** | 事件驱动，O(1)，边缘/水平触发 |

**Reactor 模型**：单 Reactor 单线程 / 单 Reactor 多线程 / 主从 Reactor 多线程

**零拷贝**：sendfile、mmap，减少用户态和内核态数据拷贝

---

## 十、消息队列

### 10.1 为什么用 MQ

- 异步：提升响应速度
- 削峰：缓冲突发流量
- 解耦：生产消费独立演进
- 最终一致性

### 10.2 通用问题

| 问题 | 解决方案 |
|------|----------|
| **消息丢失** | 生产者确认、Broker 持久化、消费者手动 ACK |
| **重复消费** | 幂等设计（唯一 ID、数据库去重） |
| **顺序消息** | 同一 key 路由到同一分区/队列 |
| **消息积压** | 扩容消费者、批量消费、降级 |

### 10.3 Kafka

- **架构**：Producer → Broker（Topic/Partition）→ Consumer Group
- **高吞吐**：顺序写磁盘、零拷贝、批量发送、分区并行
- **ISR**：同步副本集合，Leader 选举从 ISR 中选
- **Consumer Group**：组内消费者分摊分区，一条消息只被组内一个消费者消费

### 10.4 RocketMQ

- **架构**：NameServer + Broker + Producer + Consumer
- **消息类型**：普通、顺序、延迟、事务消息
- **事务消息**：半消息 → 本地事务 → Commit/Rollback

### 10.5 RabbitMQ

- **Exchange 类型**：Direct、Fanout、Topic、Headers
- **可靠性**：生产者 Confirm、消息持久化、消费者 ACK

---

## 十一、分布式

### 11.1 CAP 与 BASE

- **CAP**：一致性、可用性、分区容错，最多满足两个（P 必须保证）
- **BASE**：基本可用、软状态、最终一致性

### 11.2 分布式理论

- **2PC**：准备 → 提交，同步阻塞，协调者单点
- **3PC**：增加 CanCommit 阶段，减少阻塞
- **TCC**：Try-Confirm-Cancel，业务层实现
- **Saga**：长事务拆为多个本地事务 + 补偿
- **本地消息表**：业务操作 + 消息表同一事务

### 11.3 分布式锁

| 方案 | 优点 | 缺点 |
|------|------|------|
| Redis | 性能高 | 主从切换可能丢锁 |
| ZooKeeper | 强一致 | 性能较低 |
| 数据库 | 简单 | 性能差、单点 |

**Redisson 红锁**：多个 Redis 节点加锁，过半成功才算成功

### 11.4 分布式 ID

- UUID：无序、太长
- 数据库自增：单点瓶颈
- Redis INCR：依赖 Redis
- **雪花算法**：1bit 符号 + 41bit 时间戳 + 10bit 机器 + 12bit 序列号
- 美团 Leaf、百度 UidGenerator

### 11.5 限流算法

- **固定窗口**：简单，边界突刺
- **滑动窗口**：平滑
- **漏桶**：恒定速率
- **令牌桶**：允许突发流量

---

## 十二、系统设计

### 12.1 设计步骤

1. 需求澄清（功能、规模、性能）
2. 估算（QPS、存储、带宽）
3. 高层设计（架构图）
4. 详细设计（核心模块、数据模型、API）
5. 扩展与优化（瓶颈、权衡）

### 12.2 经典题目

| 题目 | 核心要点 |
|------|----------|
| **短链服务** | Hash/自增 ID、301/302、缓存、过期清理 |
| **秒杀系统** | 前端限流、Redis 预减库存、MQ 异步下单、超卖防护 |
| **定时任务** | 时间轮、延迟队列、分布式锁 |
| **Feed 流** | 推模式（写扩散）、拉模式（读扩散）、推拉结合 |
| **附近的人** | GeoHash、Redis GEO |
| **限流熔断** | 令牌桶、滑动窗口、Sentinel |

### 12.3 高可用

- **负载均衡**：轮询、加权、最少连接、一致性 Hash
- **熔断降级**：Hystrix/Sentinel，快速失败
- **异地多活**：数据同步、流量调度、冲突解决

---

## 十三、数据结构与算法

### 13.1 常见数据结构

- 数组、链表、栈、队列、哈希表
- 二叉树、BST、AVL、红黑树、B/B+ 树
- 堆（大顶堆/小顶堆）、Trie、并查集

### 13.2 常见算法

- 排序：快排、归并、堆排
- 查找：二分、DFS、BFS
- 动态规划、贪心、回溯
- 双指针、滑动窗口、前缀和

### 13.3 刷题建议

- LeetCode Hot 100
- 剑指 Offer
- 按标签刷：数组、链表、二叉树、DP、回溯

---

## 十四、Linux / Git / Docker

### 14.1 Linux 常用命令

```bash
# 进程
ps aux | grep java
top / htop
kill -9 PID

# 网络
netstat -tlnp / ss -tlnp
curl / wget
tcpdump

# 文件
find / -name "*.log"
tail -f app.log
grep "ERROR" app.log

# 磁盘
df -h
du -sh *
```

### 14.2 Git

- **工作区 → 暂存区 → 本地仓库 → 远程仓库**
- `git merge` vs `git rebase`：merge 保留历史，rebase 线性历史
- 冲突解决：手动编辑 → git add → git commit

### 14.3 Docker

- **镜像 vs 容器**：镜像是模板，容器是运行实例
- **Dockerfile**：FROM、RUN、COPY、EXPOSE、CMD/ENTRYPOINT
- **网络模式**：bridge、host、none
- **数据卷**：Volume 持久化数据

---

## 十五、复习建议

### 15.1 优先级（按面试频率）

```
⭐⭐⭐ 必背：MySQL 索引/事务/锁、Redis 缓存问题、Java 并发、JVM GC、TCP/HTTP
⭐⭐   重要：Spring IOC/AOP/事务、分布式理论、消息队列
⭐     了解：Spring Cloud、系统设计、Linux 命令
```

### 15.2 学习方法

1. **先体系后刷题**：先看小林图解系列建立知识框架，再刷面试题
2. **以点扩面**：一个面试题关联一串知识点
3. **画图辅助**：B+ 树、三次握手、Bean 生命周期等画图记忆
4. **模拟面试**：自问自答，录音复盘

### 15.3 推荐资源

| 资源 | 链接 |
|------|------|
| 小林 coding 官网 | https://xiaolincoding.com/ |
| 图解网络 | https://xiaolincoding.com/network/ |
| 图解系统 | https://xiaolincoding.com/os/ |
| 图解 MySQL | https://xiaolincoding.com/mysql/ |
| 图解 Redis | https://xiaolincoding.com/redis/ |
| Java 面试题合集 | https://xiaolincoding.com/interview/ |
| 大厂面经 | https://xiaolincoding.com/backend_interview/ |
| GitHub 仓库 | https://github.com/xiaolincoder/CS-Base |

---

> 本文档为小林 coding 内容的结构化汇总，详细原理和图解请访问官网原文。  
> 祝面试顺利！🚀
