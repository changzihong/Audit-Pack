# File Storage Setup Instructions

## Step 1: Run the SQL Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add file_urls column to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS file_urls TEXT[];
```

## Step 2: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Name it: `request-files`
4. **IMPORTANT**: Set it to **Private** (not public) for security
5. Click **"Create bucket"**

## Step 3: Set Up Storage Policies

Go to **Storage** → **Policies** → Select `request-files` bucket

### Policy 1: Allow Authenticated Uploads
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-files');
```

### Policy 2: Allow Authenticated Downloads
```sql
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'request-files');
```

### Policy 3: Allow Users to Delete Own Files
```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'request-files' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Step 4: Test the Feature

1. **Reload your app**
2. **Create a new request**
3. **Upload an image/file** (receipt, invoice, etc.)
4. **Run AI Analysis** - it will analyze the uploaded image content
5. **Submit the request**
6. **View the request** as admin/manager - you should see the uploaded files displayed

## Features Now Available:

✅ **File Upload**: Employees can upload receipts, invoices, and documents
✅ **AI Vision Analysis**: AI reads and verifies uploaded receipt content
✅ **File Display**: Admins/Managers can view uploaded files in request details
✅ **Image Preview**: Images show thumbnails, other files show file icons
✅ **Click to View**: Click any file to open it in a new tab
✅ **Secure Storage**: Files are stored privately in Supabase Storage

## Troubleshooting:

- **"Failed to upload" error**: Check that the bucket name is exactly `request-files`
- **"Access denied" error**: Verify the storage policies are created correctly
- **Files not showing**: Make sure you ran the SQL migration to add `file_urls` column
