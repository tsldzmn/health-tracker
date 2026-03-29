"""
京东低价监控工具 - 自动版
自动下载ChromeDriver，无需手动配置

安装依赖:
pip install selenium webdriver-manager

运行:
python jd_monitor_auto.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
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
        self.options.add_experimental_option('excludeSwitches', ['enable-automation'])
        self.options.add_experimental_option('useAutomationExtension', False)
        self.options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        if headless:
            self.options.add_argument('--headless')
        
        self.driver = None
    
    def start(self):
        """启动浏览器（自动下载ChromeDriver）"""
        print("正在启动浏览器...")
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=self.options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        print("浏览器启动成功!")
    
    def close(self):
        if self.driver:
            self.driver.quit()
    
    def get_price(self, sku_id):
        """获取商品价格"""
        url = f'https://item.jd.com/{sku_id}.html'
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            # 获取名称
            try:
                name = self.driver.find_element(By.CSS_SELECTOR, '.sku-name').text.strip()[:50]
            except:
                name = f"商品{sku_id}"
            
            # 获取价格
            price = 0
            op_price = 0
            
            try:
                price_text = self.driver.find_element(By.CSS_SELECTOR, '.p-price .price').text
                price = float(price_text.replace('￥', '').replace('¥', '').strip())
            except:
                pass
            
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
        print("=" * 50)
        
        low_items = []
        for sku in sku_list:
            info = self.get_price(sku)
            if info:
                is_low, reason = self.is_low(info['price'], info['op'])
                if is_low:
                    low_items.append(info)
                    print(f"\n[!!] 低价: {info['name']}")
                    print(f"     价格: {info['price']}元 (原价{info['op']}元)")
                    print(f"     链接: {info['url']}")
                else:
                    print(f"[OK] {info['name'][:30]}: {info['price']}元")
            time.sleep(2)
        
        return low_items


# 主程序
if __name__ == "__main__":
    SKUS = [
        '100012043978',
        '100038005449',
        '100041913100',
    ]
    
    print("=" * 50)
    print("京东低价监控 - 自动版")
    print("=" * 50)
    
    monitor = JDPriceMonitor(headless=False)
    
    try:
        monitor.start()
        low_items = monitor.check(SKUS)
        
        print(f"\n发现 {len(low_items)} 个低价商品")
        
    except Exception as e:
        print(f"错误: {e}")
    
    finally:
        input("\n按回车关闭...")
        monitor.close()