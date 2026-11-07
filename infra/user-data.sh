#!/bin/bash
# User data de lt-mercadoandino (Amazon Linux 2023)
dnf update -y
# Ajuste: Node.js 22 (el SDK de AWS v3 actual exige Node 20+; "nodejs" de AL2023 es la 18)
# y npm, que en AL2023 viene en un paquete aparte.
dnf install -y ruby wget nodejs22 nodejs22-npm amazon-cloudwatch-agent
cd /tmp
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
chmod +x install
./install auto
systemctl enable --now codedeploy-agent
# Ajuste: CloudWatch Agent (memoria y disco) en TODAS las instancias que lance el Auto Scaling
cat > /opt/aws/amazon-cloudwatch-agent/etc/cw-agent.json << 'JSON'
{
  "metrics": {
    "append_dimensions": { "AutoScalingGroupName": "${aws:AutoScalingGroupName}" },
    "metrics_collected": {
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": { "measurement": ["used_percent"], "resources": ["/"] }
    }
  }
}
JSON
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/cw-agent.json -s
