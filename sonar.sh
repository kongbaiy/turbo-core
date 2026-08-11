#!/usr/bin/env bash
set -euo pipefail

PROJECT_TYPE="${1:-}"

# ============================================================
# 以下几项按您 SonarQube Server 真实配置填写，
# 或通过环境变量 / Jenkins Credentials 注入，不要写死在此文件里。
# ============================================================
SONAR_HOST_URL="${SONAR_HOST_URL:-}"
SONAR_TOKEN="${SONAR_TOKEN:-}"            # ⚠️ 建议通过 Jenkins Credentials 注入，不要明文写入
SONAR_SCANNER_BIN="${SONAR_SCANNER_BIN:-}"

COMMON_EXCLUSIONS="**/node_modules/**,**/.pnp/*,**/.pnpm-store/*,**/coverage/*,**/.turbo/*,**/.vercel/*,**/.next/*,**/out/**,**/build/**,**/dist/**,**/release/**,**/*.test.*,**/*.spec.*,**/log/*,**/logs/*"

if [ "$PROJECT_TYPE" = "platform" ]; then
    echo "[sonar.sh] 执行「平台端」多仓聚合分析"
    PROJECT_KEY="shengzhiyun-platform-front-v3-platform"
    PROJECT_NAME="晟智云V3前端-平台端"
    SOURCES="apps/sc-cloud-basic,apps/sc-cloud-platform"

elif [ "$PROJECT_TYPE" = "enterprise" ]; then
    echo "[sonar.sh] 执行「企业端」多仓聚合分析"
    PROJECT_KEY="shengzhiyun-platform-front-v3-enterprise"
    PROJECT_NAME="晟智云V3前端-企业端"
	SOURCES="./"
    #SOURCES="apps/sc-cloud-basic-platform,apps/sc-cloud-design-form,apps/sc-cloud-fm-budget,apps/sc-cloud-fm-treasury,apps/sc-cloud-fm-accounting,apps/sc-cloud-mdm,apps/sc-cloud-procurement,apps/sc-cloud-expense"

else
    echo "[sonar.sh] 不支持的参数：'${PROJECT_TYPE}'，仅支持 platform 或 enterprise" >&2
    exit 1
fi

if [ -z "$SONAR_HOST_URL" ] || [ -z "$SONAR_TOKEN" ]; then
    echo "[sonar.sh] 未设置 SONAR_HOST_URL 或 SONAR_TOKEN，请通过环境变量注入后重试" >&2
    exit 1
fi


"$SONAR_SCANNER_BIN" \
    -Dsonar.host.url="$SONAR_HOST_URL" \
    -Dsonar.token="$SONAR_TOKEN" \
    -Dsonar.projectKey="$PROJECT_KEY" \
    -Dsonar.projectName="$PROJECT_NAME" \
    -Dsonar.sources="$SOURCES" \
	-Dsonar.scm.exclusions.disabled=true \
    -Dsonar.exclusions="$COMMON_EXCLUSIONS" \
    -Dsonar.sourceEncoding=UTF-8