"""
京东低价监控工具 - 模拟测试版
用于验证代码逻辑，无需联网
"""

import time
import random
from datetime import datetime

class JDPriceMonitor:
    def __init__(self):
        self.price_history = {}
    
    def get_price_mock(self, sku_id):
        """模拟获取价格（用于测试）"""
        # 模拟价格数据
        mock_prices = {
            '100012043978': {'name': '苹果手机', 'price': 5999, 'op': 6999},
            '100038005449': {'name': '华为平板', 'price': 2999, 'op': 3499},
            '100041913100': {'name': '小米手环', 'price': 199, 'op': 249},
            '100015657494': {'name': '蓝牙耳机', 'price': 89, 'op': 199},
            '100008348535': {'name': '充电宝', 'price': 59, 'op': 99},
        }
        
        if sku_id in mock_prices:
            data = mock_prices[sku_id]
            # 随机模拟价格波动
            price = data['price'] * (0.9 + random.random() * 0.2)
            
            # 5%概率出现Bug价
            if random.random() < 0.05:
                price = random.choice([0.01, 0.1, 1.0])
                print(f"[模拟] 触发Bug价格!")
            
            return {
                'sku': sku_id,
                'name': data['name'],
                'price': round(price, 2),
                'op': data['op'],
                'time': datetime.now().strftime('%H:%M:%S')
            }
        return None
    
    def is_low_price(self, price, op):
        """判断是否是异常低价"""
        if price <= 0:
            return True, "价格为0或负数"
        if op > 0 and price < op * 0.3:
            return True, f"低于原价30% (原价:{op} 现价:{price})"
        if op > 50 and price < 1:
            return True, "疑似单位错误"
        return False, "正常"
    
    def check_batch(self, sku_list):
        """批量检查"""
        print(f"批量检查 {len(sku_list)} 个商品")
        print("=" * 60)
        
        results = []
        low_items = []
        
        for sku in sku_list:
            info = self.get_price_mock(sku)
            if info:
                results.append(info)
                
                is_low, reason = self.is_low_price(info['price'], info['op'])
                if is_low:
                    low_items.append({**info, 'reason': reason})
                    print(f"[!!] {info['name']}: {info['price']}元 (原价{info['op']}元) - {reason}")
                else:
                    print(f"[OK] {info['name']}: {info['price']}元")
            
            time.sleep(0.5)
        
        print(f"\n发现 {len(low_items)} 个疑似低价商品")
        return results, low_items
    
    def monitor(self, sku_list, interval=5, rounds=3):
        """持续监控（限制轮数）"""
        print(f"开始监控 {len(sku_list)} 个商品，共{rounds}轮")
        print("=" * 60)
        
        for round_num in range(rounds):
            print(f"\n--- 第 {round_num + 1} 轮检查 ---")
            
            for sku in sku_list:
                info = self.get_price_mock(sku)
                if info:
                    is_low, reason = self.is_low_price(info['price'], info['op'])
                    
                    if is_low:
                        print(f"\n[!!] 低价警报!")
                        print(f"  商品: {info['name']}")
                        print(f"  价格: {info['price']}元")
                        print(f"  原价: {info['op']}元")
                        print(f"  原因: {reason}")
                    else:
                        print(f"[OK] {info['name']}: {info['price']}元")
                
                time.sleep(0.3)
            
            if round_num < rounds - 1:
                print(f"\n等待 {interval} 秒...")
                time.sleep(interval)
        
        print("\n监控结束")


# ==================== 主程序 ====================
if __name__ == "__main__":
    monitor = JDPriceMonitor()
    
    DEMO_SKUS = [
        '100012043978',
        '100038005449', 
        '100041913100',
        '100015657494',
        '100008348535',
    ]
    
    print("=" * 50)
    print("京东低价监控工具 - 模拟测试版")
    print("=" * 50)
    print("\n选择模式:")
    print("1. 批量检查")
    print("2. 持续监控")
    
    # 默认选择批量检查
    print("\n自动选择: 1. 批量检查\n")
    results, low_items = monitor.check_batch(DEMO_SKUS)
    
    print("\n" + "=" * 50)
    print("检查结果:")
    print(f"  检查商品: {len(results)} 个")
    print(f"  发现低价: {len(low_items)} 个")
    
    if low_items:
        print("\n低价商品:")
        for item in low_items:
            print(f"  - {item['name']}: {item['price']}元 (原价{item['op']}元)")
    
    print("\n" + "=" * 50)
    print("测试持续监控 (3轮)...\n")
    time.sleep(2)
    monitor.monitor(DEMO_SKUS[:3], interval=3, rounds=3)
    
    print("\n程序结束")