"""
京东低价监控工具 - Selenium版
安装依赖: pip install selenium
还需要下载ChromeDriver: https://chromedriver.chromium.org/
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re
from datetime import datetime

class JDPriceMonitorSelenium:
    def __init__(self, headless=False):
        """初始化浏览器"""
        self.options = Options()
        
        # 基础设置
        self.options.add_argument('--disable-gpu')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('--window-size=1920,1080')
        
        # 反检测
        self.options.add_argument('--disable-blink-features=AutomationControlled')
        self.options.add_experimental_option('excludeSwitches', ['enable-automation'])
        self.options.add_experimental_option('useAutomationExtension', False)
        
        # User-Agent
        self.options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        # 无头模式（后台运行）
        if headless:
            self.options.add_argument('--headless')
        
        self.driver = None
        self.price_history = {}
    
    def start_browser(self):
        """启动浏览器"""
        print("正在启动浏览器...")
        self.driver = webdriver.Chrome(options=self.options)
        
        # 注入JS隐藏webdriver特征
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print("浏览器启动成功!")
    
    def close_browser(self):
        """关闭浏览器"""
        if self.driver:
            self.driver.quit()
            print("浏览器已关闭")
    
    def get_price(self, sku_id):
        """获取商品价格"""
        url = f'https://item.jd.com/{sku_id}.html'
        
        try:
            print(f"正在访问: {url}")
            self.driver.get(url)
            
            # 等待页面加载
            time.sleep(3)
            
            # 获取商品名称
            try:
                name_elem = self.driver.find_element(By.CSS_SELECTOR, '.sku-name')
                name = name_elem.text.strip()[:50]
            except:
                name = f"商品{sku_id}"
            
            # 获取价格 - 多种方式尝试
            price = 0
            op_price = 0
            
            # 方式1: 直接查找价格元素
            try:
                price_elem = self.driver.find_element(By.CSS_SELECTOR, '.p-price .price')
                price = float(price_elem.text.replace('￥', '').replace('¥', '').strip())
            except:
                pass
            
            # 方式2: 查找促销价格
            if price == 0:
                try:
                    price_elem = self.driver.find_element(By.CSS_SELECTOR, '.J-p-{sku_id}')
                    price = float(price_elem.text.replace('￥', '').replace('¥', '').strip())
                except:
                    pass
            
            # 方式3: 从页面源码提取
            if price == 0:
                try:
                    page_source = self.driver.page_source
                    # 查找价格JSON
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
                op_elem = self.driver.find_element(By.CSS_SELECTOR, '.p-price .del')
                op_text = op_elem.text.replace('￥', '').replace('¥', '').strip()
                if op_text:
                    op_price = float(op_text)
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
            print(f"获取价格失败: {e}")
            return None
    
    def is_low_price(self, price, op):
        """判断是否是异常低价"""
        if price <= 0:
            return True, "价格为0或负数"
        if op > 0 and price < op * 0.3:
            return True, f"低于原价30%"
        if op > 50 and price < 1:
            return True, "疑似单位错误"
        return False, "正常"
    
    def check_batch(self, sku_list):
        """批量检查"""
        print(f"\n批量检查 {len(sku_list)} 个商品")
        print("=" * 60)
        
        results = []
        low_items = []
        
        for sku in sku_list:
            info = self.get_price(sku)
            if info:
                results.append(info)
                
                is_low, reason = self.is_low_price(info['price'], info['op'])
                if is_low:
                    low_items.append({**info, 'reason': reason})
                    print(f"\n[!!] 低价警报!")
                    print(f"  商品: {info['name']}")
                    print(f"  价格: {info['price']}元")
                    print(f"  原价: {info['op']}元")
                    print(f"  原因: {reason}")
                else:
                    print(f"[OK] {info['name'][:30]}: {info['price']}元")
            
            time.sleep(2)  # 避免请求过快
        
        print(f"\n检查完成，发现 {len(low_items)} 个疑似低价商品")
        return results, low_items
    
    def monitor(self, sku_list, interval=30, rounds=10):
        """持续监控"""
        print(f"\n开始监控 {len(sku_list)} 个商品")
        print(f"检查间隔: {interval}秒，共{rounds}轮")
        print("=" * 60)
        
        for round_num in range(rounds):
            print(f"\n--- 第 {round_num + 1}/{rounds} 轮检查 [{datetime.now().strftime('%H:%M:%S')}] ---")
            
            for sku in sku_list:
                info = self.get_price(sku)
                if info:
                    is_low, reason = self.is_low_price(info['price'], info['op'])
                    
                    if is_low:
                        print(f"\n🚨 低价警报!")
                        print(f"  商品: {info['name']}")
                        print(f"  价格: {info['price']}元 (原价{info['op']}元)")
                        print(f"  原因: {reason}")
                        print(f"  链接: {info['url']}")
                        # TODO: 添加通知功能
                    else:
                        print(f"[OK] {info['name'][:25]}: {info['price']}元")
                
                time.sleep(2)
            
            if round_num < rounds - 1:
                print(f"\n等待 {interval} 秒...")
                time.sleep(interval)
        
        print("\n监控结束")
    
    def search_low_price(self, keyword, max_price=50):
        """搜索低价商品"""
        url = f'https://search.jd.com/Search?keyword={keyword}&enc=utf-8&wq={keyword}'
        
        print(f"\n搜索: {keyword}")
        print("=" * 60)
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            # 获取商品列表
            items = self.driver.find_elements(By.CSS_SELECTOR, '.gl-item')
            
            low_items = []
            for item in items[:20]:  # 检查前20个
                try:
                    sku = item.get_attribute('data-sku')
                    name = item.find_element(By.CSS_SELECTOR, '.p-name a').text[:30]
                    price_text = item.find_element(By.CSS_SELECTOR, '.p-price strong i').text
                    
                    if price_text:
                        price = float(price_text)
                        if price <= max_price:
                            low_items.append({
                                'sku': sku,
                                'name': name,
                                'price': price,
                                'url': f'https://item.jd.com/{sku}.html'
                            })
                            print(f"[低价] {name}: {price}元")
                except:
                    continue
            
            print(f"\n找到 {len(low_items)} 个低价商品")
            return low_items
            
        except Exception as e:
            print(f"搜索失败: {e}")
            return []


# ==================== 主程序 ====================
if __name__ == "__main__":
    # 测试SKU
    DEMO_SKUS = [
        '100012043978',
        '100038005449',
        '100041913100',
    ]
    
    print("=" * 50)
    print("京东低价监控工具 - Selenium版")
    print("=" * 50)
    
    monitor = JDPriceMonitorSelenium(headless=False)  # headless=False可以看到浏览器
    
    try:
        monitor.start_browser()
        
        # 批量检查
        print("\n开始批量检查...")
        results, low_items = monitor.check_batch(DEMO_SKUS)
        
        print("\n" + "=" * 50)
        print("检查结果:")
        print(f"  检查商品: {len(results)} 个")
        print(f"  发现低价: {len(low_items)} 个")
        
        if low_items:
            print("\n低价商品列表:")
            for item in low_items:
                print(f"  - {item['name']}: {item['price']}元")
                print(f"    链接: {item['url']}")
        
    except Exception as e:
        print(f"程序出错: {e}")
    
    finally:
        # 等待用户查看结果
        input("\n按回车键关闭浏览器...")
        monitor.close_browser()