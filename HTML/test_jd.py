import requests
import re

print("Testing JD page...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html',
}

try:
    r = requests.get('https://item.jd.com/100012043978.html', headers=headers, timeout=15)
    print(f"Status: {r.status_code}")
    print(f"Length: {len(r.text)}")
    
    # 保存页面内容用于分析
    with open('jd_page.html', 'w', encoding='utf-8') as f:
        f.write(r.text)
    print("Page saved to jd_page.html")
    
    # 搜索价格
    patterns = [
        (r'"p":"([\d.]+)"', 'price p'),
        (r'"op":"([\d.]+)"', 'price op'),
        (r'"m":"([\d.]+)"', 'price m'),
        (r'class="price".*?>([\d.]+)', 'price class'),
    ]
    
    for pattern, name in patterns:
        matches = re.findall(pattern, r.text)
        print(f"{name}: {matches[:3]}")
        
except Exception as e:
    print(f"Error: {e}")

print("Done")