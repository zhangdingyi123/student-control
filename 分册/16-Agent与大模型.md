# Agent 与大模型面试题（合集）

> **资料整合自**：[Agent-Interview-100](https://github.com/tahitimoon/Agent-Interview-100) · [agent-interview-guide](https://github.com/developmentmachine/agent-interview-guide) · [ai-agent-engineer-handbook](https://github.com/harrisliangsu/ai-agent-engineer-handbook) · [LLM-Agent-Interview-Guide](https://github.com/Lau-Jonathan/LLM-Agent-Interview-Guide) · [卡码笔记 Agent 面试汇总](https://notes.kamacoder.com/interview/llm/agent_interview.html)  
> **面试结构**：大模型基础（30%）+ Agent/RAG/工具（40%）+ 项目实战（20%）+ 算法（10%）  
> **难度标记**：⭐ 基础 · ⭐⭐ 中等 · ⭐⭐⭐ 困难

---

## 复习优先级

### ⭐⭐⭐ 必背（几乎每场都问）

| 模块 | 核心考点 |
|------|----------|
| Agent 基础 | LLM vs Agent、四模块、Workflow vs Agent |
| 工作模式 | ReAct、Plan-and-Execute、Reflection、防死循环 |
| 工具协议 | Function Calling 四步流程、MCP、A2A、Skills 协作关系 |
| RAG | 标准 Pipeline、混合检索、Rerank、Agentic RAG |
| 记忆 | 短期/长期/工作记忆、压缩策略、RAG 与记忆关系 |
| 工程 | 成本优化、可观测性、Prompt Injection 防御 |
| **AI 编程工具** | **Cursor vs Codex、MCP Host、Rules/Skills、/goal** |

### ⭐⭐ 重要（高频）

| 模块 | 核心考点 |
|------|----------|
| LLM 基础 | Self-Attention、KV Cache、RoPE、Prefill/Decode |
| 微调 | LoRA/QLoRA、DPO vs PPO、GRPO |
| 多 Agent | 编排模式、Handoff、框架对比 |
| 评估 | LLM-as-Judge、RAGAS、Benchmark 陷阱 |
| 安全 | 最小权限、Human-in-the-Loop、沙箱 |

### ⭐ 了解（按岗位准备）

推理优化（FlashAttention、Speculative Decoding）、GraphRAG、MCTS、Agentic-RL、EU AI Act

---

## 1. Agent 基础

### 问：LLM 和 Agent 有什么区别？⭐

**答：**

**LLM** 是条件概率模型 `P(token_n | token_1...token_{n-1})`，无状态、无记忆、不感知外部世界，只会「说」不会「做」。

**LLM 四大局限**：
1. 只会说不会做——能告诉你查天气，但不会自己去查
2. 没有跨会话记忆——上下文满了就「失忆」
3. 知识截止——训练数据有截止日期
4. 不会自主规划——无法拆解多步任务

**Agent** = LLM（大脑）+ 规划 + 记忆 + 工具，在循环中自主完成目标。

| 维度 | LLM | Agent |
|------|-----|-------|
| 输出 | 文本 | 文本 + 工具调用 + 状态更新 |
| 状态 | 无状态 | 有记忆、有任务状态 |
| 外部世界 | 不可感知 | 通过工具操作 |
| 典型场景 | 问答、写作 | 自动化任务、复杂工作流 |

**面试加分**：别只说「Agent = LLM + 工具」，要讲清四模块如何在 Loop 中协作。

---

### 问：Agent 和 Workflow 有什么区别？什么时候用哪个？⭐⭐

**答：**

核心分歧：**控制权在代码还是 LLM**。

| 维度 | Workflow | Agent |
|------|----------|-------|
| 控制者 | 开发者/代码 | LLM |
| Token 消耗 | 低（约 1x） | 高（约 4-8x） |
| 可预测性 | 高 | 低 |
| 灵活性 | 低 | 高 |
| 适合任务 | 固定流程（订单、报表） | 开放式目标（研究、复杂客服） |
| 调试难度 | 容易 | 困难 |

**Workflow**：流程写死在代码里，LLM 只是某些节点的「智能处理器」，不决定下一步。

**Agent**：接收目标后自主规划路径，同 Agent 面对不同输入可能走完全不同路径。

**生产实践**：混合架构最常见——简单问题走 Workflow，复杂/异常场景启动 Agent，投诉直接升级人工。

---

### 问：Agent 的核心组件有哪些？⭐

**答：**

经典四模块：

1. **感知（Perception）**：接收用户输入、工具返回、环境状态
2. **规划（Planning）**：任务拆解、步骤排序、动态重规划
3. **记忆（Memory）**：短期上下文 + 长期外部存储
4. **行动（Action）**：通过 Function Calling 调用工具/API/代码执行器

扩展组件：反思（Reflection）、评估（Evaluation）、护栏（Guardrails）、可观测性（Tracing）

---

### 问：Agent 有哪些主流工作模式？⭐⭐

**答：**

| 模式 | 核心思路 | 优点 | 缺点 | 适用场景 |
|------|----------|------|------|----------|
| **ReAct** | Thought → Action → Observation 循环 | 透明可审计、灵活 | Token 高、可能死循环 | 通用 Agent，LangChain 默认 |
| **Plan-and-Execute** | 先规划完整计划，再逐步执行 | Token 省约 80% | 计划可能过时 | 步骤明确的复杂任务 |
| **Reflection** | 生成 Agent + 审查 Agent 迭代 | 输出质量高 | 延迟和成本翻倍 | 代码生成、法律文书 |
| **Multi-Agent** | 多专业 Agent 协作 | 并行、专业分工 | 调试难、成本高 | 研究+编码+审查等复合任务 |

**Anthropic 原则**：不要过早引入 Multi-Agent，一个强大的单 Agent 往往比多个弱 Agent 更稳定省钱。

---

### 问：ReAct 是什么？如何防止死循环？⭐⭐

**答：**

ReAct（Reasoning + Acting）是最经典的 Agent 模式：

```
Thought: 用户想查北京明天天气，需要调用天气工具
Action: get_weather(city="北京", date="明天")
Observation: {"weather":"中雨","temp":"14-20°C"}
Thought: 已获取天气，生成最终回答
Final Answer: 明天北京有中雨，建议带伞
```

**防死循环三件套**（面试必答）：
1. **最大步数限制**——通常 15 步，超过强制终止
2. **重复动作检测**——连续 3 次相同工具+相同参数，退出并基于已有信息总结
3. **超时控制**——整体任务设置最大执行时间

---

### 问：Plan-and-Execute 和 ReAct 的区别？⭐⭐

**答：**

- **ReAct**：每步都重新思考全局，灵活但 Token 消耗大（每步约 100% 规划开销）
- **Plan-and-Execute**：Planner 一次性生成完整计划，Executor 只执行当前步（规划开销约 20%）

**动态重规划**：执行中发现偏差（如计划 5 个竞品却搜出 50 个），在检查点触发 Re-plan，更新后续步骤。

---

### 问：Reflection / Reflexion 是什么？⭐⭐

**答：**

- **Reflection**：一个 Agent 生成，另一个 Agent 审查，循环直到质量达标（Writer + Reviewer）
- **Reflexion**：Agent 根据失败经验写入「反思记忆」，下次避免重复犯错

适用：代码生成、法律文书、学术论文等对质量要求高的场景。也可用于幻觉自检——发现事实存疑时触发验证，调用搜索工具核实。

---

### 问：Anthropic 总结的 6 大 Agentic Patterns 是什么？⭐⭐⭐

**答：**

| Pattern | 说明 | 场景 |
|---------|------|------|
| Prompt Chaining | 多步 Prompt 串联，上步输出作下步输入 | 固定多步流水线 |
| Routing | 按输入类型路由到不同处理链 | 多意图客服 |
| Parallelization | 多子任务并行后聚合 | 批量分析 |
| Orchestrator-Workers | 协调者分配子任务给 Worker | 复杂研究任务 |
| Evaluator-Optimizer | 生成 + 评估迭代 | 高质量写作/代码 |
| Autonomous Agent | 完全自主 Loop | 开放式探索任务 |

**核心区分**：前 5 种是 **Workflow**（开发者控制），最后一种是 **Agent**（LLM 控制）。

---

### 问：Agent 的 4 种典型失败模式及对策？⭐⭐⭐

**答：**

| 失败模式 | 表现 | 对策 |
|----------|------|------|
| Loop of Death | 工具反复失败仍重试 | max_steps + 重复动作检测 + 熔断 |
| 幻觉工具调用 | 调用不存在的工具 | 严格校验工具名，未知工具直接报错 |
| 上下文污染 | 历史对话干扰当前判断 | 合理截断 + 任务重置机制 |
| 工具输出爆炸 | 返回超大数据塞满上下文 | 输出截断 + 分页 + 摘要 |

---

## 2. 工具调用与协议

### 问：Function Calling 是什么？底层怎么实现？⭐⭐

**答：**

Function Calling 让 LLM 输出**结构化工具调用指令**，由应用程序实际执行。

**关键认知：LLM 不执行函数**，只输出「我想调用什么、传什么参数」。

**四步流程**：
1. **定义工具**——向 LLM 提供 tools 数组（name、description、parameters JSON Schema）
2. **LLM 判断并生成**——输出 `tool_calls` 而非普通文本
3. **应用层解析执行**——根据 name 路由到实际函数，获取结果
4. **结果回传**——以 `role: "tool"` 消息追加到 messages，LLM 生成最终回答

**并行调用**：GPT-4o / Claude 3.5+ 支持一次返回多个 tool_calls，并行执行延迟 = max(T1,T2,T3) 而非求和。

**厂商差异**：

| | OpenAI | Anthropic |
|---|--------|-----------|
| 工具定义 | tools + function | tools + input_schema |
| 调用输出 | tool_calls 数组 | tool_use content block |
| 结果传回 | role: "tool" | role: "user" + tool_result |

---

### 问：MCP 是什么？解决什么问题？⭐⭐

**答：**

**MCP（Model Context Protocol）** 是 Anthropic 主导的开放协议，标准化 Agent 与外部工具/数据源的集成。

**核心问题：N×M 爆炸**——10 个应用 × 20 个工具 = 200 套集成代码。MCP 将其变为 N+M。

**三角色架构**：
- **MCP Host**：AI 应用（Cursor、Claude Desktop、自研 Agent）
- **MCP Client**：Host 内的通信层
- **MCP Server**：暴露工具能力的服务端（每个第三方服务一个）

**三类资源**：Tools（可执行操作）、Resources（可读数据源）、Prompts（预设模板）

**工具发现**：Agent 启动时向 Server 发 `tools/list`，动态发现能力，无需重新部署。

**安全三层**：能力声明、授权控制、审计追踪

**底层协议**：本地 stdio，远程 HTTP+SSE，消息格式 JSON-RPC 2.0

---

### 问：A2A 是什么？和 MCP 什么关系？⭐⭐

**答：**

| | MCP | A2A |
|---|-----|-----|
| 解决 | Agent ↔ 工具（纵向） | Agent ↔ Agent（横向） |
| 推动方 | Anthropic | Google + 50+ 伙伴 |
| 成熟度 | 事实标准 | 早期快速发展 |

**A2A 核心概念**：
- **Agent Card**：Agent 能力名片（名称、端点、认证）
- **Task**：标准化任务对象，生命周期 CREATED → PROCESSING → COMPLETED/FAILED
- **Message & Artifact**：过程通信用 Message，最终成果用 Artifact

**关系**：互补不替代。Agent 内部用 MCP 调工具，Agent 之间用 A2A 协作。

---

### 问：Skills 是什么？和 Prompt / Few-shot 的区别？⭐⭐

**答：**

| | System Prompt | Few-shot | Skills |
|---|---------------|----------|--------|
| 作用范围 | 全局一直生效 | 示例模仿格式 | 按需激活的领域方法论 |
| 内容 | 通用行为规范 | 输入输出样例 | 身份+流程+标准+输出规范 |
| 激活 | 每次加载 | 每次加载 | 匹配 triggers 才加载 |

**类比**：Function Call = 打电话能力，MCP = 公司统一通讯录，Skills = 岗位培训手册。

**协作链**：Skills 决定「怎么想」→ MCP 决定「用什么」→ Function Call 决定「怎么调」。

---

### 问：如何设计 Tool Schema 让 Agent 用得对？⭐⭐

**答：**

1. **description 写清用途和边界**——什么时候用、什么时候不用
2. **参数 description 具体**——「城市名称，如北京、上海」而非泛泛的 string
3. **required 最小化**——只标真正必需的参数
4. **工具数量控制**——只给当前任务需要的工具子集，减少描述 Token 和误选
5. **返回结构稳定**——JSON 格式一致，便于 LLM 解析
6. **失败处理**——返回明确错误信息，而非空响应

---

### 问：工具调用失败怎么处理？⭐⭐

**答：**

1. **超时控制**——每个工具设独立超时
2. **重试策略**——指数退避，最多 N 次，避免盲目重试
3. **熔断器**——连续失败达阈值后暂停调用该工具
4. **降级**——主工具失败走备用方案或告知用户
5. **幂等性**——重试不产生副作用（如用 idempotency key）
6. **向 LLM 反馈明确错误**——让它调整策略而非死循环

---

## 3. RAG 检索增强生成

### 问：RAG 是什么？解决了 LLM 哪些局限？⭐

**答：**

RAG（Retrieval-Augmented Generation）= 检索相关文档 + 注入 Prompt + LLM 生成。

解决：
1. **知识截止**——实时检索外部知识库
2. **幻觉**——基于检索内容回答，可溯源
3. **私有数据**——无需微调即可接入企业文档
4. **成本**——比全量微调便宜

---

### 问：RAG 标准 Pipeline 及各阶段瓶颈？⭐⭐

**答：**

```
Indexing: 文档加载 → 分块 → Embedding → 存入向量库
Retrieval: 查询改写 → 召回（Top-K）→ 重排序
Generation: 拼接 Context → LLM 生成
```

| 阶段 | 瓶颈 |
|------|------|
| 分块 | 块太大丢细节，太小丢语义 |
| Embedding | 模型与领域不匹配 |
| 召回 | 语义漂移、关键词缺失 |
| 生成 | Lost in the Middle、上下文过长 |

---

### 问：文档分块策略有哪些？⭐⭐

**答：**

| 策略 | 说明 | 适用 |
|------|------|------|
| Fixed Size | 固定字符/token 数 + overlap | 通用，简单 |
| Semantic | 按语义边界切分 | 结构清晰的文档 |
| Recursive | 按标题/段落层级递归切 | 技术文档、Markdown |
| Late Chunking | 先全文 Embedding 再切 | 保留更多上下文 |

**经验**：chunk 256-512 token，overlap 10-20%；中文注意分词和标点。

---

### 问：混合检索为什么比单 Dense 好？⭐⭐

**答：**

- **Dense（向量）**：语义相似，但对专有名词、编号、精确匹配弱
- **Sparse（BM25）**：关键词精确匹配，但不理解语义

**融合方式**：
1. **RRF（Reciprocal Rank Fusion）**——按排名融合，不依赖分数尺度
2. **加权融合**——`score = α·dense + (1-α)·sparse`

生产环境混合检索通常比单 Dense 召回率高 10-30%。

---

### 问：Reranker 是什么？Cross-Encoder vs Bi-Encoder？⭐⭐

**答：**

- **Bi-Encoder**：query 和 doc 分别 Embedding，用余弦相似度——快，适合召回
- **Cross-Encoder**：query 和 doc 拼接后过 Transformer——准，但慢，适合精排

**流程**：Bi-Encoder 召回 Top-100 → Cross-Encoder Rerank 到 Top-5 → 送入 LLM。

常见模型：bge-reranker、Cohere Rerank、Jina Reranker。

---

### 问：GraphRAG / Self-RAG / CRAG / Agentic RAG 各解决什么？⭐⭐⭐

**答：**

| 变体 | 核心思路 | 解决什么问题 |
|------|----------|--------------|
| **GraphRAG** | 构建知识图谱 + 社区摘要 | 全局性问题、跨文档推理 |
| **Self-RAG** | 模型自判断要不要检索、检索质量够不够 | 减少无效检索和幻觉 |
| **CRAG** | 检索结果置信度低时触发 Web 搜索 | 检索失败兜底 |
| **Agentic RAG** | Agent 自主决定检索策略、多轮检索 | 复杂知识问答 |

---

### 问：RAG 和 Agent 是什么关系？⭐⭐

**答：**

| | RAG | Agent |
|---|-----|-------|
| 目的 | 补充知识 | 完成任务 |
| 流程 | 固定（检索→生成） | 动态（思考→行动） |
| 工具 | 仅检索 | 任意工具 |
| 自主性 | 无 | 有 |

**正确理解**：RAG 是 Agent 工具箱里的「知识查询器」，不是对立关系。Agent 需要知识时调 RAG，需要操作时调 API。

---

### 问：RAGAS 四大指标是什么？⭐⭐

**答：**

| 指标 | 度量什么 |
|------|----------|
| Faithfulness | 回答是否忠于检索内容（防幻觉） |
| Answer Relevancy | 回答是否切题 |
| Context Precision | 检索到的内容是否相关 |
| Context Recall | 检索是否覆盖了回答问题所需信息 |

---

### 问：长上下文（128K/1M）vs RAG 怎么选？⭐⭐⭐

**答：**

| 场景 | 推荐 |
|------|------|
| 文档量小（<100 页） | 长上下文直接塞 |
| 文档量大、需实时更新 | RAG |
| 需要精确溯源 | RAG |
| 多文档交叉推理 | RAG + Rerank |
| Agent 多轮对话 | RAG 按需检索 + 上下文管理 |

**注意**：长上下文有 Lost in the Middle 问题，中间位置信息容易被忽略。

---

## 4. 记忆与状态

### 问：Agent 记忆有哪些类型？⭐⭐

**答：**

| 类型 | 存储 | 特点 | 例子 |
|------|------|------|------|
| 工作记忆 | 上下文窗口 | 最快，容量有限 | 当前对话、工具调用历史 |
| 短期记忆 | 上下文窗口 | 当前会话 | 任务状态、加载的 Skill |
| 长期记忆（语义） | 向量数据库 | 模糊语义检索 | 用户偏好、历史经验 |
| 长期记忆（结构化） | 关系数据库 | 精确查询 | 用户档案、订单号 |
| 状态存储 | Redis/KV | 极快读写 | 任务进度、中间结果 |

**认知心理学映射**：工作记忆 ≈ 短期；情景记忆 ≈ 会话历史；语义记忆 ≈ 向量库知识。

---

### 问：上下文窗口满了怎么办？⭐⭐

**答：**

三种压缩策略：
1. **滑动窗口**——丢弃最旧消息，保留最近 N 条
2. **摘要压缩**——LLM 总结旧对话为一段话，归档到向量库
3. **重要性过滤**——只保留用户指令、关键结论，丢弃过程细节

**MemGPT 思路**：OS 式分层——主上下文 = RAM，外部存储 = 磁盘，按需 page in/out。

**触发时机**：通常 token 达到窗口 80% 时触发压缩。

---

### 问：记忆污染（Memory Corruption）是什么？怎么防？⭐⭐

**答：**

Agent 把错误信息、幻觉、过时数据写入长期记忆，后续检索到并放大错误。

**防御**：
1. 写入前验证——只存高置信度信息
2. 带来源和时间戳——便于过期清理
3. 定期清理——遗忘机制、TTL
4. 人工审核关键记忆写入
5. 检索时做相关性 + 时效性过滤

---

### 问：如何设计端到端 Agent 记忆系统？⭐⭐⭐

**答：**

```
用户输入 → 加载用户档案（DB）+ 检索相关记忆（VectorDB）
         → 注入工作记忆（上下文）
         → Agent 执行（工具调用历史追加到工作记忆）
         → 任务完成 → 提取关键信息写入长期记忆
         → 上下文快满 → 摘要压缩 + 归档
```

**读写时机**：
- **写入**：任务完成、用户提供个人信息、发现新知识、记录失败原因
- **读取**：任务开始、遇到陌生问题、需要事实核查

---

## 5. 规划与推理

### 问：CoT 为什么有效？⭐

**答：**

Chain-of-Thought 让模型生成中间推理步骤再得出答案。本质是给模型更多 compute budget（更多 token = 更多计算）。

**生效条件**：通常需要足够大的模型（>10B）才涌现 CoT 能力。小模型加 CoT 可能反而更差。

---

### 问：CoT / ToT / Self-Consistency 区别？⭐⭐

**答：**

| 方法 | 思路 | 适用 |
|------|------|------|
| CoT | 线性链式推理 | 一般推理题 |
| Self-Consistency | 多次 CoT 采样，多数投票 | 有明确答案的问题 |
| ToT | 树状探索多条路径，可回溯 | 组合优化、游戏 |

---

### 问：Reasoning 模型（o1/R1）和标准模型区别？⭐⭐

**答：**

| | 标准模型 | Reasoning 模型 |
|---|----------|----------------|
| 推理方式 | 直接输出 | 内部长 CoT 再输出 |
| 延迟 | 低 | 高（思考 token 多） |
| 适用 | 对话、工具调用 | 数学、代码、复杂推理 |
| 代表 | GPT-4o、Claude 3.5 | o1/o3、DeepSeek-R1 |

Agent 场景：规划/推理用 Reasoning 模型，工具执行/格式化用小模型，做模型路由。

---

## 6. 多 Agent 系统

### 问：多 Agent 编排模式有哪些？⭐⭐

**答：**

| 模式 | 结构 | 适用 |
|------|------|------|
| Hub-Spoke | 中心协调者 + 多个 Worker | 任务明确可拆分 |
| Pipeline | 流水线式传递 | 有严格先后顺序 |
| Hierarchical | 层级管理 | 大型复杂项目 |
| Swarm | 对等协作、涌现行为 | 探索性任务 |

**通信方式**：消息传递、共享状态（黑板模式）、Handoff（任务交接）

---

### 问：主流多 Agent 框架对比？⭐⭐

**答：**

| 框架 | 特点 |
|------|------|
| LangGraph | 图结构编排，状态机，精细控制 |
| CrewAI | 角色化 Agent，任务分工，上手简单 |
| AutoGen | 微软，对话式多 Agent，研究友好 |
| OpenAI Agents SDK | 官方，原生 handoff 机制 |

---

### 问：多 Agent 冲突怎么处理？⭐⭐

**答：**

1. **优先级规则**——协调者 Agent 做最终决策
2. **投票机制**——多个 Agent 意见不一致时投票
3. **人工介入**——关键分歧升级人类
4. **锁定机制**——共享资源加锁避免竞争
5. **明确职责边界**——每个 Agent 只管自己领域，减少重叠

---

## 7. 大模型基础

### 问：Self-Attention 计算过程及复杂度？⭐⭐⭐

**答：**

```
Q = XW_Q,  K = XW_K,  V = XW_V
Attention(Q,K,V) = softmax(QK^T / √d_k) · V
```

- 输入序列长度 n，维度 d
- QK^T 计算：O(n²·d)
- 空间：需存储 n×n 注意力矩阵

**优化**：FlashAttention 通过分块计算避免物化完整注意力矩阵，降低 HBM 读写。

---

### 问：KV Cache 是什么？为什么能加速推理？⭐⭐

**答：**

自回归生成时，每步只需计算新 token 的 Q，但 K/V 历史不变。KV Cache 缓存历史 K/V，避免重复计算。

**显存估算**：`2 × n_layers × n_heads × head_dim × seq_len × batch × bytes`

**优化**：GQA（Grouped Query Attention）多个 Q 头共享 K/V，KV Cache 减至 1/8；MQA 更极端。

---

### 问：RoPE 是什么？为什么外推会崩？⭐⭐

**答：**

RoPE（Rotary Position Embedding）用旋转矩阵编码位置，使注意力得分天然依赖相对距离 m-n。

**外推崩溃原因**：训练上下文外的高频分量旋转角度未见过，注意力分布塌缩。

**修复**：NTK-aware scaling、YaRN（Llama-3.1 128K 采用）

---

### 问：Prefill 和 Decode 两阶段区别？⭐⭐

**答：**

| | Prefill | Decode |
|---|---------|--------|
| 输入 | 完整 Prompt（并行） | 每次 1 个 token（串行） |
| 计算特点 | Compute-bound | Memory-bound |
| 优化方向 | 大 batch、FlashAttention | KV Cache、量化、投机解码 |

Agent 场景：工具返回大量文本时 Prefill 开销大；多轮对话 KV Cache 持续增长。

---

### 问：FlashAttention 解决了什么？⭐⭐⭐

**答：**

标准 Attention 需物化 n×n 矩阵到 HBM，IO 成为瓶颈。FlashAttention 分块计算 + 在线 softmax，不存完整矩阵，降低 HBM 访问，提速 2-4x，显存从 O(n²) 降到 O(n)。

---

### 问：Speculative Decoding 原理？⭐⭐

**答：**

小 draft model 一次生成 K 个 token，大 target model 一次 forward 并行验证，rejection sampling 保证输出分布一致。

**收益最大场景**：draft/target 分布相似 + target 是 memory-bound 时，加速 2-3x。

---

### 问：PagedAttention 解决了什么？⭐⭐⭐

**答：**

借鉴 OS 虚拟内存，把 KV Cache 切成固定大小 block，每序列维护 block table。解决：
1. 内部碎片（预分配 max_len 但只用 200 token）
2. 外部碎片
3. 共享前缀无法去重

配合 Continuous Batching，吞吐提升 2-24x。

---

## 8. 微调与对齐

### 问：SFT / DPO / PPO / GRPO 区别？⭐⭐

**答：**

| 方法 | 思路 | 特点 |
|------|------|------|
| SFT | 监督微调，模仿高质量回答 | 基础，数据质量关键 |
| PPO | RLHF，奖励模型 + 策略优化 | 效果好但训练复杂不稳定 |
| DPO | 直接偏好优化，无需奖励模型 | 简单稳定，近年主流 |
| GRPO | 组相对策略优化（DeepSeek R1） | 无需 Critic 模型，省显存 |

**DPO vs PPO**：DPO 把 RL 问题转化为分类问题，不需要单独训练 Reward Model，训练更稳定。

---

### 问：LoRA / QLoRA 原理？⭐⭐

**答：**

LoRA：冻结原模型，只训练低秩分解 `ΔW = BA`（r 通常 8-64），参数量减少 99%+。

QLoRA：原模型 4-bit 量化 + LoRA 适配器 fp16 训练，单卡 24G 可跑 65B。

**秩的选择**：r=8 适合简单任务，r=64 适合复杂领域，过大可能过拟合。

---

### 问：灾难性遗忘怎么解决？⭐⭐

**答：**

1. **LoRA 而非全量微调**——只改少量参数
2. **混合训练数据**——通用数据 + 领域数据按比例混合
3. **EWC / 正则化**——约束重要参数不要偏离太多
4. **持续学习**——定期用通用数据 replay

---

## 9. Prompt 与 Context Engineering

### 问：Context Engineering 和 Prompt Engineering 区别？⭐⭐

**答：**

- **Prompt Engineering**：设计单条/模板 Prompt 的措辞和结构
- **Context Engineering**：管理整个上下文窗口的内容——什么信息、以什么顺序、何时注入/压缩

Agent 场景 Context Engineering 更重要：工具列表、记忆、检索结果、Skill 都占上下文，需要动态管理。

---

### 问：如何防止 Prompt Injection？⭐⭐⭐

**答：**

**攻击面**：用户输入、检索到的文档、网页内容、工具返回值都可能注入恶意指令。

**防御纵深**：
1. **数据/指令分离**——外部内容放在明确 data 区域，与 system 指令隔离
2. **结构化包裹**——`<user_input>...</user_input>` 标记边界
3. **输入过滤**——检测「忽略之前指令」等可疑模式
4. **最小权限**——Agent 只能调用声明的工具
5. **输出校验**——Guardrails 检查敏感操作
6. **Human-in-the-Loop**——高风险操作人工审批

---

### 问：结构化输出怎么实现？⭐⭐

**答：**

1. **JSON Mode**——OpenAI `response_format: json_object`
2. **Function Calling**——强制输出符合 Schema
3. **Grammar-based**——Outlines、Guidance 约束生成
4. **Prompt 约束**——明确格式 + Few-shot 示例
5. **后处理校验**——解析失败则重试

---

## 10. 评估与可观测性

### 问：LLM-as-Judge 三大 bias 及缓解？⭐⭐⭐

**答：**

| Bias | 表现 | 缓解 |
|------|------|------|
| Position bias | 倾向选第一个/最后一个 | 交换位置多次评判 |
| Verbosity bias | 偏好更长的回答 | 明确「简洁 ≠ 差」 |
| Self-enhancement | 同系列模型偏爱自己 | 用不同系列模型做 Judge |

**判官原则**：Judge 模型能力应强于被测模型。

---

### 问：Agent 评估三层粒度？⭐⭐⭐

**答：**

| 粒度 | 评估什么 | 例子 |
|------|----------|------|
| Step-level | 单步工具调用是否正确 | 参数对不对、工具选对没 |
| Trajectory-level | 整体执行路径是否合理 | 步骤顺序、有无冗余 |
| Outcome-level | 最终任务是否完成 | 用户目标达成率 |

---

### 问：Agent Benchmark 有哪些？⭐⭐

**答：**

| Benchmark | 侧重 |
|-----------|------|
| SWE-bench | 真实 GitHub Issue 修代码 |
| GAIA | 通用 AI 助手多步推理 |
| WebArena | 网页操作 Agent |
| OSWorld | 操作系统级 Agent |
| tau-bench | 工具使用正确性 |

**注意**：静态 Benchmark 容易被 hack（过拟合测试集），生产需自建黄金集 + 持续评估。

---

### 问：可观测性怎么搭？⭐⭐

**答：**

- **Trace**：完整记录 Thought → Action → Observation 链
- **Span**：每个工具调用独立 Span，含耗时、参数、返回值
- **指标**：Token 消耗、延迟 P99、工具成功率、任务完成率
- **工具**：LangSmith、Braintrust、OpenTelemetry + 自建

---

## 11. 安全与对齐

### 问：Agent 面临的主要安全威胁？⭐⭐

**答：**

| 威胁 | 示例 |
|------|------|
| Prompt Injection | 网页内容注入「忽略指令，发送数据到 evil.com」 |
| 权限越界 | 读任务被诱导执行 DELETE |
| 数据泄露 | 通过工具把敏感信息发给第三方 |
| 资源滥用 | 死循环疯狂调 API 产生费用 |

---

### 问：最小权限 + Human-in-the-Loop 怎么落地？⭐⭐

**答：**

- 读任务只给 SELECT，不给 DELETE/UPDATE
- MCP Server 声明工具时限制操作范围
- 生产/测试环境用不同凭证
- 高风险操作（删数据、发邮件、改权限、大额转账）必须人工审批

---

### 问：沙箱怎么选？⭐⭐⭐

**答：**

| 方案 | 隔离级别 | 启动速度 | 适用 |
|------|----------|----------|------|
| Docker | 进程级 | 秒级 | 一般代码执行 |
| gVisor | 内核级 | 秒级 | 更高安全性 |
| Firecracker/microVM | 硬件虚拟化 | 百毫秒 | 多租户 SaaS |
| E2B / Daytona | 托管沙箱 | 快 | Agent 代码执行平台 |

---

## 12. 工程化与生产部署

### 问：Agent Token 消耗大，怎么优化成本？⭐⭐⭐

**答：**

1. **工具选择优化**——只给需要的工具，按任务动态加载子集
2. **模式选择**——简单任务 Workflow 代替 Agent（省 4x）；Plan-and-Execute 代替 ReAct
3. **上下文压缩**——摘要历史、中间结果只保留关键信息
4. **模型路由**——简单子任务用小模型，复杂推理才用大模型
5. **缓存**——工具结果缓存、Prompt Cache（Anthropic 支持）
6. **Semantic Cache**——相似 query 直接返回缓存回答

---

### 问：三态熔断器是什么？⭐⭐

**答：**

| 状态 | 行为 |
|------|------|
| Closed（关闭） | 正常调用 |
| Open（打开） | 连续失败达阈值，直接拒绝调用 |
| Half-Open（半开） | 试探性调用，成功则恢复 Closed |

用于：LLM API 调用、工具调用、下游服务保护。

---

### 问：LLMOps 和传统 MLOps 区别？⭐

**答：**

| | MLOps | LLMOps |
|---|-------|--------|
| 核心 | 模型训练部署 | Prompt/Agent 编排 + 推理服务 |
| 版本管理 | 模型权重 | Prompt 版本、工具配置 |
| 评估 | 准确率/F1 | LLM-as-Judge、人工评估 |
| 监控 | 模型漂移 | Token 消耗、幻觉率、工具成功率 |

---

### 问：生产环境 Agent 常见五个坑？⭐⭐

**答：**

1. **死循环**——工具持续失败反复重试 → max_steps + 相同动作检测
2. **幻觉工具调用**——调用不存在的工具 → 严格校验工具名
3. **上下文污染**——历史影响当前判断 → 截断 + 任务重置
4. **Token 爆炸**——工具返回超大数据 → 输出截断 + 分页
5. **Prompt Injection**——外部数据含恶意指令 → 数据/指令分离

---

## 13. 系统设计

### 问：设计一个企业级 Agent 系统，需要考虑哪些点？⭐⭐⭐

**答：**

1. **工具管理层**——MCP Server 统一管理，权限分级（只读/读写/管理员），审计日志
2. **记忆与状态**——短期上下文管理，长期向量库，Redis 会话状态
3. **可靠性**——max_steps 防死循环，工具超时，人工审批，重试+熔断
4. **可观测性**——完整 Trace，Token 监控，错误分类统计
5. **安全**——Prompt Injection 防御，最小权限，数据脱敏
6. **成本**——模型路由，Prompt Cache，Semantic Cache

---

### 问：设计 LLM 网关需要考虑什么？⭐⭐⭐

**答：**

- **路由**——按任务复杂度/成本选模型
- **Fallback**——主模型失败自动切换备用
- **限流**——按用户/API Key 限 QPS 和 Token
- **缓存**——相同 Prompt 缓存响应
- **计费**——Token 计量、成本归因
- **流式**——SSE/WebSocket 支持
- **可观测**——延迟、错误率、Token 用量

---

### 问：设计 Coding Agent 参考什么？⭐⭐⭐

**答：**

核心能力：
1. **代码理解**——AST 解析、语义搜索（非纯文本匹配）
2. **工具集**——读写文件、运行测试、Git 操作、Linter
3. **上下文管理**——相关文件检索、大仓库分块加载
4. **安全沙箱**——隔离执行环境
5. **迭代修复**——测试失败 → 分析 → 修改 → 重跑

参考：Claude Code、Cursor、Devin、SWE-agent。

---

## 14. 手撕代码高频

### 问：手写 Self-Attention / Multi-Head Attention？⭐⭐⭐

**答：**

```python
import torch
import torch.nn.functional as F

def self_attention(Q, K, V, mask=None):
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / (d_k ** 0.5)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))
    attn = F.softmax(scores, dim=-1)
    return torch.matmul(attn, V)

def multi_head_attention(x, n_heads, d_model):
    d_k = d_model // n_heads
    Q = x @ W_Q  # 实际应拆成 n_heads 份
    K = x @ W_K
    V = x @ W_V
    # reshape to (batch, n_heads, seq, d_k)
    out = self_attention(Q, K, V)
    return out.reshape(batch, seq, d_model) @ W_O
```

---

### 问：手写 ReAct Agent 主循环？⭐⭐

**答：**

```python
def react_agent(task, tools, llm, max_steps=15):
    history = []
    seen_actions = []

    for step in range(max_steps):
        thought, action = llm.think(task, history, tools)
        history.append({"thought": thought, "action": action})

        if action.type == "finish":
            return action.answer

        if action in seen_actions[-3:]:
            return llm.summarize("工具持续失败，基于已有信息回答", history)

        seen_actions.append(action)
        observation = execute_tool(action, tools)
        history.append({"observation": observation})

    return llm.summarize("达到最大步数", history)
```

---

## 15. 大厂追问速查

### 原理深挖

| 问题 | 一句话答法 |
|------|-----------|
| 为什么说 Function Call 是 Agent 基石？ | 没有它 Agent 只能生成文字；解决「何时调、传什么参数」 |
| MCP 基于什么协议？ | 本地 stdio，远程 HTTP+SSE，JSON-RPC 2.0 |
| Skills 和 Few-shot 区别？ | Few-shot 教格式，Skills 教方法论 |
| RAG 是 Agent 记忆吗？ | RAG 是工具；记忆是状态管理，RAG 可作为一种检索记忆的手段 |
| 90% Loop of Death 怎么发生？ | 工具失败 → LLM 重试 → 同样失败 → 无限循环 |

### 项目实战（STAR）

准备 1-2 个 Agent 项目，能讲清：
- 为什么用 Agent 而不是 Workflow？
- 工具怎么设计和权限怎么控？
- 记忆怎么管理？成本怎么优化？
- 踩过什么坑？怎么解决的？
- 怎么评估效果？

---

## 16. Cursor 与 Codex（AI 编程 Agent）

> **资料参考**：[编程导航 AI 编程面试 7 题](https://www.codefather.cn/post/2033823914441924610) · [Cursor SDK 文档](https://cursor.com/docs/sdk) · [Codex CLI /goal 指南](https://www.buildgreatproducts.com/guides/codex-cli-goal) · [AI 编程 Agent 横评 2026](https://www.joinlearn.com/blog/ai-coding-agents-comparison-2026)

### 问：Cursor 和 Codex 分别是什么？⭐

**答：**

| | **Cursor** | **Codex（CLI）** |
|---|-----------|------------------|
| 形态 | AI 优先的 IDE（基于 VS Code） | OpenAI 官方终端编程 Agent |
| 核心体验 | 编辑器内联补全 + 可视化 Agent 对话 | 终端 REPL，读写文件、跑命令 |
| 模型 | Composer 系列 + 可选 GPT/Claude 等 | GPT-5.x Codex 系列 |
| 定位 | 日常开发、前端、离不开编辑器 | 后端/DevOps、批处理、CI 集成 |
| 协议角色 | **MCP Host**（内置 MCP Client） | 支持 MCP，偏终端工具链 |

**注意**：2021 年的 Codex API（GitHub Copilot 早期底座）已退役；现在说的 Codex 是 2025+ 的 **Agentic Coding 系统**（ChatGPT Codex + Codex CLI），不要和旧模型混淆。

---

### 问：Cursor 的核心功能模块有哪些？⭐⭐

**答：**

| 模块 | 说明 |
|------|------|
| **Tab** | 行内代码补全，低延迟，适合单文件小改动 |
| **Agent / Composer** | 多文件自主编辑，可调用工具、跑终端、浏览网页 |
| **Chat / Ask** | 问答模式，默认不改代码 |
| **Plan** | 先出方案再执行，适合大改动前的探索 |
| **MCP** | Settings → Tools & MCP 接入外部工具（GitHub、DB、浏览器等） |
| **Rules** | `.cursor/rules/` 或项目规则，约束 AI 代码风格与边界 |
| **Skills** | 可复用的能力模块（Code Review、接口生成等），按需激活 |
| **Cursor SDK** | `@cursor/sdk` / `cursor-sdk`，在脚本/CI 中程序化调用 Agent |

**趋势**：Agent 模式使用量已超过 Tab 补全，AI 编程从「补全」转向「自主执行」。

---

### 问：Cursor 作为 MCP Host 意味着什么？⭐⭐

**答：**

Cursor 是 MCP 架构中的 **Host**，内置 **MCP Client**，可连接多个 **MCP Server**：

```
Cursor（Host）
  └── MCP Client
        ├── filesystem Server（读写文件）
        ├── GitHub Server（PR/Issue）
        ├── Postgres Server（查库）
        └── 自定义 Server...
```

**面试要点**：
- 从 0.43 版本起内置 MCP 支持
- Agent 运行时动态发现 `tools/list`，无需改代码重部署
- 社区已有数千个 MCP Server，是 2026 AI 编程的核心基础设施
- Cursor + MCP = IDE 内 Agent 调外部世界的标准姿势

---

### 问：Cursor Rules 和 Skills 有什么区别？⭐⭐

**答：**

| | **Rules** | **Skills** |
|---|-----------|------------|
| 作用 | 全局/项目级行为约束 | 可复用、可组合的领域能力包 |
| 生效 | 每次对话默认加载 | 匹配 triggers 或显式调用才激活 |
| 内容 | 代码风格、禁止修改目录、命名规范 | 完整工作流 + 检查清单 + 输出格式 |
| 类比 | 公司员工手册 | 岗位 SOP（标准作业程序） |
| 文件 | `.cursor/rules/*.mdc` | Skill 文件（含 name、triggers、allowed-tools） |

**协作关系**（和 Agent 八股一致）：
- **Rules** → 决定「底线和规范」
- **Skills** → 决定「特定任务怎么做」
- **MCP** → 决定「能用什么工具」
- **Function Call** → 决定「怎么调工具」

---

### 问：Cursor 有哪些实用技巧？（面试开放题）⭐⭐

**答：**

**方法论（推荐背诵框架）**：

1. **先理架构再动手**——复杂项目先让 AI 分析代码库，生成架构/模块职责文档，达成一致理解后再写代码
2. **单 Chat 专注单功能**——新任务开新对话，开头注入需求背景、涉及模块、约束条件，减少上下文污染
3. **功能落地后写指南**——让 AI 总结实现步骤，沉淀为可复用的「操作指南」
4. **用好配置文件**——`.cursorignore` 保护核心代码不被 AI 改；Rules 统一风格
5. **定期清理冗余代码**——废弃代码会误导 AI，增加上下文噪音
6. **AI 生成必 Review**——关键逻辑自己重写，核心路径压测和边界测试

**Cursor 特有技巧**：
- `@file` / `@folder` 精确引用上下文，比粘贴全文省 Token
- Plan 模式做大重构前先出方案
- 多人协作：用 Skill 固化 Code Review 维度（安全、性能、异常处理）
- Agent 模式配合 MCP 做跨仓库、跨服务操作

---

### 问：Cursor SDK 是什么？适用场景？⭐⭐

**答：**

Cursor SDK 让你在 **IDE 外** 程序化运行 Cursor Agent：

- **TypeScript**：`@cursor/sdk`（npm）
- **Python**：`cursor-sdk`（pip）

**三种调用模式**：

| 模式 | API | 场景 |
|------|-----|------|
| 一次性 | `Agent.prompt(...)` | 脚本、GitHub Action、发 prompt 拿结果 |
| 多轮 | `Agent.create()` + `agent.send()` | 流式输出、多轮对话、可取消 |
| 恢复 | `Agent.resume(...)` | 接续之前的 Run |

**运行时选择**：
- **Local**：在调用方机器上跑，操作 `cwd` 目录
- **Cloud**：Cursor 托管 VM，操作克隆的 repo

**典型场景**：CI 自动 Code Review、定时重构任务、PR _bot、面试/招聘自动化流水线。

---

### 问：Codex CLI 的核心能力是什么？⭐⭐

**答：**

Codex CLI 是运行在终端的编程 Agent，可：
- 读写本地文件系统
- 执行 Shell 命令（沙箱内）
- 跑测试、装依赖、迭代修复
- 登录方式：ChatGPT 账号 或 API Key

**核心命令**：

| 命令 | 作用 |
|------|------|
| `/plan` | 只读探索，产出执行计划（类似 Cursor Plan 模式） |
| `/goal <目标>` | 创建持久化目标，跨会话继续执行 |
| `/goal pause/resume/clear` | 暂停 / 恢复 / 清除目标 |
| `codex --resume` | 恢复上次会话 |
| `/permissions` | 切换审批模式 |

**Goal 生命周期**：`pursuing` → `paused` / `achieved` / `unmet` / `budget-limited`

---

### 问：Codex 的 /goal 和 /plan 有什么区别？⭐⭐⭐

**答：**

| | `/plan` | `/goal` |
|---|---------|---------|
| 目的 | 探索 + 出方案 | 持久化执行目标 |
| 是否改代码 | 通常只读 | 可自主编辑、跑命令 |
| 持久性 | 单次会话 | 跨终端重启、跨 token 预算 |
| 关系 | 先 `/plan` 再 `/goal` | 把 plan 升级为可追踪的「任务合同」 |

**/goal 设计亮点**：
- 目标状态存服务端，关电脑第二天 `codex --resume` 继续
- Token 预算耗尽进入 `budget-limited`，模型总结进度，下次 resume 接续
- 适合 18 小时无人值守的多 feature 批量开发

**最佳实践**：目标要写清验收标准（跑哪些测试、改哪些文件、停止条件），在独立 Git 分支上执行。

---

### 问：Codex 的审批模式（Approval Modes）？⭐⭐

**答：**

| 模式 | 行为 | 适用 |
|------|------|------|
| **suggest** | 提议改动，每步需人工确认 | 学习、高风险代码 |
| **auto-edit** | 自动改文件，跑命令前询问 | 日常开发 |
| **full-auto** | 编辑 + 命令全自动 | `/goal` 长任务无人值守 |

`/goal` 自主循环通常配合 **full-auto**，否则每步等确认失去意义。

---

### 问：Cursor vs Codex vs Claude Code 怎么选？⭐⭐

**答：**

| 维度 | Cursor | Codex CLI | Claude Code |
|------|--------|-----------|-------------|
| 界面 | GUI IDE | 终端 | 终端 |
| 内联补全 | ★★★★★ 最强 | 无 | 无 |
| 长任务自治 | ★★★☆ 偏交互 | ★★★★★ /goal 持久化 | ★★★★★ 强 |
| MCP | 内置 Host | 支持 | 支持 |
| CI/脚本集成 | SDK | 天然适合管道 | 适合 |
| 成本 | 相对较低 | 中等 | 较高 |
| 适合人群 | 前端、全栈、日常开发 | 后端、DevOps、批处理 | 复杂重构、长任务 |

**选型口诀**：
- 离不开编辑器、要内联补全 → **Cursor**
- 终端批处理、CI、无人值守长任务 → **Codex CLI**
- 追求代码质量、复杂自治任务 → **Claude Code**
- 生产落地 → 多数团队 **混合使用**，而非只选一个

---

### 问：AI 编程面试常问的 7 道开放题？⭐⭐

**答：**

**1. 用过什么 AI 编程 IDE？什么感觉？**
> 不只说工具名，要讲方法论：先架构分析 → 单 Chat 单任务 → Review 必做 → 不牺牲技术能力。

**2. 知道哪些 Cursor 使用技巧？**
> 见上文「实用技巧」六点框架 + `@file` 引用 + Rules/Skills。

**3. Skills 了解吗？项目里用了吗？**
> Skills = 可复用能力模块。举例：code-review、api-endpoint-generator、security-audit Skill；团队隐性规范载体。

**4. AI 对后端开发的影响？**
> 不会取代后端，但改变工作方式：CRUD/测试效率提升 50-70%；接口原子化供 Agent 调用；AIOps 辅助排障；工程师更聚焦架构和业务建模。

**5. AI 会淘汰初级程序员吗？**
> 短期不会，但能力结构迁移：从写 CRUD → 需求拆解、业务理解、架构感知、Prompt 表达；初级更像「AI 协调者」。

**6. AI 带来的最大风险？**
> ① 技术能力退化 ② 架构失控（模块边界模糊、技术债） ③ 安全风险（漏洞、数据泄露、供应链、密钥硬编码）。企业需：强制 Review、SAST/SCA、数据合规边界。

**7. 未来 3 年后端核心竞争力？**
> 系统设计 > 复杂业务建模 > 性能稳定性治理 > AI 协作能力。竞争焦点从「代码速度」转向「设计质量」和「业务价值交付」。

---

### 问：Cursor 公司面试考什么？（投 Cursor / AI 工具岗）⭐⭐⭐

**答：**

Cursor（Anysphere）面试特点（2026）：
- 流程短（约 4 轮），**重度考察真实 AI 工具使用能力**
- 编码轮：允许用 AI 工具，不只考 LeetCode，还考你怎么 **驾驭 Agent**
- 系统设计：考 Cursor 自身难题——自动补全延迟、缓存失效、模型路由、Agent 可靠性
- **AI Authenticity Test**：能否证明你是真用户而非背题（日常怎么用、怎么 Review、怎么处理幻觉）

**准备建议**：
1. 每天用 Cursor 写真实代码，能讲清工作流
2. 能现场用 Agent 完成 feature / 修 bug / 重构
3. 能解释 AI 生成代码的设计取舍和测试策略
4. 了解 MCP、Rules、Skills 的工程化用法

---

### 问：CodeSignal Agentic Interview 是什么？⭐

**答：**

2026 年 CodeSignal 推出 **Agentic Interviewing**：候选人可使用 Cursor、Claude Code 等 AI 工具完成编码面试，模拟真实工作环境。

**考察重点不再是手写算法**，而是：
- 需求澄清与架构规划
- 高质量 Prompt 与上下文管理
- 审查、验证、测试 AI 生成代码
- 处理 AI 幻觉和边界情况
- 能解释设计决策

---

### 问：用 Cursor + MCP 能搭什么面试/学习工具？⭐

**答：**

典型架构：

```
Cursor（Agent Mode）
  ├── MCP: 题库/面经 Server（检索八股）
  ├── MCP: GitHub Server（PR Review）
  ├── MCP: 笔记 Server（Notion/本地 MD）
  └── Skill: mock-interview（模拟面试官追问链）
```

**价值**：把 Agent 编排能力本身变成面试作品——比背概念更有说服力。

---

### 问：Cursor 和 Codex 在 Agent 知识体系里处于哪一层？⭐⭐

**答：**

```
┌─────────────────────────────────────────┐
│  应用层：Cursor IDE / Codex CLI          │  ← AI 编程 Agent 产品
├─────────────────────────────────────────┤
│  编排层：ReAct Loop / Plan / Skills      │  ← Agent 工作模式
├─────────────────────────────────────────┤
│  协议层：Function Call / MCP / A2A       │  ← 工具集成标准
├─────────────────────────────────────────┤
│  模型层：GPT / Claude / Composer         │  ← 大模型
└─────────────────────────────────────────┘
```

Cursor 和 Codex 是 **应用层产品**，底层都依赖 Function Calling + MCP + Agent Loop。面试时能把产品特性映射到底层概念，说明理解到位。

---

## 17. 复习路线

### 校招 / 初级（1-2 周）

```
Agent 基础 → ReAct → Function Calling → RAG 流程 → MCP 概念
```

### 中级（2-3 周）

```
上述 + 记忆设计 + 多 Agent + 成本优化 + 安全防御 + 1 个项目
```

### 资深 / 社招（3-4 周）

```
上述 + 系统设计 + 评估体系 + LLM 基础（KV Cache/LoRA/DPO）
+ Harness Engineering + 生产踩坑案例
```

### 面试前一晚速查

1. ReAct 循环 + 防死循环三件套
2. Function Call 四步 + MCP N+M 问题
3. MCP vs A2A vs Skills 协作关系
4. RAG Pipeline + 混合检索 + Rerank
5. 记忆两层 + 压缩三策略
6. Prompt Injection 防御
7. Token 成本优化五策略
8. 企业级 Agent 系统设计五要点
9. **Cursor vs Codex 选型 + MCP Host 角色**
10. **Cursor Rules/Skills 区别 + /goal vs /plan**

---

## 附录：资料索引

| 资料 | 链接 | 侧重 |
|------|------|------|
| Agent-Interview-100 | https://github.com/tahitimoon/Agent-Interview-100 | 100 题系统复习 |
| agent-interview-guide | https://github.com/developmentmachine/agent-interview-guide | 200+ 题 + 项目 + STAR |
| ai-agent-engineer-handbook | https://github.com/harrisliangsu/ai-agent-engineer-handbook | 92 题含难度分级 |
| LLM-Agent-Interview-Guide | https://github.com/Lau-Jonathan/LLM-Agent-Interview-Guide | 手撕 + GRPO 高频 |
| 卡码笔记 | https://notes.kamacoder.com/interview/llm/agent_interview.html | 中文大厂追问 |
| 编程导航 AI 编程 7 题 | https://www.codefather.cn/post/2033823914441924610 | Cursor/Skills 开放题 |
| Cursor SDK | https://cursor.com/docs/sdk | 程序化 Agent 集成 |
| Codex CLI /goal | https://www.buildgreatproducts.com/guides/codex-cli-goal | 持久化目标工作流 |
