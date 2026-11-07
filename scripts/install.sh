#!/bin/bash
# npm necesita HOME; los hooks de CodeDeploy corren con un entorno mínimo
export HOME=/root
cd /home/ec2-user/app && npm install --omit=dev
