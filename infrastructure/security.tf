# Security Groups and IAM

# RDS Security Group
resource "aws_security_group" "rds" {
  name   = "saas-gateway-rds-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
    description     = "PostgreSQL from EKS nodes"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "saas-gateway-rds-sg"
  }
}

# EKS Nodes Security Group
resource "aws_security_group" "eks_nodes" {
  name   = "saas-gateway-eks-nodes-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
    description = "Node to node communication"
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    cidr_blocks     = ["0.0.0.0/0"]
    description     = "HTTPS from internet"
  }

  ingress {
    from_port   = 1025
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Ephemeral ports from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "saas-gateway-eks-nodes-sg"
  }
}

# ElastiCache Security Group
resource "aws_security_group" "redis" {
  name   = "saas-gateway-redis-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
    description     = "Redis from EKS nodes"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "saas-gateway-redis-sg"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_subnet_group" "main" {
  name       = "saas-gateway-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "saas-gateway-redis-subnet-group"
  }
}

resource "random_password" "redis" {
  length  = 32
  special = true
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "saas-gateway-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  auth_token                      = random_password.redis.result
  auth_token_update_strategy      = "ROTATE"
  at_rest_encryption_enabled      = true
  transit_encryption_enabled      = true
  transit_encryption_mode         = "preferred"
  automatic_failover_enabled      = var.redis_num_cache_nodes > 1 ? true : false
  multi_az_enabled                = var.redis_num_cache_nodes > 1 ? true : false

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = {
    Name = "saas-gateway-redis"
  }

  depends_on = [aws_cloudwatch_log_group.redis_slow_log]
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/saas-gateway-redis/slow-log"
  retention_in_days = 7

  tags = {
    Name = "saas-gateway-redis-slow-log"
  }
}
