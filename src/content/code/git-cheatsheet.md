---
title: Git 常用操作速查
date: 2026-09-11
order: 1
tags: [git, 速查]
summary: 日常最常敲的那十几条，忘了就回来抄。
---

# Git 常用操作速查

## 分支

```bash
git switch -c feature/xxx     # 新建并切换分支
git switch main               # 切回主分支
git branch -d feature/xxx     # 删除已合并分支
git branch -D feature/xxx     # 强制删除未合并分支
```

## 撤销

| 场景 | 命令 |
| --- | --- |
| 撤销工作区修改 | `git restore <file>` |
| 撤销已 add 的文件 | `git restore --staged <file>` |
| 改掉最后一次提交 | `git commit --amend` |
| 回到某个提交并保留改动 | `git reset --soft <hash>` |
| 生成一次反向提交（推荐） | `git revert <hash>` |

> 已经推到远程的提交，用 `revert` 而不是 `reset`，否则同事的本地历史会打架。

## 暂存

```bash
git stash push -m "临时保存"   # 存起来
git stash list                 # 看列表
git stash pop                  # 取回并删除
```

## 远程

```bash
git remote -v
git push -u origin feature/xxx   # 首次推送并绑定上游
git fetch --prune                # 清理本地已失效的远程分支记录
```
