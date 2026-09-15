---
title: Docker 常用命令
date: 2026-09-10
order: 3
tags: [docker, 速查]
summary: 起容器、看日志、清垃圾，够日常用了。
---

# Docker 常用命令

## 容器

```bash
docker run -d --name app -p 8080:80 nginx
docker ps -a
docker logs -f app
docker exec -it app sh
docker stop app && docker rm app
```

## 镜像

```bash
docker images
docker pull nginx:alpine
docker rmi nginx:alpine
docker build -t myapp:1.0 .
```

## 清理

```bash
docker system df          # 看占用
docker system prune       # 清掉停止的容器、悬空镜像
docker volume prune       # 清无用卷（注意会删数据）
```

## docker compose

```bash
docker compose up -d
docker compose logs -f
docker compose down
docker compose pull && docker compose up -d   # 更新镜像
```
