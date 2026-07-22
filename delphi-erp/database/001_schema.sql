CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(200),
    document_number VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(150),
    address_line VARCHAR(200),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    state_code CHAR(2),
    zip_code VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    role_id UUID NULL REFERENCES roles(id),
    full_name VARCHAR(150) NOT NULL,
    login_name VARCHAR(80) NOT NULL,
    email VARCHAR(150),
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_login UNIQUE (login_name)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL,
    machine_name VARCHAR(120),
    ip_address VARCHAR(64),
    session_token VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NULL REFERENCES users(id),
    login_name VARCHAR(80),
    event_type VARCHAR(40) NOT NULL,
    details TEXT,
    machine_name VARCHAR(120),
    ip_address VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_recovery_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    customer_type SMALLINT NOT NULL DEFAULT 1,
    full_name VARCHAR(180) NOT NULL,
    trade_name VARCHAR(180),
    document_number VARCHAR(20),
    state_registration VARCHAR(30),
    phone_1 VARCHAR(20),
    phone_2 VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(150),
    address_line VARCHAR(200),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    state_code CHAR(2),
    zip_code VARCHAR(10),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(full_name);
CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document_number);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    sku VARCHAR(50),
    barcode VARCHAR(50),
    name VARCHAR(180) NOT NULL,
    description TEXT,
    unit_name VARCHAR(20) NOT NULL DEFAULT 'UN',
    cost_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    stock_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    min_stock_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    product_id UUID NOT NULL REFERENCES products(id),
    movement_type SMALLINT NOT NULL,
    source_type SMALLINT NOT NULL,
    source_id UUID NULL,
    quantity NUMERIC(18,3) NOT NULL,
    unit_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    number_code BIGINT NOT NULL,
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_code SMALLINT NOT NULL,
    equipment_description VARCHAR(180) NOT NULL,
    serial_number VARCHAR(80),
    reported_issue TEXT NOT NULL,
    technical_diagnosis TEXT,
    executed_service TEXT,
    accessories TEXT,
    estimated_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    final_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    closed_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_by_user_id UUID NULL REFERENCES users(id),
    updated_by_user_id UUID NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_orders_company_number UNIQUE (company_id, number_code)
);

CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status_code);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer ON service_orders(customer_id);

CREATE TABLE IF NOT EXISTS service_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    item_type SMALLINT NOT NULL,
    product_id UUID NULL REFERENCES products(id),
    description VARCHAR(200) NOT NULL,
    quantity NUMERIC(18,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS service_order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    old_status_code SMALLINT,
    new_status_code SMALLINT NOT NULL,
    notes TEXT,
    changed_by_user_id UUID NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    opened_by_user_id UUID NULL REFERENCES users(id),
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_by_user_id UUID NULL REFERENCES users(id),
    closed_at TIMESTAMP NULL,
    opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(18,2) NULL,
    status_code SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS financial_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    cash_box_id UUID NULL REFERENCES cash_boxes(id),
    customer_id UUID NULL REFERENCES customers(id),
    service_order_id UUID NULL REFERENCES service_orders(id),
    sale_id UUID NULL,
    entry_type SMALLINT NOT NULL,
    category_code SMALLINT NOT NULL,
    description VARCHAR(250) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    due_date DATE,
    paid_date DATE,
    status_code SMALLINT NOT NULL,
    payment_method_code SMALLINT,
    created_by_user_id UUID NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_due_date ON financial_entries(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_status ON financial_entries(status_code);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NULL REFERENCES companies(id),
    customer_id UUID NULL REFERENCES customers(id),
    sale_number BIGINT NOT NULL,
    sold_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gross_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    net_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    payment_method_code SMALLINT NOT NULL,
    status_code SMALLINT NOT NULL DEFAULT 1,
    created_by_user_id UUID NULL REFERENCES users(id),
    CONSTRAINT uq_sales_company_number UNIQUE (company_id, sale_number)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NULL REFERENCES products(id),
    description VARCHAR(200) NOT NULL,
    quantity NUMERIC(18,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(18,2) NOT NULL DEFAULT 0
);
