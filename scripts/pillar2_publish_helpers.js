import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/HP ENVY X360/abroaducate/.env' });

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export async function uploadToImgBB(filePath, customName) {
  console.log(`Uploading ${path.basename(filePath)} to ImgBB...`);
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');

  const formData = new URLSearchParams();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);
  if (customName) {
    formData.append('name', customName);
  }

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(`ImgBB API Error: ${json.error?.message || JSON.stringify(json)}`);
  }

  const uploadedUrl = json.data.url;
  console.log(`✅ Uploaded successfully -> ${uploadedUrl}`);
  return uploadedUrl;
}

export async function scheduleDraft(postData) {
  const { title, slug, excerpt, content, heroUrl, published_at } = postData;
  console.log(`Scheduling post: "${title}" for ${published_at}...`);

  const { data, error } = await supabase
    .from('blog_posts')
    .upsert({
      title,
      slug,
      excerpt,
      content,
      cover_image_url: heroUrl,
      status: 'published',
      published_at,
      author_user_id: '687651d2-af7b-46eb-84f0-a191047ea0cb',
      updated_at: new Date().toISOString()
    }, { onConflict: 'slug' })
    .select();

  if (error) {
    throw new Error(`Supabase Upsert Error for ${slug}: ${error.message}`);
  }

  console.log(`✅ Successfully scheduled: ${data[0].slug} for ${data[0].published_at}`);
  return data[0];
}
