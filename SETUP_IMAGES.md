# Image Upload Setup

## Cloudinary Configuration

1. Sign up for a free Cloudinary account at https://cloudinary.com
2. Get your credentials from the Cloudinary dashboard:
   - Cloud name
   - API Key  
   - API Secret

3. Update your `.env` file with your Cloudinary credentials:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## Features

- **Image Storage**: Images are stored in Cloudinary cloud storage
- **Automatic Optimization**: Images are automatically optimized for web
- **Resizing**: Profile images are resized to 200x200 pixels
- **Format Conversion**: Images are converted to optimal formats
- **Security**: Only authenticated users can upload images

## API Endpoint

`POST /api/upload/image`

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Body:** `multipart/form-data`
- `image`: Image file (max 5MB, only image formats)

**Response:**
```json
{
  "url": "https://cloudinary.com/...",
  "publicId": "reel-app/avatars/..."
}
```

## Mobile App Integration

The mobile app uses `expo-image-picker` to:
1. Request camera roll permissions
2. Let users select/crop images
3. Upload to the backend
4. Update profile avatar URL

## Error Handling

- File size limit: 5MB
- Supported formats: JPG, PNG, GIF, WebP
- Authentication required
- Network errors handled gracefully
