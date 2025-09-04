-- Create countries table
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  default_locale VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  domain VARCHAR(100) NOT NULL
);

-- Example seed data
INSERT INTO countries (name, code, currency, default_locale, status, domain) VALUES
('Guyana', 'GY', 'GYD', 'en-GY', 'active', 'guyanahomehub.com'),
('Trinidad & Tobago', 'TT', 'TTD', 'en-TT', 'coming soon', 'trinidadhomehub.com'),
('Barbados', 'BB', 'BBD', 'en-BB', 'coming soon', 'barbadoshomehub.com');
