#
# SSH 方式克隆代码速度贼慢，改成 HTTPS 方式克隆
# 建议全局设置 git 储存密码，只需要输入一次，避免每次输入密码
# git config --global credential.helper store
#

git clone -b dev http://office.szyplus.com:3101/sc-cloud/sc-cloud-basic.git apps/sc-cloud-basic
git clone -b dev http://office.szyplus.com:3101/sc-cloud/sc-cloud-platform.git apps/sc-cloud-platform
