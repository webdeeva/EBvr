# S3 Upload Debugging Guide

## How to Debug S3 Upload Issues

### 1. Open Browser Developer Tools

1. Press **F12** or right-click and select "Inspect"
2. Go to the **Console** tab
3. Clear the console
4. Try to upload a file
5. Look for error messages

### 2. Common Error Messages and Solutions

#### CORS Error
**Console Error:**
```
Access to XMLHttpRequest at 'https://eb-world-builder-assets.s3.us-east-2.amazonaws.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Go to AWS S3 Console
2. Select your bucket: `eb-world-builder-assets`
3. Go to "Permissions" tab
4. Scroll to "Cross-origin resource sharing (CORS)"
5. Add this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://your-production-domain.com",
            "https://your-netlify-domain.netlify.app"
        ],
        "ExposeHeaders": ["ETag", "x-amz-request-id", "x-amz-id-2"],
        "MaxAgeSeconds": 3000
    }
]
```

#### Access Denied Error
**Console Error:**
```
403 Forbidden
Access Denied
```

**Solution:**
1. Check IAM user permissions
2. Ensure the IAM user has this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::eb-world-builder-assets",
                "arn:aws:s3:::eb-world-builder-assets/*"
            ]
        }
    ]
}
```

3. Check bucket policy allows public read:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::eb-world-builder-assets/*"
        }
    ]
}
```

#### Invalid Credentials
**Console Error:**
```
The security token included in the request is invalid
InvalidAccessKeyId
```

**Solution:**
1. Verify AWS credentials in `src/config/aws.ts`
2. Check environment variables are set correctly
3. Ensure IAM user is active and keys are valid

### 3. Check Network Tab

1. Go to **Network** tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Try uploading again
4. Look for red (failed) requests
5. Click on failed request to see:
   - Status code
   - Response headers
   - Response body with error details

### 4. Enable Detailed Logging

The code now includes enhanced logging. Look for these in console:

- `[S3Upload] Initializing S3 client with config:` - Shows configuration
- `[S3Upload] Starting upload:` - Shows file details
- `[S3Upload] Progress: X%` - Shows upload progress
- `[S3Upload] Upload complete:` - Success message
- `[S3Upload] Upload error:` - Error details
- `[S3Upload] AWS SDK Error Metadata:` - AWS-specific error info

### 5. Test S3 Bucket Access

Test if your bucket is accessible:

1. Try accessing a test file directly:
   ```
   https://eb-world-builder-assets.s3.us-east-2.amazonaws.com/test.txt
   ```

2. Use AWS CLI to test credentials:
   ```bash
   aws s3 ls s3://eb-world-builder-assets --region us-east-2
   ```

### 6. Common Issues Checklist

- [ ] CORS is properly configured on S3 bucket
- [ ] Bucket policy allows public read access
- [ ] IAM user has correct permissions
- [ ] AWS credentials are valid and active
- [ ] Bucket name and region are correct
- [ ] File size is within limits
- [ ] File type is allowed
- [ ] Internet connection is stable
- [ ] No browser extensions blocking requests

### 7. Alternative: Use Presigned URLs

If direct upload continues to fail, consider using presigned URLs:
1. Create a backend endpoint that generates presigned URLs
2. Upload directly to the presigned URL from frontend
3. This avoids embedding AWS credentials in frontend

### 8. Security Note

**IMPORTANT**: The AWS credentials are currently exposed in the frontend code. For production:
1. Move credential handling to backend
2. Use temporary credentials via STS
3. Or use presigned URLs
4. Never commit real AWS credentials to version control

### 9. Testing Different File Types

Test with small files first:
- Environment: Small .glb file (<1MB)
- Skybox: Small .jpg image (<1MB)
- Content: Small image or audio file (<1MB)

If small files work but large files fail, it's likely a timeout or multipart upload issue.

### 10. Contact AWS Support

If all else fails:
1. Check AWS Service Health Dashboard
2. Contact AWS Support with:
   - Request ID from error
   - Bucket name
   - IAM user ARN
   - Error messages
   - Time of occurrence