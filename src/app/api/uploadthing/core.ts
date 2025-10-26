import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  // File uploader for workspace files
  workspaceFileUploader: f({ 
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
    audio: { maxFileSize: "16MB", maxFileCount: 10 },
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    text: { maxFileSize: "4MB", maxFileCount: 20 },
    blob: { maxFileSize: "32MB", maxFileCount: 10 }
  })
    .middleware(async ({ req }) => {
      // Authenticate user
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }
 
      return { userId: session.user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
    
  // Task file uploader (for task attachments)
  taskFileUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 3 },
    text: { maxFileSize: "2MB", maxFileCount: 10 },
    blob: { maxFileSize: "16MB", maxFileCount: 5 }
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }
 
      return { userId: session.user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Task file upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;