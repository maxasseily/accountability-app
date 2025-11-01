-- Create the daily-photos storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'daily-photos',
  'daily-photos',
  true,  -- public bucket for easy access
  5242880,  -- 5MB file size limit
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']  -- only allow image files
)
on conflict (id) do nothing;
