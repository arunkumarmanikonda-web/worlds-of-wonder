-- ============================================================
--  Seed: Default Staff Users
--  Passwords are bcrypt hashed (cost 10)
--  CHANGE THESE IN PRODUCTION
--
--  Plain-text passwords for dev:
--    super_admin → Admin@1234
--    admin       → Admin@2345
--    finance     → Finance@3456
--    gate        → Gate@6789
--    crm         → CRM@5678
--    sales       → Sales@7890
-- ============================================================

INSERT INTO staff_users (name, email, password_hash, role, zone) VALUES
  ('AKM Super Admin',  'akm@indiagully.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'HQ'),
  ('Rajesh Kumar',     'rajesh@wow.in',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',       'Noida'),
  ('Priya Finance',    'priya.fin@wow.in',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'finance',     'Noida'),
  ('Vikram Ops',       'vikram.ops@wow.in',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ops',         'Noida'),
  ('Sneha CRM',        'sneha.crm@wow.in',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'crm',         'Noida'),
  ('Ravi Gate',        'ravi.gate@wow.in',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gate',        'Gate A'),
  ('Sanjay Sales',     'sanjay@wow.in',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sales',       'Noida')
ON CONFLICT (email) DO NOTHING;

-- Note: The hash above corresponds to password "password" (bcrypt cost 10)
-- For production, generate real hashes with:
--   node -e "const b=require('bcryptjs'); b.hash('YourPassword',10).then(console.log)"
