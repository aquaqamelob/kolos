'use server';

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { Index } from '@upstash/vector';
import Tesseract from "tesseract.js";
import mammoth from "mammoth";

import { extractText, getDocumentProxy } from 'unpdf';
import { getSession } from '~/server/auth';

export async function extractDocxText(buffer: Uint8Array) {
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return value.trim();
}

async function extractPdfText(buffer: Uint8Array) {
  const pdfDoc = await getDocumentProxy(buffer);
  const { totalPages, text } = await extractText(pdfDoc, { mergePages: false });
  console.log('Pages:', totalPages);
  return text;
}

export async function extractTxtText(buffer: Uint8Array) {
  const text = new TextDecoder("utf-8").decode(buffer);
  return text.trim();
}



export async function extractJpgText(buffer: Uint8Array) {
  const { data } = await Tesseract.recognize(Buffer.from(buffer), "eng");
  return data.text.trim();
}



export async function extractTextFromFile(buffer: Uint8Array, mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return extractPdfText(buffer);
    case "text/plain":
      return extractTxtText(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractDocxText(buffer);
    
    case "image/jpeg":
    case "image/png":
      return extractJpgText(buffer);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}




// 🪣 S3/Tebi setup
const s3Client = new S3Client({
  endpoint: 'https://s3.tebi.io',
  credentials: {
    accessKeyId: process.env.TEBI_ACCESS_KEY!,
    secretAccessKey: process.env.TEBI_SECRET_KEY!,
  },
  region: 'global',
});

const BUCKET = 'nanana-api';

// 🧠 Upstash Vector (you must have selected an embedding model in the Upstash UI)
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

/** Upload a PDF to S3 (Tebi) */
export const uploadPDFToS3 = async (file: File, folderPath: string): Promise<string> => {
  const key = `${folderPath}/${file.name}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: file.type,
    })
  );
  console.log(`✅ Uploaded: ${key}`);
  return key;
};

export const ragAnswer = async (query: string, userId: string) => {
  // 1️⃣ Wyszukiwanie podobnych dokumentów w vector DB
  const results = await index.query({
  data: query,
  topK: 5,
  includeMetadata: true,
});
  
  const userDocs = results.filter(m => m.metadata!.userId === userId);
  
  const context = userDocs.map(doc => doc.data).join('\n---\n');
  
  return context;

}


/** Parse PDF, extract text, chunk, and upsert into Upstash Vector */
export const embedPDFToUpstash = async (key: string) => {
  const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const obj = await s3Client.send(getCmd);
  const buffer = await obj.Body?.transformToByteArray();
  if (!buffer) throw new Error('Failed to download PDF from S3');

  
  // const text = await extractPdfText(buffer);
  const text = await extractPdfText(buffer);
  
  const session = await getSession();

  
  // Upstash will handle embedding if your index has an embedding model configured
  const upserts = text.map((chunk, i) =>
    index.upsert({
      id: `${key}::${i}`,
      data: chunk,
      metadata: { s3Key: key, chunk: i, userId: session?.user?.id },
    })
  );

  await Promise.all(upserts);
  console.log(`✅ Upserted ${text.length} pages for ${key}`);
};



export async function getSignedURL(key: string) {
  const putObjectCommand = new PutObjectCommand({
    Bucket: 'nanana-api',
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: 60,
  });
  return { success: { url: signedUrl } };
}

export async function getDownloadURL(key: string) {
  const getObjectCommand = new GetObjectCommand({
    Bucket: 'nanana-api',
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
    expiresIn: 60,
  });
  return { success: { url: signedUrl } };
}
