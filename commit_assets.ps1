# ============================================================
# 红石镇站点 · 资源提交脚本（供所有合作者使用）
# ------------------------------------------------------------
# 作用：仅提交并推送 about/ 与 img/gallery/ 的更改。
#       这两个目录被 .gitignore 忽略，普通 git add 不会收录，
#       因此必须使用 -f 强制暂存。
#       推送后 GitHub Actions 将自动重建 about.html / gallery.html。
#
# 用法（Windows）:
#     powershell -ExecutionPolicy Bypass -File commit_assets.ps1
#     powershell -ExecutionPolicy Bypass -File commit_assets.ps1 -Message "你的提交说明"
#
# 前提:
#     1) 已安装 git 并加入 PATH。
#     2) 已 clone 本仓库（未配置 remote 时脚本会自动添加）：
#            git clone https://github.com/Hisuifeng/RedStoneTown-index.git
#     3) 登录凭据由系统 git 凭据管理器处理，无需手动输密码。
#
# 编码: 本文件为 UTF-8（含 BOM），请勿在 PowerShell 5.1 中另存为无 BOM 格式。
# ============================================================

param(
    [string]$Message = "chore(assets): update about timeline and gallery assets",
    [string]$Remote = "https://github.com/Hisuifeng/RedStoneTown-index.git"
)

$ErrorActionPreference = 'Stop'

# ---------- 1. 目录检查 ----------
$targets = @('about', 'img/gallery')
if (-not ($targets | Where-Object { Test-Path -LiteralPath $_ })) {
    Write-Host "尚无 about/ 或 img/gallery/ 目录，无需提交。"
    exit 0
}

# ---------- 2. 远端检查（没有 origin 就自动添加） ----------
if (-not (git remote)) {
    git remote add origin $Remote
    if ($LASTEXITCODE -ne 0) { Write-Host "自动添加远端 origin 失败"; exit $LASTEXITCODE }
    Write-Host "已自动添加远端：origin -> $Remote"
}

# ---------- 3. 强制暂存 ----------
git add -f about/ img/gallery/
if ($LASTEXITCODE -ne 0) { Write-Host "git add 失败"; exit $LASTEXITCODE }

# ---------- 4. 提交并推送 ----------
if (git diff --cached --quiet) {
    Write-Host "无需提交：about/ 与 img/gallery/ 没有改动。"
    exit 0
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "git commit 失败"; exit $LASTEXITCODE }

git push -u origin HEAD
if ($LASTEXITCODE -ne 0) { Write-Host "git push 失败"; exit $LASTEXITCODE }

Write-Host "完成：已提交并推送 about/ 与 img/gallery/ 的更改。"