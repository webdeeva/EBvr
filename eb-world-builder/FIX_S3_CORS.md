# Fix S3 CORS Configuration

The S3 upload is failing due to CORS issues with multipart uploads. Here's how to fix it:

## Update S3 Bucket CORS Configuration

1. Go to your AWS S3 Console
2. Select your bucket: `eb-world-builder-assets`
3. Go to the "Permissions" tab
4. Scroll down to "Cross-origin resource sharing (CORS)"
5. Click "Edit"
6. Replace with this configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:3002",
            "http://localhost:3009",
            "http://localhost:*",
            "https://your-production-domain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-request-id",
            "x-amz-id-2",
            "x-amz-server-side-encryption",
            "x-amz-version-id"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

## Important Notes:

1. **AllowedOrigins**: Make sure to include all ports you use for development
2. **ExposeHeaders**: These headers are needed for multipart uploads
3. **Production**: Replace `your-production-domain.com` with your actual domain

## Also Check Bucket Policy

Ensure your bucket policy allows public read access:

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

## Test After Updating

1. Save the CORS configuration
2. Wait a minute for changes to propagate
3. Try uploading again

The error with `?uploads=` parameter suggests the SDK is trying to initiate a multipart upload, which requires proper CORS headers.