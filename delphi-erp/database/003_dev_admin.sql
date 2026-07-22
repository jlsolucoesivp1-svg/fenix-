-- Script opcional para ambiente inicial de desenvolvimento.
-- Ajuste os valores conforme a empresa e o pepper do appsettings.

-- Exemplo de fluxo:
-- 1. criar a company
-- 2. criar a role admin
-- 3. vincular permissoes
-- 4. criar o usuario admin com hash/salt previamente calculados na aplicacao

-- Este arquivo fica sem hash fixo para evitar distribuir credencial padrao insegura.

INSERT INTO companies (id, trade_name, legal_name, document_number, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Fenix Demo', 'Fenix Demo Ltda', '00.000.000/0001-00', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO roles (id, company_id, name, description, is_system)
VALUES
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Administrador', 'Acesso total ao sistema', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000010', p.id
FROM permissions p
ON CONFLICT DO NOTHING;

-- Exemplo de insert de usuario:
-- INSERT INTO users (
--   company_id, role_id, full_name, login_name, email, password_hash, password_salt, is_active
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000010',
--   'Administrador',
--   'admin',
--   'admin@fenix.local',
--   '<HASH_GERADO_NA_APLICACAO>',
--   '<SALT_GERADO_NA_APLICACAO>',
--   TRUE
-- );
