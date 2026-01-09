-- Initialize database schema for multi-tenant SaaS gateway
-- This script runs when PostgreSQL container starts

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, username)
);

CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_users_email ON public.users(email);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_roles_tenant ON public.roles(tenant_id);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE INDEX idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_status ON public.api_keys(status);

-- Create metrics table (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS public.metrics (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    tenant_id UUID NOT NULL,
    request_id UUID DEFAULT uuid_generate_v4(),
    method VARCHAR(10),
    endpoint VARCHAR(500),
    status_code INT,
    response_time_ms DECIMAL(10, 2),
    bytes_in BIGINT,
    bytes_out BIGINT,
    user_id UUID,
    api_key_id UUID
);

SELECT create_hypertable('public.metrics', 'time', if_not_exists => TRUE);

CREATE INDEX idx_metrics_tenant ON public.metrics(tenant_id, time DESC);
CREATE INDEX idx_metrics_status ON public.metrics(status_code, time DESC);
CREATE INDEX idx_metrics_endpoint ON public.metrics(endpoint, time DESC);

-- Create audit_logs table (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT
);

SELECT create_hypertable('public.audit_logs', 'time', if_not_exists => TRUE);

CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id, time DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, time DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action, time DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT
    u.id as user_id,
    u.tenant_id,
    u.email,
    r.id as role_id,
    r.name as role_name
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id;
