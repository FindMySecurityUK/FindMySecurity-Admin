import { API_URL } from './path';

export async function uploadToS3({
  file,
  endpoint = 'file/upload',
}: {
  file: File;
  endpoint?: string;
}): Promise<{ fileUrl: string; signedUrl: string }> {
  try {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, '');

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    // Step 1: Get signed upload URL
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

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to get signed URL: ${errorText}`);
    }

    const { url } = await res.json();

    // Step 2: Upload the file to S3 using the signed URL
    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadRes.ok) {
      const uploadError = await uploadRes.text();
      throw new Error(`Failed to upload to S3: ${uploadError}`);
    }

    // Step 3: Return the file URL (without signed params)
    const fileUrl = url.split('?')[0];
    console.log('✅ S3 Upload Success:', fileUrl);

    return {
      fileUrl,
      signedUrl: url,
    };
  } catch (err) {
    console.error('❌ uploadToS3 error:', err);
    throw err;
  }
}







// import { API_URL } from './path';

// export async function uploadToS3({
//   file,
//   endpoint = 'file/upload',
// }: {
//   file: File;
//   endpoint?: string;
// }): Promise<{ fileUrl: string; signedUrl: string }> {
//   const token = localStorage.getItem("token")?.replace(/^"|"$/g, '');

//   const res = await fetch(`${API_URL}/${endpoint}`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({
//       fileName: file.name,
//       fileType: file.type,
//     }),
//   });

//   if (!res.ok) throw new Error('Failed to get signed URL');
//   const { url } = await res.json();

//   const uploadRes = await fetch(url, {
//     method: 'PUT',
//     body: file,
//     headers: {
//       'Content-Type': file.type,
//       Authorization: `Bearer ${token}`,

//     },
//   });

//   if (!uploadRes.ok) throw new Error('Failed to upload file to S3');

//   return {
//     fileUrl: url.split('?')[0],
//     signedUrl: url,
//   };
// }
