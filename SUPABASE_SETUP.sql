-- =====================================================
-- Supabase Storage Setup for Patient Files
-- =====================================================
-- This script sets up the patient-files bucket and policies
-- Run this in your Supabase SQL Editor

-- Step 1: Create the patient-files bucket (if not exists)
-- Note: You need to create this bucket manually in the Supabase Dashboard
-- Go to: Storage → Create a new bucket → Name it "patient-files" → Set to Private

-- Step 2: Create storage policies for the patient-files bucket

-- Policy 1: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own patient files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'patient-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow authenticated users to read files from their own folder
CREATE POLICY "Users can read their own patient files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'patient-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow authenticated users to delete files from their own folder
CREATE POLICY "Users can delete their own patient files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'patient-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow authenticated users to update files in their own folder
CREATE POLICY "Users can update their own patient files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'patient-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- Manual Steps Required:
-- =====================================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create a new bucket"
-- 3. Name: "patient-files"
-- 4. Set to: Private (not public)
-- 5. Click "Create bucket"
-- 6. Then run this SQL script in the SQL Editor
-- =====================================================
