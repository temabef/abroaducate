-- Additional Temporary Email Domains to Block
-- Copy and paste this into your Supabase SQL Editor

INSERT INTO disposable_email_domains (domain, risk_level, blocked) VALUES
-- More comprehensive list of temp email services
('guerrillamailblock.com', 'high', true),
('guerrillamail.biz', 'high', true),
('guerrillamail.de', 'high', true),
('pokemail.net', 'high', true),
('tmail.ws', 'high', true),
('mytrashmail.com', 'high', true),
('trashmail.com', 'high', true),
('emailondeck.com', 'high', true),
('spamgourmet.com', 'high', true),
('mailnesia.com', 'high', true),
('fakeinbox.com', 'high', true),
('0-mail.com', 'high', true),
('33mail.com', 'high', true),
('20minutemail.com', 'high', true),
('incognitomail.org', 'high', true),
('anonymbox.com', 'high', true),
('deadaddress.com', 'high', true),
('mailcatch.com', 'high', true),
('maildu.de', 'high', true),
('rcpt.at', 'high', true),
('cool.fr.nf', 'high', true),
('meltmail.com', 'high', true),
('mintemail.com', 'high', true),
('mytempemail.com', 'high', true),
('tempemail.com', 'high', true),
('tempemail.net', 'high', true),
('tempymail.com', 'high', true),
('mailexpire.com', 'high', true),
('zoemail.org', 'high', true),
('mailzilla.com', 'high', true),
('spam4.me', 'high', true),
('mailmetrash.com', 'high', true),
('nomail.xl.cx', 'high', true),
('mailmoat.com', 'high', true),
('jetable.org', 'high', true),
('wegwerfmail.de', 'high', true),
('wegwerfmail.net', 'high', true),
('wegwerfmail.org', 'high', true),
('dispostable.com', 'high', true),
('disposeamail.com', 'high', true),
('disposable-email.ml', 'high', true),
('getnada.com', 'high', true),
('inboxkitten.com', 'high', true),
('tempinbox.com', 'high', true),
-- Popular but questionable services
('mailbox.org', 'medium', false), -- Legitimate but sometimes used for temp
('cock.li', 'high', true), -- Often used for temporary purposes
('tfwno.gf', 'high', true),
('dicksinhisan.us', 'high', true),
('horsefucker.org', 'high', true),
-- Common typos that might be temp services
('gmial.com', 'high', true),
('yahooo.com', 'high', true),
('hotmial.com', 'high', true),
('outlok.com', 'high', true),
('outloo.com', 'high', true)
ON CONFLICT (domain) DO UPDATE SET
    risk_level = EXCLUDED.risk_level,
    blocked = EXCLUDED.blocked;

-- Also add more academic domains for better recognition
INSERT INTO academic_email_domains (domain, institution_name, country, bonus_tier) VALUES
-- More elite universities
('caltech.edu', 'California Institute of Technology', 'United States', 'elite'),
('princeton.edu', 'Princeton University', 'United States', 'elite'),
('yale.edu', 'Yale University', 'United States', 'elite'),
('columbia.edu', 'Columbia University', 'United States', 'elite'),
('chicago.edu', 'University of Chicago', 'United States', 'elite'),
('berkeley.edu', 'UC Berkeley', 'United States', 'premium'),
('ucla.edu', 'UCLA', 'United States', 'premium'),
('cornell.edu', 'Cornell University', 'United States', 'premium'),
('upenn.edu', 'University of Pennsylvania', 'United States', 'premium'),
('brown.edu', 'Brown University', 'United States', 'premium'),
('dartmouth.edu', 'Dartmouth College', 'United States', 'premium'),
('duke.edu', 'Duke University', 'United States', 'premium'),
('northwestern.edu', 'Northwestern University', 'United States', 'premium'),
-- UK Universities
('imperial.ac.uk', 'Imperial College London', 'United Kingdom', 'elite'),
('lse.ac.uk', 'London School of Economics', 'United Kingdom', 'elite'),
('ucl.ac.uk', 'University College London', 'United Kingdom', 'premium'),
('kcl.ac.uk', 'King''s College London', 'United Kingdom', 'premium'),
('ed.ac.uk', 'University of Edinburgh', 'United Kingdom', 'premium'),
('manchester.ac.uk', 'University of Manchester', 'United Kingdom', 'premium'),
-- Canadian Universities
('utoronto.ca', 'University of Toronto', 'Canada', 'premium'),
('ubc.ca', 'University of British Columbia', 'Canada', 'premium'),
('mcgill.ca', 'McGill University', 'Canada', 'premium'),
-- Australian Universities
('anu.edu.au', 'Australian National University', 'Australia', 'premium'),
('sydney.edu.au', 'University of Sydney', 'Australia', 'premium'),
('melbourne.edu.au', 'University of Melbourne', 'Australia', 'premium'),
-- European Universities
('ethz.ch', 'ETH Zurich', 'Switzerland', 'elite'),
('epfl.ch', 'EPFL', 'Switzerland', 'premium'),
('ku.dk', 'University of Copenhagen', 'Denmark', 'premium'),
('ki.se', 'Karolinska Institute', 'Sweden', 'premium')
ON CONFLICT (domain) DO UPDATE SET
    institution_name = EXCLUDED.institution_name,
    country = EXCLUDED.country,
    bonus_tier = EXCLUDED.bonus_tier; 