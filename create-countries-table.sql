-- Create countries table for Portal Home Hub
-- This table provides country/region data for property listings

CREATE TABLE public.countries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    currency TEXT DEFAULT 'GYD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert common countries for Guyana market
INSERT INTO public.countries (id, name, code, status, currency) VALUES
('GY', 'Guyana', 'GY', 'active', 'GYD'),
('US', 'United States', 'US', 'active', 'USD'),
('CA', 'Canada', 'CA', 'active', 'CAD'),
('GB', 'United Kingdom', 'GB', 'active', 'GBP'),
('TT', 'Trinidad and Tobago', 'TT', 'active', 'TTD'),
('BR', 'Brazil', 'BR', 'active', 'BRL'),
('SR', 'Suriname', 'SR', 'active', 'SRD'),
('VE', 'Venezuela', 'VE', 'active', 'VES'),
('BB', 'Barbados', 'BB', 'active', 'BBD'),
('JM', 'Jamaica', 'JM', 'active', 'JMD');

-- Enable Row Level Security
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all authenticated users
CREATE POLICY "Allow read access to countries" ON public.countries
FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create policy to allow admin users to manage countries
CREATE POLICY "Allow admin users to manage countries" ON public.countries
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

-- Create index for better performance
CREATE INDEX idx_countries_status ON public.countries(status);
CREATE INDEX idx_countries_code ON public.countries(code);