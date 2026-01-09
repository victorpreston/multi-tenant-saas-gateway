# Outputs
output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = aws_eks_cluster.main.version
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "db_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = false
}

output "db_host" {
  description = "RDS database host"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS database port"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "RDS database username"
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "db_password" {
  description = "RDS database password"
  value       = random_password.db.result
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_cluster.redis.port
}

output "redis_auth_token" {
  description = "Redis auth token"
  value       = random_password.redis.result
  sensitive   = true
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

output "database_url" {
  description = "PostgreSQL connection URL"
  value       = "postgresql://${aws_db_instance.postgres.username}:${random_password.db.result}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

output "redis_url" {
  description = "Redis connection URL"
  value       = "redis://:${random_password.redis.result}@${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.port}"
  sensitive   = true
}
