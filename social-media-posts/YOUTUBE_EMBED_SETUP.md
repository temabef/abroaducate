# YouTube Video Embed Feature - Setup Guide

## What's Been Added

✅ **Database field:** `video_url` column added to scholarships table  
✅ **YouTube component:** Responsive embed component that extracts video ID from various URL formats  
✅ **Scholarship page:** Video displays between "About" and "Scholarship Value" sections  
✅ **Admin form:** New "Video URL" field in scholarship admin panel  

---

## How to Use

### 1. Run the Database Migration

Execute this SQL in Supabase SQL Editor:

```sql
ALTER TABLE scholarships
ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN scholarships.video_url IS 'YouTube video URL or video ID for embedded video content on scholarship page';
```

### 2. Add Video to Chevening Scholarship

In the admin panel (`/admin/scholarships`):

1. Find and edit the Chevening scholarship
2. Scroll to "Video URL" field (right after Website URL)
3. Paste your YouTube URL in ANY of these formats:
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - `VIDEO_ID` (just the 11-character ID)
4. Save

### 3. Result on Public Page

The video will appear on `/scholarships/chevening-scholarship` as a responsive 16:9 embed with rounded corners and shadow, between the "About" section and "Scholarship Value" section.

---

## Supported URL Formats

The component automatically extracts the video ID from:

- **Standard:** `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- **Short:** `https://youtu.be/dQw4w9WgXcQ`
- **Embed:** `https://www.youtube.com/embed/dQw4w9WgXcQ`
- **Bare ID:** `dQw4w9WgXcQ`

---

## Video Script Ready

✅ Video script created at `social-media-posts/CHEVENING_VIDEO_SCRIPT.md`

**Two versions:**
1. Full version (60-90 seconds) - comprehensive guide
2. Short version (30 seconds) - quick overview

**Key features:**
- No cliché phrases ("dream," "life-changing," etc.)
- Direct, actionable information
- Specific numbers and deadlines
- Practical tips for winning applications

---

## Next Steps

1. **Record the video** using the script
2. **Upload to YouTube** (your Abroaducate channel)
3. **Copy the video URL**
4. **Add to Chevening scholarship** via admin panel
5. **Test on the public page**

---

## Technical Details

**Component:** `src/lib/components/YouTubeEmbed.svelte`
- Responsive 16:9 aspect ratio
- Rounded corners with shadow
- Validates URL format
- Shows error message for invalid URLs

**Database:** `scholarships.video_url` (TEXT, nullable)

**Admin Form:** New field in scholarship edit form with helper text

**Display:** Only shows when `video_url` is not null/empty
