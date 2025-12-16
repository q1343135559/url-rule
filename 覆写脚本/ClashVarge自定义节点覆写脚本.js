function main(config) {
    // ================================
    // 1. 初始化与定义自定义节点
    // ================================
    config.proxies = config.proxies || [];
    config["proxy-groups"] = config["proxy-groups"] || [];
    config["rule-providers"] = config["rule-providers"] || {};
    config.rules = config.rules || [];

    const customNode = {
        "type": "vless",
        "name": "USA-pt6m9rtz",
        "server": "www.vidora.asia",
        "port": 443,
        "uuid": "b4c688f0-7b24-4020-9d72-32ba07cca20f",
        "tls": true,
        "flow": "xtls-rprx-vision",
        "client-fingerprint": "chrome",
        "skip-cert-verify": false,
        "reality-opts": {
            "public-key": "bkn9JNdzmxT0Bzhhjn_mAVDhtKxaT1reIHXKiV9dU2o",
            "short-id": "70",
            "_spider-x": "/UI8LRO0LqZANSSU"
        },
        "network": "tcp",
        "encryption": "none",
        "servername": "www.apple.com"
    };

    // 加入自定义节点
    config.proxies.push(customNode);

    // ================================
    // 2. 覆写 ChatGPT 相关分组 (模糊匹配)
    // ================================
    // 遍历所有策略组，找到名称中包含 "ChatGPT" 的组 (不区分大小写)
    config["proxy-groups"].forEach(group => {
        if (/ChatGPT/i.test(group.name)) {
            // 将该组的节点替换为自定义节点
            group.proxies = [customNode.name];
        }
    });

    // ================================
    // 3. 处理 "地区分组-台湾"
    // ================================
    const twGroupName = "地区分组-台湾";
    // 筛选台湾节点
    const twProxies = config.proxies
        .filter(p => /台湾|taiwan/i.test(p.name))
        .map(p => p.name);

    if (twProxies.length > 0) {
        // 移除旧的同名组(如果有)
        config["proxy-groups"] = config["proxy-groups"].filter(g => g.name !== twGroupName);

        // 创建分组
        config["proxy-groups"].push({
            name: twGroupName,
            type: "fallback", // 建议用 fallback 或 url-test
            url: "http://www.google.com/generate_204",
            interval: 300,
            proxies: twProxies
        });

        // 注入币安规则
        config["rule-providers"]["binance-ruleset"] = {
            type: "http",
            behavior: "classical",
            path: "./ruleset/binance-ruleset.yaml",
            url: "https://raw.githubusercontent.com/q1343135559/url-rule/refs/heads/main/binance.list",
            interval: 86400
        };

        // 插入分流规则 (置顶)
        config.rules.unshift(`RULE-SET,binance-ruleset,${twGroupName}`);
    } else {
        console.log("未找到台湾节点，跳过创建地区分组。");
    }

    // ================================
    // 4. 最终排序 (修改：不置顶 ChatGPT)
    // ================================
    const mainGroup = config["proxy-groups"][0];
    if (mainGroup && Array.isArray(mainGroup.proxies)) {
        // 定义需要强制置顶的列表 (仅自定义节点 + 台湾分组)
        const topList = [customNode.name];

        // 如果台湾分组存在，也置顶
        if (twProxies.length > 0) {
            topList.push(twGroupName);
        }

        // 筛选出剩余的节点 (移除已经在 topList 中的项，避免重复)
        // 注意：这里不再特殊处理 ChatGPT，它会保留在 otherProxies 中
        const otherProxies = mainGroup.proxies.filter(
            p => !topList.includes(p)
        );

        // 重组：[自定义节点] -> [台湾分组] -> [其他所有原节点(含ChatGPT)]
        mainGroup.proxies = [...topList, ...otherProxies];
    }

    return config;
}