# RDS PostgreSQL Database
resource "aws_db_subnet_group" "main" {
  name       = "saas-gateway-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "saas-gateway-db-subnet-group"
  }
}

resource "random_password" "db" {
  length  = 32
  special = true
}

resource "aws_db_instance" "postgres" {
  identifier     = "saas-gateway-db"
  engine         = "postgres"
  engine_version = var.rds_engine_version
  instance_class = var.rds_instance_class

  db_name  = "saas_gateway_db"
  username = "gateway_user"
  password = random_password.db.result

  allocated_storage = var.rds_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  publicly_accessible             = false
  backup_retention_period          = 30
  backup_window                    = "03:00-04:00"
  maintenance_window               = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  enable_iam_database_authentication = true
  skip_final_snapshot              = var.environment != "production"
  final_snapshot_identifier       = var.environment == "production" ? "saas-gateway-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Enable enhanced monitoring
  monitoring_interval             = var.enable_rds_enhanced_monitoring ? 60 : 0
  monitoring_role_arn            = var.enable_rds_enhanced_monitoring ? aws_iam_role.rds_monitoring[0].arn : null
  enable_performance_insights    = true
  performance_insights_retention_period = 7

  tags = {
    Name = "saas-gateway-postgres"
  }
}

# RDS Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  count = var.enable_rds_enhanced_monitoring ? 1 : 0
  name  = "saas-gateway-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.enable_rds_enhanced_monitoring ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# DB Parameter Group for TimescaleDB
resource "aws_db_parameter_group" "main" {
  family = "postgres${floor(tonumber(var.rds_engine_version))}"
  name   = "saas-gateway-pg-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "timescaledb"
  }

  tags = {
    Name = "saas-gateway-db-params"
  }
}
