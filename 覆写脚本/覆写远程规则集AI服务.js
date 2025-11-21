/**
 * 自动构建代理配置文件
 * 功能：
 *  - 按地区自动创建“集群测试”代理组
 *  - 创建“AI策略组”（美国/日本/台湾/新加坡）
 *  - 自动添加远程规则集和高优先级规则
 */
function main(config) {
  // -------------------- 工具函数 --------------------

  /**
   * 根据地区创建一个 url-test 测速组
   * @param {string} region 地区名称
   */
  const processRegion = (region) => {
    // 筛选出属于该地区的代理节点（排除“免费”）
    const proxies = (config.proxies || [])
      .filter(proxy =>
        proxy.name.includes(region) && !proxy.name.includes("免费")
      )
      .map(proxy => proxy.name);

    console.log(`[${region}] 共找到代理节点:`, proxies);

    // 若无匹配节点则跳过
    if (proxies.length === 0) return;

    // 组名示例：集群测试-美国
    const groupName = `集群测试-${region}`;

    // 创建测速策略组
    const balanceGroup = {
      name: groupName,
      type: "url-test",
      strategy: "consistent-hashing",
      url: "http://www.google.com/generate_204",
      interval: 300,
      proxies: proxies
    };

    // 初始化代理组数组
    config["proxy-groups"] = config["proxy-groups"] || [];

    // 添加新组到配置中
    config["proxy-groups"].push(balanceGroup);

    // 将该组加入到第一个选择组中
    if (config["proxy-groups"][0]?.proxies) {
      config["proxy-groups"][0].proxies.push(groupName);
    }
  };

  // -------------------- 主执行逻辑 --------------------
  try {
    config["proxy-groups"] = config["proxy-groups"] || [];

    // 需要自动生成的地区组
    const regions = ["台湾", "美国", "香港", "日本", "新加坡", "俄罗斯"];
    regions.forEach(region => {
      if ((config.proxies || []).some(p => p.name.includes(region))) {
        processRegion(region);
      }
    });

    // -------------------- 新增：AI策略组 --------------------
    const aiProxies = (config.proxies || [])
      .filter(proxy =>
        !proxy.name.includes("免费") &&
        (proxy.name.includes("美国") ||
         proxy.name.includes("日本") ||
         proxy.name.includes("台湾") ||
         proxy.name.includes("新加坡"))
      )
      .map(proxy => proxy.name);

    if (aiProxies.length > 0) {
      const aiGroup = {
        name: "AI策略组",
        type: "url-test",
        strategy: "consistent-hashing",
        url: "http://www.google.com/generate_204",
        interval: 300,
        proxies: aiProxies
      };

      config["proxy-groups"].push(aiGroup);

      // 将AI策略组也加入第一个选择组
      if (config["proxy-groups"][0]?.proxies) {
        config["proxy-groups"][0].proxies.push("AI策略组");
      }

      console.log("✅ 已创建 AI策略组:", aiProxies);
    } else {
      console.warn("⚠️ 未找到符合条件的AI策略组节点。");
    }

    // -------------------- 清理空代理组 --------------------
    config["proxy-groups"] = config["proxy-groups"].filter(
      group => group.proxies && group.proxies.length > 0
    );

  } catch (e) {
    console.error("❌ 处理过程中发生错误:", e);
  }

  // -------------------- 调整组顺序（让“集群测试”优先） --------------------
  if (config["proxy-groups"]?.[0]?.proxies) {
    const all = config["proxy-groups"][0].proxies;
    config["proxy-groups"][0].proxies = [
      ...all.filter(p => p.includes("集群测试")),
      ...all.filter(p => p === "AI策略组"),
      ...all.filter(p => !p.includes("集群测试") && p !== "AI策略组")
    ];
  }


  // -------------------- 新增远程规则集（OpenAI.list） --------------------
  config["rule-providers"] = config["rule-providers"] || {};
  config["rule-providers"]["openai-ruleset"] = {
    type: "http",
    behavior: "classical",
    format: "text",
    path: "./ruleset/OpenAI.list",
    url: "https://raw.githubusercontent.com/q1343135559/url-rule/refs/heads/main/OpenAI.list",
    interval: 86400
  };

  // -------------------- 追加高优先级规则 --------------------
  const newRules = [
    "DOMAIN-SUFFIX,kuajing84.com,DIRECT",
    "DOMAIN-SUFFIX,jayogo.com,DIRECT",
    "DOMAIN-KEYWORD,kuajing84,DIRECT",
    "RULE-SET,openai-ruleset,AI策略组" // 替换为新的 OpenAI 规则集
  ];

  config.rules = config.rules || [];
  newRules.forEach(rule => config.rules.unshift(rule));

  // -------------------- 返回最终配置 --------------------
  return config;
}
