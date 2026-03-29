"""
京东低价监控工具 - Edge版（Windows自带）
安装依赖: pip install selenium webdriver-manager
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.service import Service
from webdriver_manager.microsoft import EdgeChromiumDriverManager
import time
import re
from datetime import datetime

class JDPriceMonitor:
    def __init__(self, headless=False):
        self.options = Options()
        self.options.add_argument('--disable-gpu')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('--window-size=1920,1080')
        self.options.add_argument('--disable-blink-features=AutomationControlled')
        self.options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        if headless:
            self.options.add_argument('--headless')
        
        self.driver = None
    
    def start(self):
        """启动Edge浏览器"""
        print("正在启动Edge浏览器...")
        try:
            service = Service(EdgeChromiumDriverManager().install())
            self.driver = webdriver.Edge(service=service, options=self.options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            print("浏览器启动成功!")
            return True
        except Exception as e:
            print(f"启动失败: {e}")
            return False
    
    def close(self):
        if self.driver:
            self.driver.quit()
            print("浏览器已关闭")
    
    def get_price(self, sku_id):
        """获取商品价格"""
        url = f'https://item.jd.com/{sku_id}.html'
        
        try:
            print(f"正在访问: {url}")
            self.driver.get(url)
            time.sleep(4)
            
            # 获取名称
            try:
                name = self.driver.find_element(By.CSS_SELECTOR, '.sku-name').text.strip()[:50]
            except:
                name = f"商品{sku_id}"
            
            # 获取价格
            price = 0
            op_price = 0
            
            # 方式1: 直接查找价格元素
            try:
                price_text = self.driver.find_element(By.CSS_SELECTOR, '.p-price .price').text
                price = float(price_text.replace('￥', '').replace('¥', '').strip())
            except:
                pass
            
            # 方式2: 从页面源码提取
            if price == 0:
                try:
                    page_source = self.driver.page_source
                    match = re.search(r'"p":"([\d.]+)"', page_source)
                    if match:
                        price = float(match.group(1))
                    match = re.search(r'"op":"([\d.]+)"', page_source)
                    if match:
                        op_price = float(match.group(1))
                except:
                    pass
            
            # 获取原价
            try:
                op_text = self.driver.find_element(By.CSS_SELECTOR, '.p-price .del').text
                op_price = float(op_text.replace('￥', '').replace('¥', '').strip())
            except:
                if op_price == 0:
                    op_price = price
            
            return {
                'sku': sku_id,
                'name': name,
                'price': price,
                'op': op_price,
                'url': url,
                'time': datetime.now().strftime('%H:%M:%S')
            }
        except Exception as e:
            print(f"获取失败: {e}")
            return None
    
    def is_low(self, price, op):
        """判断是否是异常低价"""
        if price <= 0:
            return True, "价格为0"
        if op > 0 and price < op * 0.3:
            return True, f"低于原价30%"
        if op > 50 and price < 1:
            return True, "单位错误"
        return False, "正常"
    
    def check(self, sku_list):
        """批量检查"""
        print(f"\n检查 {len(sku_list)} 个商品")
        print("=" * 60)
        
        low_items = []
        all_items = []
        
        for sku in sku_list:
            info = self.get_price(sku)
            if info:
                all_items.append(info)
                is_low, reason = self.is_low(info['price'], info['op'])
                
                if is_low:
                    low_items.append({**info, 'reason': reason})
                    print(f"\n[!!] 低价警报!")
                    print(f"  商品: {info['name']}")
                    print(f"  价格: {info['price']}元 (原价{info['op']}元)")
                    print(f"  原因: {reason}")
                    print(f"  链接: {info['url']}")
                else:
                    print(f"[OK] {info['name'][:30]}: {info['price']}元")
            
            time.sleep(2)
        
        return all_items, low_items
    
    def monitor(self, sku_list, interval=30, rounds=5):
        """持续监控"""
        print(f"\n开始监控 {len(sku_list)} 个商品")
        print(f"检查间隔: {interval}秒，共{rounds}轮")
        print("=" * 60)
        
        for round_num in range(rounds):
            print(f"\n--- 第 {round_num + 1}/{rounds} 轮 [{datetime.now().strftime('%H:%M:%S')}] ---")
            
            for sku in sku_list:
                info = self.get_price(sku)
                if info:
                    is_low, reason = self.is_low(info['price'], info['op'])
                    
                    if is_low:
                        print(f"\n🚨 低价警报!")
                        print(f"  商品: {info['name']}")
                        print(f"  价格: {info['price']}元")
                        print(f"  链接: {info['url']}")
                    else:
                        print(f"[OK] {info['name'][:25]}: {info['price']}元")
                
                time.sleep(2)
            
            if round_num < rounds - 1:
                print(f"\n等待 {interval} 秒...")
                time.sleep(interval)
        
        print("\n监控结束")


# 主程序
if __name__ == "__main__":
    # 测试SKU - 可以替换成你想监控的商品
    SKUS = [
        '100012043978',
        '100038005449',
        '100041913100',
    ]
    
    print("=" * 50)
    print("京东低价监控工具 - Edge版")
    print("=" * 50)
    
    monitor = JDPriceMonitor(headless=False)
    
    if monitor.start():
        try:
            all_items, low_items = monitor.check(SKUS)
            
            print("\n" + "=" * 50)
            print("检查结果汇总:")
            print(f"  检查商品: {len(all_items)} 个")
            print(f"  发现低价: {len(low_items)} 个")
            
            if low_items:
                print("\n低价商品:")
                for item in low_items:
                    print(f"  - {item['name'][:30]}")
                    print(f"    价格: {item['price']}元")
                    print(f"    链接: {item['url']}")
            
        except Exception as e:
            print(f"错误: {e}")
        
        finally:
            input("\n按回车关闭浏览器...")
            monitor.close()
    else:
        print("无法启动浏览器，请检查Edge是否正确安装")