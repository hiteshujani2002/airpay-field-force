-- Create storage bucket for CPV PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('cpv-pdfs', 'cpv-pdfs', true);

-- Create RLS policies for CPV PDF storage
CREATE POLICY "Anyone can view CPV PDFs" ON storage.objects
FOR SELECT USING (bucket_id = 'cpv-pdfs');

CREATE POLICY "Authenticated users can upload CPV PDFs" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'cpv-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update CPV PDFs" ON storage.objects
FOR UPDATE USING (bucket_id = 'cpv-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete CPV PDFs" ON storage.objects
FOR DELETE USING (bucket_id = 'cpv-pdfs' AND auth.role() = 'authenticated');