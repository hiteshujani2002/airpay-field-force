-- Fix missing city data for Darshit Rupapara merchant
UPDATE cpv_merchant_status 
SET city = 'Mumbai' 
WHERE merchant_name = 'Darshit Rupapara' 
AND merchant_address = 'Dahisar East' 
AND state = 'Maharashtra' 
AND city IS NULL OR city = '';