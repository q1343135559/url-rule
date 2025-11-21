function main(config) {
    // 核心处理函数
    const processRegion = (region) => {
        // 1. 代理筛选
        const proxies = config.proxies
            .filter(proxy => 
                proxy.name.includes(region) &&
                !proxy.name.includes("免费")
            )
            .map(proxy => proxy.name);

        console.log(`[${region}] 筛选代理:`, proxies);

        // 2. 创建负载均衡组
        const groupName = `⚖️负载均衡-${region}`;
        const balanceGroup = {
            name: groupName,
            type: "load-balance",
            strategy: "consistent-hashing",
            url: "http://www.google.com/generate_204",
            interval: 300,
            proxies: proxies
        };

        // 初始化代理组
        config["proxy-groups"] = config["proxy-groups"] || [];
        
        // 3. 添加新组
        config["proxy-groups"].push(balanceGroup);

        // 4. 将新组添加到首组
        if (config["proxy-groups"][0]) {
            config["proxy-groups"][0].proxies.push(groupName);
        }
    };

    // 执行处理流程
    try {
        // 初始化代理组数组
        config["proxy-groups"] = config["proxy-groups"] || [];
        
        // 批量处理目标地区
        ["台湾", "美国","香港","日本","新加坡"].forEach(region => {
            // 当存在有效代理时才创建组
            if (config.proxies.some(p => p.name.includes(region))) {
                processRegion(region);
            }
        });

        // 清理空代理组（可选）
        config["proxy-groups"] = config["proxy-groups"].filter(group => 
            group.proxies && group.proxies.length > 0
        );
        
    } catch (e) {
        console.error("处理过程中发生错误:", e);
    }

    // 将包含"负载均衡"的代理名称排列在最前面（新增逻辑）
    if (config["proxy-groups"]?.[0]?.proxies) {
      config["proxy-groups"][0].proxies = [
        ...config["proxy-groups"][0].proxies.filter(p => p.includes("负载均衡")),
        ...config["proxy-groups"][0].proxies.filter(p => !p.includes("负载均衡"))
      ];
    }
    
    config.rules.unshift("DOMAIN-KEYWORD,openai,⚖️负载均衡-台湾");
    config.rules.unshift("DOMAIN-KEYWORD,chatgpt,⚖️负载均衡-台湾");
    // config.rules.unshift("GEOIP,CN,DIRECT");

  
    
    return config;
}