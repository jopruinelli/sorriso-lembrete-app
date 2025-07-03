-- Add updated_by column to patients table
ALTER TABLE public.patients 
ADD COLUMN updated_by uuid;