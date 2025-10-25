"use client";

import { Heading, Subheading } from "~/components/ui/heading";
import { Strong, Text } from "~/components/ui/text";

import { api } from "~/trpc/react";
import { useSession } from "~/lib/auth-client"
import { embedPDFToUpstash, getSignedURL } from "./actions";

import { useRouter } from "next/navigation";

export default function AppPage() {

  const session = useSession();

  const pdf = api.pdfs.upload.useMutation();

  const router = useRouter();


  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const files = formData.getAll('files') as File[];

    for (const file of files) {
      console.log(file.name);

      
      const filePathInS3 =  `${session.data?.user.id}/${file.name}`

      console.log(filePathInS3);
        

      const signedUrlResult = await getSignedURL(filePathInS3);

      const url = signedUrlResult.success?.url;

      
      await pdf.mutateAsync({
        filename: file.name,
        s3Key: filePathInS3,
        contentType: file.type,
        size: file.size,
      })

      

      console.log(url);

      await fetch(url, {
        method: 'PUT',
        body: file,
      }).then(async () => {
        await embedPDFToUpstash(filePathInS3);
      });
    }

    router.refresh();


    
  };

  return (
    <div>
      
      <Heading>Dodaj pdfy, txt, docx pptx</Heading>
      <Subheading>yup yup</Subheading>
      <Text>if you know you know <Strong>yes</Strong></Text>



      <form onSubmit={handleFileUpload} className='mt-4 text-white gap-4'>
          <input type='file' name='files' multiple className="mr-4 rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"/>
          <button type='submit' className='rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20'>
            Dodaj pliki
          </button>

          
        </form>
    </div>
  )
}
