-- Ensure end time is always after start time for appointments
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_end_time_after_start;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_end_time_after_start CHECK (end_time > start_time);
