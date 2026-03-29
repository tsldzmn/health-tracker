"""
京东低价监控工具 - 页面解析版
从商品页面直接解析价格，不依赖价格API
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
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        self.session.headers.update(self.headers)
    
    def get_price(self, sku_id):
        """从商品页面获取价格"""
        url = f'https://item.jd.com/{sku_id}.html'
        
        try:
            print(f'  正在访问商品页面...')
            resp = self.session.get(url, timeout=15)
            
            if resp.status_code != 200:
                return None
            
            html = resp.text
            
            # 获取商品名称
            name = f'商品{sku_id}'
            name_match = re.search(r'<title>(.*?)</title>', html)
            if name_match:
                name = name_match.group(1).split('-')[0].strip()[:50]
            
            # 获取价格 - 多种方式尝试
            price = 0
            op_price = 0
            
            # 方式1: 从JSON数据提取
            price_match = re.search(r'"p":"([\d.]+)"', html)
            if price_match:
                price = float(price_match.group(1))
            
            op_match = re.search(r'"op":"([\d.]+)"', html)
            if op_match:
                op_price = float(op_match.group(1))
            
            # 方式2: 从页面元素提取
            if price == 0:
                price_match = re.search(r'class="price"[^>]*>￥?([\d.]+)', html)
                if price_match:
                    price = float(price_match.group(1))
            
            # 方式3: 尝试找其他价格格式
            if price == 0:
                price_match = re.search(r'"price":([\d.]+)', html)
                if price_match:
                    price = float(price_match.group(1))
            
            if price > 0:
                return {
                    'sku': sku_id,
                    'name': name,
                    'price': price,
                    'op': op_price if op_price > 0 else price,
                    'url': url,
                    'time': datetime.now().strftime('%H:%M:%S')
                }
            else:
                print(f'  未能提取到价格')
                return None
                
        except Exception as e:
            print(f'  获取失败: {e}')
            return None
    
    def is_low(self, price, op):
        """判断是否异常低价"""
        if price <= 0:
            return True, "价格为0或负数"
        if op > 0 and price < op * 0.3:
            return True, f"低于原价30%"
        if op > 50 and price < 1:
            return True, "疑似单位错误"
        return False, "正常"
    
    def check(self, sku_list):
        """批量检查"""
        print(f'\n开始检查 {len(sku_list)} 个商品...')
        print('=' * 60)
        
        results = []
        low_items = []
        
        for sku in sku_list:
            print(f'\n[{sku}]')
            info = self.get_price(sku)
            
            if info:
                results.append(info)
                is_low, reason = self.is_low(info['price'], info['op'])
                
                if is_low:
                    low_items.append({**info, 'reason': reason})
                    print(f'\n[!!] 发现低价!')
                    print(f'  商品: {info["name"]}')
                    print(f'  价格: {info["price"]}元 (原价{info["op"]}元)')
                    print(f'  原因: {reason}')
                    print(f'  链接: {info["url"]}')
                else:
                    print(f'  [OK] 价格: {info["price"]}元')
            
            time.sleep(2)
        
        return results, low_items


# 主程序
if __name__ == '__main__':
    # 测试SKU
    SKUS = [
        '100012043978',
        '100038005449',
    ]
    
    print('=' * 50)
    print('京东低价监控工具 - 页面解析版')
    print('=' * 50)
    
    monitor = JDMonitor()
    results, low_items = monitor.check(SKUS)
    
    print('\n' + '=' * 50)
    print(f'检查完成!')
    print(f'  商品总数: {len(results)}')
    print(f'  低价商品: {len(low_items)}')
    
    if low_items:
        print('\n低价商品:')
        for item in low_items:
            print(f'  - {item["name"]}')
            print(f'    价格: {item["price"]}元')
            print(f'    链接: {item["url"]}')
    
    print('\n程序结束')