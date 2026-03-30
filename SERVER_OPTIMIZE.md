# 512MB 服务器优化配置指南

## 1. 开启 1GB Swap 虚拟内存

```bash
# 创建 1GB swap 文件
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用（重启后自动挂载）
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 验证
free -h
```

## 2. MariaDB 轻量化配置

编辑 `/etc/mysql/mariadb.conf.d/50-server.cnf`：

```ini
[mysqld]
# 基础设置
skip-name-resolve
skip-external-locking

# 内存优化（512MB服务器）
key_buffer_size = 16M
max_allowed_packet = 8M
table_open_cache = 64
sort_buffer_size = 256K
read_buffer_size = 256K
read_rnd_buffer_size = 256K
net_buffer_length = 2K
thread_stack = 256K

# InnoDB 优化
innodb_buffer_pool_size = 64M
innodb_log_buffer_size = 8M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 连接数限制
max_connections = 30
wait_timeout = 60
interactive_timeout = 60

# 日志（减少IO）
slow_query_log = 0
general_log = 0
log_error = /var/log/mysql/error.log

# 查询缓存
query_cache_type = 1
query_cache_size = 16M
query_cache_limit = 1M
```

重启 MariaDB：
```bash
sudo systemctl restart mariadb
```

## 3. Node.js 启动优化

```bash
# 限制 Node.js 内存（防止OOM）
NODE_OPTIONS="--max-old-space-size=256" node server.js
```

## 4. 系统优化

```bash
# 清理缓存
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# 限制系统日志大小
sudo journalctl --vacuum-size=50M
```

## 5. 一键部署脚本

```bash
#!/bin/bash
# deploy.sh

# 安装依赖
cd /opt/health-tracker/backend
npm install --production

# 初始化数据库
node init-db.js

# 创建 systemd 服务
cat > /etc/systemd/system/health-tracker.service << EOF
[Unit]
Description=Health Tracker App
After=network.target mariadb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/health-tracker/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable health-tracker
sudo systemctl start health-tracker
```
