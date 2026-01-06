# Setting Up File Upload Feature

## Quick Setup Guide

The file upload feature requires a Supabase storage bucket. Follow these steps:

### Step 1: Create the Storage Bucket

1. Open your **Supabase Dashboard**
2. Navigate to **Storage** (in the left sidebar)
3. Click **"Create a new bucket"** or **"New Bucket"**
4. Enter bucket name: `patient_files`
5. Set bucket to **Private** (not public)
6. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `SUPABASE_SETUP.sql` from your project
3. Copy and paste the SQL policies into the SQL Editor
4. Click **"Run"** to execute the policies

### Step 3: Test the Feature

1. Refresh your MedScribe AI application
2. Select a patient from the registry
3. In the sidebar, click **"Upload File"** (above Nationality)
4. Select a file to upload
5. The file should upload successfully
6. Navigate to **Key Insights** tab to see the uploaded file

---

## Troubleshooting

### "Failed to upload file" Error

**Cause:** The `patient_files` bucket doesn't exist in Supabase.

**Solution:** Follow Step 1 above to create the bucket.

### "Permission denied" Error

**Cause:** Storage policies are not set up correctly.

**Solution:** Follow Step 2 above to set up the policies.

### Files not appearing after upload

**Cause:** The bucket might be set to public instead of private, or policies are incorrect.

**Solution:** 
1. Check that the bucket is set to **Private**
2. Re-run the SQL policies from `SUPABASE_SETUP.sql`

---

## Supported File Types

- **Documents:** PDF, DOC, DOCX, TXT
- **Images:** PNG, JPG, JPEG

Files are stored securely with user-specific access control.
