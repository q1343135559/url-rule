import yaml


def rewrite(path):
    # 打开和读取 YAML 文件
    with open(path, 'r', encoding='utf-8') as file:
        config = yaml.safe_load(file)

    # 输出读取的配置内容
    print(config)
    ls = []
    for i in config['proxies']:
        if "台湾" in i['name'] and "免费" not in i['name']:
            print(i['name'])
            ls.append(i['name'])

    new_group = {
        "name": "⚖️台湾-负载均衡",
        "type": "load-balance",
        "strategy": "consistent-hashing",
        "url": 'http://www.google.com/generate_204',
        "interval": 300,
        "proxies": ls

    }

    config['proxy-groups'].append(new_group)

    config['proxy-groups'][0]['proxies'].append(new_group['name'])
    # 保存更新后的 YAML 文件
    with open(path, 'w', encoding='utf-8') as file:
        yaml.dump(config, file, default_flow_style=False, allow_unicode=True)

    print("YAML 文件已更新并保存。")


if __name__ == '__main__':
    path = r'D:\mihomo\mihomo-party-windows-1.5.12-x64-portable\data\profiles\193dc7b219d.yaml'
    rewrite(path)
