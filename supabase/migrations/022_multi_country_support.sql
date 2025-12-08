-- Multi-Country Support Migration
-- Adds country, region, and currency support for organizations operating in multiple locations

-- =====================================================
-- ADD COUNTRY/REGION FIELDS TO STOCK LOCATIONS
-- =====================================================
ALTER TABLE stock_locations 
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3),
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- =====================================================
-- ADD MULTI-CURRENCY SUPPORT TO ITEMS
-- =====================================================
ALTER TABLE items
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- =====================================================
-- CREATE CURRENCY RATES TABLE (for conversion)
-- =====================================================
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(organization_id, from_currency, to_currency, effective_date)
);

-- =====================================================
-- CREATE COUNTRIES REFERENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(3) NOT NULL UNIQUE,
    currency VARCHAR(10) NOT NULL,
    currency_symbol VARCHAR(10),
    phone_code VARCHAR(10),
    flag_emoji VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert common countries
INSERT INTO countries (name, code, currency, currency_symbol, phone_code, flag_emoji) VALUES
    ('United States', 'USA', 'USD', '$', '+1', '🇺🇸'),
    ('United Kingdom', 'GBR', 'GBP', '£', '+44', '🇬🇧'),
    ('Canada', 'CAN', 'CAD', 'C$', '+1', '🇨🇦'),
    ('Australia', 'AUS', 'AUD', 'A$', '+61', '🇦🇺'),
    ('Germany', 'DEU', 'EUR', '€', '+49', '🇩🇪'),
    ('France', 'FRA', 'EUR', '€', '+33', '🇫🇷'),
    ('Nigeria', 'NGA', 'NGN', '₦', '+234', '🇳🇬'),
    ('Ghana', 'GHA', 'GHS', 'GH₵', '+233', '🇬🇭'),
    ('South Africa', 'ZAF', 'ZAR', 'R', '+27', '🇿🇦'),
    ('Kenya', 'KEN', 'KES', 'KSh', '+254', '🇰🇪'),
    ('India', 'IND', 'INR', '₹', '+91', '🇮🇳'),
    ('China', 'CHN', 'CNY', '¥', '+86', '🇨🇳'),
    ('Japan', 'JPN', 'JPY', '¥', '+81', '🇯🇵'),
    ('United Arab Emirates', 'ARE', 'AED', 'د.إ', '+971', '🇦🇪'),
    ('Saudi Arabia', 'SAU', 'SAR', '﷼', '+966', '🇸🇦'),
    ('Brazil', 'BRA', 'BRL', 'R$', '+55', '🇧🇷'),
    ('Mexico', 'MEX', 'MXN', '$', '+52', '🇲🇽'),
    ('Singapore', 'SGP', 'SGD', 'S$', '+65', '🇸🇬'),
    ('Malaysia', 'MYS', 'MYR', 'RM', '+60', '🇲🇾'),
    ('Indonesia', 'IDN', 'IDR', 'Rp', '+62', '🇮🇩'),
    ('Philippines', 'PHL', 'PHP', '₱', '+63', '🇵🇭'),
    ('Thailand', 'THA', 'THB', '฿', '+66', '🇹🇭'),
    ('Vietnam', 'VNM', 'VND', '₫', '+84', '🇻🇳'),
    ('Egypt', 'EGY', 'EGP', 'E£', '+20', '🇪🇬'),
    ('Morocco', 'MAR', 'MAD', 'د.م.', '+212', '🇲🇦'),
    ('Tanzania', 'TZA', 'TZS', 'TSh', '+255', '🇹🇿'),
    ('Uganda', 'UGA', 'UGX', 'USh', '+256', '🇺🇬'),
    ('Rwanda', 'RWA', 'RWF', 'FRw', '+250', '🇷🇼'),
    ('Ethiopia', 'ETH', 'ETB', 'Br', '+251', '🇪🇹'),
    ('Cameroon', 'CMR', 'XAF', 'FCFA', '+237', '🇨🇲')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- CREATE REGIONS/STATES REFERENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(country_code, name)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_stock_locations_country ON stock_locations(country_code);
CREATE INDEX IF NOT EXISTS idx_stock_locations_currency ON stock_locations(currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_org ON currency_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_currency_rates_currencies ON currency_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions(country_code);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view countries" ON countries;
DROP POLICY IF EXISTS "Anyone can view regions" ON regions;
DROP POLICY IF EXISTS "Users can view their org currency rates" ON currency_rates;
DROP POLICY IF EXISTS "Admins can manage currency rates" ON currency_rates;

-- Countries and regions are public read
CREATE POLICY "Anyone can view countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Anyone can view regions" ON regions FOR SELECT USING (true);

-- Currency rates are organization-specific
CREATE POLICY "Users can view their org currency rates" ON currency_rates
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage currency rates" ON currency_rates
    FOR ALL USING (
        organization_id IN (
            SELECT au.organization_id 
            FROM app_users au
            JOIN user_roles ur ON au.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE au.user_id = auth.uid() 
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_currency_rates_updated_at BEFORE UPDATE ON currency_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE countries IS 'Reference table for supported countries';
COMMENT ON TABLE regions IS 'Reference table for regions/states within countries';
COMMENT ON TABLE currency_rates IS 'Exchange rates for multi-currency support';
COMMENT ON COLUMN stock_locations.country IS 'Country name where location is based';
COMMENT ON COLUMN stock_locations.country_code IS 'ISO 3166-1 alpha-3 country code';
COMMENT ON COLUMN stock_locations.currency IS 'Default currency for this location';
COMMENT ON COLUMN stock_locations.timezone IS 'Timezone for this location (e.g., America/New_York)';

