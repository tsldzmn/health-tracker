"""
京东低价监控工具 - 简易版
不需要浏览器驱动，直接用requests访问
"""

import requests
import time
import re
from datetime import datetime

class JDMonitor:
    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Referer': 'https://www.jd.com/',
        }
        self.session.headers.update(self.headers)
    
    def get_price(self, sku_id):
        """获取商品价格 - 使用京东价格API"""
        api_url = f'https://p.3.cn/prices/mgets?skuIds=J_{sku_id}'
        
        try:
            resp = self.session.get(api_url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    item = data[0]
                    return {
                        'sku': sku_id,
                        'price': float(item.get('p', 0)),
                        'op': float(item.get('op', 0)),
                        'm': float(item.get('m', 0) or 0),
                        'time': datetime.now().strftime('%H:%M:%S'),
                        'url': f'https://item.jd.com/{sku_id}.html'
                    }
        except Exception as e:
            print(f"  API访问失败: {e}")
        
        return None
    
    def get_name(self, sku_id):
        """获取商品名称 - 简化版，不访问页面"""
        return f'商品SKU:{sku_id}'
    
    def is_low(self, price, op):
        """判断是否异常低价"""
        if price <= 0:
            return True, "价格为0或负数"
        if op > 0 and price < op * 0.3:
            return True, f"低于原价30%"
        if op > 50 and price < 1:
            return True, "疑似单位错误(元变分)"
        return False, "正常"
    
    def check(self, sku_list):
        """批量检查商品"""
        print(f"\n正在检查 {len(sku_list)} 个商品...")
        print("=" * 60)
        
        results = []
        low_items = []
        
        for sku in sku_list:
            info = self.get_price(sku)
            if info:
                info['name'] = self.get_name(sku)
                results.append(info)
                
                is_low, reason = self.is_low(info['price'], info['op'])
                
                if is_low:
                    low_items.append({**info, 'reason': reason})
                    print(f"\n[!!] 发现低价!")
                    print(f"  商品: {info['name']}")
                    print(f"  价格: {info['price']}元 (原价{info['op']}元)")
                    print(f"  原因: {reason}")
                    print(f"  链接: {info['url']}")
                else:
                    print(f"[OK] {info['name'][:30]}: {info['price']}元")
            
            time.sleep(1)
        
        return results, low_items
    
    def monitor(self, sku_list, interval=30, rounds=5):
        """持续监控"""
        print(f"\n开始监控 {len(sku_list)} 个商品")
        print(f"间隔: {interval}秒，轮数: {rounds}")
        print("=" * 60)
        
        for r in range(rounds):
            print(f"\n--- 第 {r+1}/{rounds} 轮 [{datetime.now().strftime('%H:%M:%S')}] ---")
            
            for sku in sku_list:
                info = self.get_price(sku)
                if info:
                    is_low, reason = self.is_low(info['price'], info['op'])
                    if is_low:
                        info['name'] = self.get_name(sku)
                        print(f"\n🚨 低价! {info['name']}: {info['price']}元")
                        print(f"   {info['url']}")
                    else:
                        print(f"[OK] SKU{sku}: {info['price']}元")
                time.sleep(1)
            
            if r < rounds - 1:
                print(f"\n等待{interval}秒...")
                time.sleep(interval)
        
        print("\n监控结束")


# ==================== 主程序 ====================
if __name__ == "__main__":
    # 示例SKU - 替换成你想监控的商品
    SKUS = [
        '100012043978',
        '100038005449',
        '100041913100',
    ]
    
    print("=" * 50)
    print("京东低价监控工具 - 简易版")
    print("=" * 50)
    
    monitor = JDMonitor()
    
    print("\n自动执行批量检查...\n")
    results, low_items = monitor.check(SKUS)
    
    print("\n" + "=" * 50)
    print("检查完成!")
    print(f"  商品总数: {len(results)}")
    print(f"  低价商品: {len(low_items)}")
    
    if low_items:
        print("\n低价商品列表:")
        for item in low_items:
            print(f"  - {item['name']}")
            print(f"    价格: {item['price']}元 (原价{item['op']}元)")
            print(f"    链接: {item['url']}")
    
    print("\n程序结束")