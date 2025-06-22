
-- Add status column to user_profiles table to track user approval status
ALTER TABLE public.user_profiles 
ADD COLUMN status text NOT NULL DEFAULT 'approved';

-- Add a check constraint to ensure only valid status values
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));
