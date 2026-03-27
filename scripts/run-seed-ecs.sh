#!/usr/bin/env bash
# Run demo seed against production RDS using a one-off Fargate task (same network as menu-api-svc).
#
# WARNING: src/scripts/seed.ts CLEARS all application tables before inserting demo data.
#
# Usage: ./scripts/run-seed-ecs.sh
# Env: AWS_REGION (default us-east-1), ECS_CLUSTER, ECS_SERVICE

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
CLUSTER="${ECS_CLUSTER:-menu-api-cluster}"
SERVICE="${ECS_SERVICE:-menu-api-svc}"

TASK_DEF="$(aws ecs describe-services --region "$REGION" --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].taskDefinition' --output text)"

SUBNET_LIST="$(aws ecs describe-services --region "$REGION" --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.subnets' --output text | tr '\t' ',')"
SG_LIST="$(aws ecs describe-services --region "$REGION" --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups' --output text | tr '\t' ',')"
ASSIGN="$(aws ecs describe-services --region "$REGION" --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.assignPublicIp' --output text)"

echo "Task definition: $TASK_DEF"
echo "Starting one-off seed task..."

TASK_ARN="$(aws ecs run-task \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --task-definition "$TASK_DEF" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$SG_LIST],assignPublicIp=$ASSIGN}" \
  --overrides '{"containerOverrides":[{"name":"api","command":["node","dist/scripts/seed.js"]}]}' \
  --query 'tasks[0].taskArn' --output text)"

echo "Started: $TASK_ARN"
echo "Logs: aws logs tail /ecs/menu-api --region $REGION --since 1m --follow"
