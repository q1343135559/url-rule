function main(config) {
  // 定义筛选条件：名称包含“台湾”且不包含“免费”
  const ls = config.proxies
    .filter(proxy =>
        proxy.name.includes("台湾")&&
        !proxy.name.includes("免费")
    )
    .map(proxy => proxy.name);

  // 打印筛选出的代理名称
  console.log("筛选出的代理:", ls);

  // 创建新的负载均衡组
  const newGroup = {
    name: "⚖️负载均衡-散列",
    type: "load-balance",
    strategy: "consistent-hashing",
    url: "http://www.google.com/generate_204",
    interval: 300,
    proxies: ls
  };

  // 将新组添加到 `proxy-groups`
  if (!config["proxy-groups"]) {
    config["proxy-groups"] = [];
  }
  config["proxy-groups"].push(newGroup);

  // 将新组的名称添加到第一个代理组的 `proxies`
  if (config["proxy-groups"].length > 0) {
    config["proxy-groups"][0].proxies.push(newGroup.name);
  } else {
    console.warn("没有找到可用的 proxy-groups，无法添加到第一个代理组。");
  }

  // 返回修改后的 config 对象
  return config;
}
