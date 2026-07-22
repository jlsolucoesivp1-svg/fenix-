INSERT INTO permissions (code, name, module_name)
VALUES
    ('dashboard.view', 'Visualizar dashboard', 'dashboard'),
    ('customers.view', 'Visualizar clientes', 'customers'),
    ('customers.edit', 'Editar clientes', 'customers'),
    ('serviceorders.view', 'Visualizar ordens de servico', 'serviceorders'),
    ('serviceorders.edit', 'Editar ordens de servico', 'serviceorders'),
    ('stock.view', 'Visualizar estoque', 'stock'),
    ('stock.edit', 'Editar estoque', 'stock'),
    ('financial.view', 'Visualizar financeiro', 'financial'),
    ('financial.edit', 'Editar financeiro', 'financial'),
    ('sales.view', 'Visualizar vendas', 'sales'),
    ('sales.edit', 'Editar vendas', 'sales'),
    ('reports.view', 'Visualizar relatorios', 'reports'),
    ('users.manage', 'Gerenciar usuarios', 'security')
ON CONFLICT (code) DO NOTHING;
