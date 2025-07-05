import { API_URL } from './path';

export async function uploadToS3({
  file,
  endpoint = 'file/upload',
}: {
  file: File;
  endpoint?: string;
}): Promise<{ fileUrl: string; signedUrl: string }> {
  const token = localStorage.getItem("token")?.replace(/^"|"$/g, '');

  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
    }),
  });

  if (!res.ok) throw new Error('Failed to get signed URL');
  const { url } = await res.json();

  const uploadRes = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadRes.ok) throw new Error('Failed to upload file to S3');

  return {
    fileUrl: url.split('?')[0],
    signedUrl: url,
  };
}
