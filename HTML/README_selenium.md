# 京东低价监控工具 - Selenium版

## 安装步骤

### 1. 安装Python依赖
```bash
pip install selenium
```

### 2. 下载ChromeDriver

**方法一：自动安装（推荐）**
```bash
pip install webdriver-manager
```
然后修改代码，使用webdriver-manager自动管理驱动。

**方法二：手动下载**
1. 查看Chrome浏览器版本：地址栏输入 `chrome://version`
2. 下载对应版本的ChromeDriver：https://chromedriver.chromium.org/
3. 将chromedriver.exe放到Python安装目录或项目目录

### 3. 运行程序
```bash
python jd_monitor_selenium.py
```

## 功能说明

### 批量检查
一次性检查多个商品价格，找出低价商品

### 持续监控
定时检查价格变化，发现异常低价时报警

### 搜索低价
按关键词搜索低价商品

## 获取SKU方法

1. 打开京东商品页面
2. URL中的数字就是SKU
3. 例如：`https://item.jd.com/100012043978.html`
4. SKU是：`100012043978`

## 低价判断条件

1. 价格 ≤ 0
2. 低于原价30%
3. 原价>50元，现价<1元（疑似单位错误）

## 注意事项

1. 首次运行会打开Chrome浏览器窗口
2. 可能需要手动登录京东（如果需要登录）
3. 不要关闭程序打开的浏览器窗口
4. 请求间隔建议3-5秒，避免被封

## 常见问题

**Q: 提示找不到chromedriver**
A: 下载ChromeDriver并放到正确位置，或使用webdriver-manager

**Q: 获取不到价格**
A: 可能是页面结构变化，需要更新选择器

**Q: 被检测为机器人**
A: 增加随机等待时间，或使用代理IP