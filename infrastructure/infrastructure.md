# AWS Infrastructure for Multi-Tenant SaaS Gateway
# Terraform configuration for production deployment

## Overview

This Terraform configuration provisions the complete AWS infrastructure for the Multi-Tenant SaaS Gateway:

- **VPC** - Isolated network with public and private subnets
- **EKS** - Managed Kubernetes cluster for application deployment
- **RDS** - PostgreSQL database with automated backups
- **ElastiCache** - Redis cluster for caching
- **IAM** - Roles and policies for secure access
- **Security Groups** - Network firewall rules

## Prerequisites

1. AWS account with appropriate permissions
2. Terraform 1.0+ installed
3. AWS CLI configured: `aws configure`
4. kubectl configured for EKS access

## Quick Start

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review Changes

```bash
terraform plan
```

### 3. Apply Configuration

```bash
terraform apply
```

### 4. Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name saas-gateway-eks
kubectl get nodes
```

## Configuration

### Variables

Edit `terraform.tfvars` to customize:

```hcl
aws_region             = "us-east-1"
environment            = "production"
vpc_cidr               = "10.0.0.0/16"
eks_cluster_version    = "1.27"
rds_instance_class     = "db.t3.small"
redis_node_type        = "cache.t3.micro"
```

### Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `aws_region` | us-east-1 | AWS region |
| `environment` | production | Environment name |
| `vpc_cidr` | 10.0.0.0/16 | VPC network range |
| `eks_cluster_version` | 1.27 | Kubernetes version |
| `rds_instance_class` | db.t3.small | Database size |
| `redis_node_type` | cache.t3.micro | Redis instance type |

## File Structure

```
├── main.tf              # Provider and variables
├── variables.tf         # Variable definitions
├── outputs.tf           # Outputs (endpoints, credentials)
├── vpc.tf               # VPC, subnets, NAT gateway
├── rds.tf               # PostgreSQL database
├── eks.tf               # Kubernetes cluster
├── security.tf          # Security groups, IAM roles
└── terraform.tfvars.example
```

## Architecture

```
┌─────────────────────────────────────────┐
│         AWS Region (us-east-1)          │
├─────────────────────────────────────────┤
│  VPC (10.0.0.0/16)                      │
│  ├── Public Subnets                     │
│  │   ├── NAT Gateway                    │
│  │   └── Ingress Controller             │
│  └── Private Subnets (EKS nodes)        │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌────────┐  ┌──────────┐ │
│  │   EKS   │  │  RDS   │  │ Elasti-  │ │
│  │Cluster  │  │PostgreSQL Cache  │ │
│  │(Managed)│  │ (Managed) │(Redis)  │ │
│  └─────────┘  └────────┘  └──────────┘ │
└─────────────────────────────────────────┘
```

## Deployment

### Deploy to EKS

```bash
# 1. Apply infrastructure
terraform apply

# 2. Configure kubectl
aws eks update-kubeconfig --region $(terraform output -raw aws_region) \
  --name $(terraform output -raw eks_cluster_name)

# 3. Create secrets
kubectl create secret generic db-secret \
  --from-literal=username=gateway_user \
  --from-literal=password=$(terraform output -raw db_password) \
  -n saas-gateway

# 4. Apply Kubernetes manifests
kubectl apply -f ../k8s/
```

## Outputs

After applying, get important endpoints:

```bash
# Database endpoint
terraform output db_endpoint

# Redis endpoint
terraform output redis_endpoint

# EKS cluster name
terraform output eks_cluster_name

# All outputs
terraform output
```

## Monitoring

### View AWS Resources

```bash
# EKS cluster
aws eks describe-cluster --name saas-gateway-eks --region us-east-1

# RDS database
aws rds describe-db-instances --db-instance-identifier saas-gateway-db

# ElastiCache
aws elasticache describe-cache-clusters --cache-cluster-id saas-gateway-redis
```

## Cost Optimization

### Adjust Sizing

Edit `terraform.tfvars`:

```hcl
# Development (low cost)
rds_instance_class = "db.t3.micro"
redis_node_type    = "cache.t3.micro"
eks_desired_size   = 1

# Production (high availability)
rds_instance_class = "db.t3.large"
redis_node_type    = "cache.t3.small"
eks_desired_size   = 3
```

### Estimated Monthly Cost

- **EKS Cluster**: $73.00
- **RDS db.t3.small**: $30.00
- **ElastiCache cache.t3.micro**: $15.00
- **Data Transfer**: ~$20.00
- **Total**: ~$138.00/month (before AWS free tier)

## Troubleshooting

### Terraform Plan Fails

```bash
# Refresh state
terraform refresh

# Show current state
terraform show
```

### EKS Node Issues

```bash
# Check node status
kubectl get nodes
kubectl describe node <node-name>

# View CloudWatch logs
aws logs tail /aws/eks/saas-gateway-eks/cluster --follow
```

### Database Connection Issues

```bash
# Check security group
aws ec2 describe-security-groups --group-ids <sg-id>

# Test from pod
kubectl exec -it <pod-name> -- psql -h <db-endpoint> -U gateway_user -d saas_gateway_db
```

## Cleanup

⚠️ **Warning**: This deletes all infrastructure and data!

```bash
# Delete all AWS resources
terraform destroy

# Confirm deletion
# Type 'yes' when prompted
```

## Best Practices

1. **Use separate tfvars for environments**
   ```bash
   terraform apply -var-file=dev.tfvars
   terraform apply -var-file=prod.tfvars
   ```

2. **Enable S3 backend for state**
   ```hcl
   terraform {
     backend "s3" {
       bucket = "saas-gateway-terraform-state"
       key    = "prod/terraform.tfstate"
       region = "us-east-1"
     }
   }
   ```

3. **Use AWS Secrets Manager for sensitive data**
   - Don't store passwords in terraform.tfvars
   - Reference from AWS Secrets Manager

4. **Enable encryption**
   - RDS: encryption at rest
   - EBS volumes: encrypted
   - Secrets: encrypted

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Terraform Best Practices](https://www.terraform.io/language/settings/backends/remote)
