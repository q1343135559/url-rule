/*
针对抖音/抖音短剧的去广告逻辑
*/

// 1. 解析返回的 JSON 数据
let obj = JSON.parse($response.body);

// 2. 针对常见的 ByteDance 广告字段进行清理
// 抖音的广告通常存在于视频列表 aweme_list 中，或者有专门的 ad_info 字段
if (obj.aweme_list) {
    // 过滤掉所有带有广告标记的视频项
    obj.aweme_list = obj.aweme_list.filter(item => {
        return !item.is_ads && !item.ad_info && !item.label_top?.includes("广告");
    });
}

// 3. 针对你提到的 bytelink 接口，这类接口往往直接返回广告配置
// 如果这个接口是纯广告接口，可以直接清空或设置为空数组
if (obj.data) {
    // 如果 data 是数组，过滤广告；如果是对象，尝试重置
    if (Array.isArray(obj.data)) {
        obj.data = obj.data.filter(i => !i.ad_id);
    } else {
        obj.data = {};
    }
}

// 4. 清理一些通用的广告/统计属性
delete obj.ad_info;
delete obj.common_ad_data;

// 5. 将修改后的 JSON 转回字符串并提交
$done({body: JSON.stringify(obj)});