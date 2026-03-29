"""
京东低价监控爬虫 - 完整版
安装依赖: pip install requests
运行: python jd_monitor.py
"""

import requests
import time
import json
import re
from datetime import datetime

class JDPriceMonitor:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.jd.com/',
        }
        self.price_history = {}
    
    def get_price(self, sku_id):
        """获取商品价格 - 备用方案"""
        
        # 方法1: 使用p.3.cn API
        url1 = f'https://p.3.cn/prices/mgets?skuIds=J_{sku_id}'
        
        # 方法2: 使用item.jd.com页面解析
        url2 = f'https://item.jd.com/{sku_id}.html'
        
        try:
            # 尝试方法1
            resp = requests.get(url1, headers=self.headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    item = data[0]
                    return {
                        'sku': sku_id,
                        'price': float(item.get('p', 0)),
                        'op': float(item.get('op', 0)),
                        'm': float(item.get('m', 0) or 0),
                        'time': datetime.now().strftime('%H:%M:%S')
                    }
        except:
            pass
        
        try:
            # 尝试方法2: 从页面提取价格
            resp = requests.get(url2, headers=self.headers, timeout=15)
            if resp.status_code == 200:
                # 尝试从HTML提取价格
                price_match = re.search(r'"p":"([\d.]+)"', resp.text)
                op_match = re.search(r'"op":"([\d.]+)"', resp.text)
                
                if price_match:
                    return {
                        'sku': sku_id,
                        'price': float(price_match.group(1)),
                        'op': float(op_match.group(1)) if op_match else 0,
                        'm': 0,
                        'time': datetime.now().strftime('%H:%M:%S')
                    }
        except Exception as e:
            print(f"获取价格失败: {e}")
        
        return None
    
    def get_title(self, sku_id):
        """获取商品标题"""
        url = f'https://item.jd.com/{sku_id}.html'
        try:
            resp = requests.get(url, headers=self.headers, timeout=5)
            match = re.search(r'<title>(.*?)</title>', resp.text)
            if match:
                return match.group(1).split('-')[0].strip()
        except:
            pass
        return f'商品{sku_id}'
    
    def is_low_price(self, sku_id, price, op):
        """判断是否是异常低价"""
        # 条件1: 价格为0或负数
        if price <= 0:
            return True, "价格为0或负数"
        
        # 条件2: 低于原价30%
        if op > 0 and price < op * 0.3:
            return True, f"低于原价30% (原价:{op} 现价:{price})"
        
        # 条件3: 元变分 (原价>50 现价<1)
        if op > 50 and price < 1:
            return True, f"疑似单位错误"
        
        # 条件4: 和历史价格对比
        history = self.price_history.get(sku_id, [])
        if len(history) >= 3:
            avg = sum(h['price'] for h in history[-5:]) / min(len(history), 5)
            if price < avg * 0.3:
                return True, f"价格暴跌 (均价:{avg:.2f} 现价:{price})"
        
        return False, "正常"
    
    def monitor(self, sku_list, interval=30):
        """持续监控"""
        print(f"🔍 开始监控 {len(sku_list)} 个商品")
        print(f"⏱️  检查间隔: {interval}秒")
        print("=" * 60)
        
        while True:
            for sku in sku_list:
                info = self.get_price(sku)
                
                if not info:
                    continue
                
                # 记录历史
                self.price_history.setdefault(sku, []).append(info)
                
                # 检测低价
                is_low, reason = self.is_low_price(sku, info['price'], info['op'])
                
                if is_low:
                    title = self.get_title(sku)
                    print(f"""
[!!] 低价警报 [!!]
商品: {title}
SKU: {sku}
价格: {info['price']}元
原价: {info['op']}元
原因: {reason}
链接: https://item.jd.com/{sku}.html
时间: {info['time']}
{'=' * 60}""")
                    # TODO: 这里可以加推送通知
                else:
                    print(f"[{info['time']}] {sku}: ¥{info['price']} ✓")
                
                time.sleep(1)
            
            print(f"--- 等待 {interval}秒 ---")
            time.sleep(interval)
    
    def check_batch(self, sku_list):
        """批量检查"""
        print(f"批量检查 {len(sku_list)} 个商品")
        print("=" * 60)
        
        results = []
        low_items = []
        
        for sku in sku_list:
            info = self.get_price(sku)
            if info:
                title = self.get_title(sku)
                info['title'] = title
                results.append(info)
                
                is_low, reason = self.is_low_price(sku, info['price'], info['op'])
                if is_low:
                    low_items.append({**info, 'reason': reason})
                    print(f"[!!] {title[:25]}... {info['price']}元 (原价{info['op']}元)")
                else:
                    print(f"[OK] {title[:25]}... {info['price']}元")
            
            time.sleep(0.3)
        
        print(f"\n发现 {len(low_items)} 个疑似低价商品")
        return results, low_items
    
    def search_category(self, cid, min_price=0, max_price=10):
        """按分类搜索低价商品"""
        # 京东分类API (需要根据实际情况调整)
        url = f'https://search.jd.com/Search'
        params = {
            'cid3': cid,
            'enc': 'utf-8',
        }
        
        print(f"搜索分类 {cid} 价格区间 ¥{min_price}-{max_price}")
        # 注意: 实际搜索需要更复杂的处理
        
        return []


# ==================== 主程序 ====================
if __name__ == "__main__":
    monitor = JDPriceMonitor()
    
    # 测试2个商品
    DEMO_SKUS = [
        '100012043978',
        '100038005449', 
    ]
    
    print("=" * 50)
    print("京东低价监控工具 v1.0")
    print("=" * 50)
    print("\n正在检查商品价格...\n")
    
    # 逐个检查
    for sku in DEMO_SKUS:
        info = monitor.get_price(sku)
        if info:
            title = monitor.get_title(sku)
            print(f"商品: {title}")
            print(f"SKU: {sku}")
            print(f"价格: {info['price']}元")
            print(f"原价: {info['op']}元")
            print("-" * 30)
        else:
            print(f"SKU {sku} 获取价格失败")
        time.sleep(2)
    
    print("\n检查完成!")