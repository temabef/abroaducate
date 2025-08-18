# Blog Photo Management Guide

## How to Handle Images in Your Blog System

### Option 1: Free Stock Photos (Recommended for Testing)
**Unsplash** - Free high-quality photos
- Go to [unsplash.com](https://unsplash.com)
- Search for relevant topics (e.g., "university", "students", "books")
- Right-click on image → "Copy image address"
- Paste URL in the "Cover Image URL" field
- Example URLs:
  - `https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop`
  - `https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=400&fit=crop`

### Option 2: Upload to Supabase Storage (Best for Production)
**Using the Blog Editor**:
1. Write your blog post content
2. In the editor, drag and drop images directly
3. Or click the camera button (📷) to select files
4. Images are automatically uploaded to Supabase storage
5. The editor inserts the image markdown automatically

**Manual Upload**:
1. Go to your Supabase dashboard
2. Navigate to Storage → blog bucket
3. Upload images to the `images/` folder
4. Copy the public URL
5. Paste in "Cover Image URL" field

### Option 3: External Image Hosting
**Cloudinary, ImageKit, or similar**:
- Upload images to your preferred service
- Copy the optimized URL
- Paste in the "Cover Image URL" field

### Option 4: Your Own Server/CDN
- Upload images to your web server
- Use full URLs (e.g., `https://yourdomain.com/images/photo.jpg`)

## Image Best Practices

### Size and Format
- **Recommended size**: 800x400px for cover images
- **Format**: JPG for photos, PNG for graphics
- **File size**: Keep under 500KB for fast loading
- **Aspect ratio**: 2:1 (width:height) for consistency

### SEO and Accessibility
- Use descriptive file names
- Add alt text when using the editor
- Choose relevant images that match your content
- Optimize for fast loading

### URL Parameters for Unsplash
Add these parameters to Unsplash URLs for optimization:
- `?w=800&h=400&fit=crop` - Resize and crop to exact dimensions
- `?w=800&q=80` - Resize with quality control
- `?auto=format` - Automatic format optimization

## Sample Image URLs for Testing

### Education/University Theme:
```
https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop
https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=400&fit=crop
https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop
https://images.unsplash.com/photo-1523050854058-8df90110c9d1?w=800&h=400&fit=crop
https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop
```

### Study/Learning Theme:
```
https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop
https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=400&fit=crop
https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop
```

### Travel/International Theme:
```
https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop
https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop
```

## Quick Setup Instructions

1. **For immediate testing**: Use the Unsplash URLs provided above
2. **For production**: Set up Supabase storage and use the drag-and-drop editor
3. **For best performance**: Use a CDN service like Cloudinary

The blog system supports all these methods, so choose what works best for your workflow and budget!

