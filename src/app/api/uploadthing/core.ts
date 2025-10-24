import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  // Workspace file uploader
  workspaceFileUploader: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    pdf: { maxFileSize: "8MB", maxFileCount: 3 },
    text: { maxFileSize: "2MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) throw new Error("Unauthorized");
      
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (!user) throw new Error("User not found");
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId };
    }),
    
  // Task file uploader  
  taskFileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 3 },
    pdf: { maxFileSize: "8MB", maxFileCount: 2 },
    text: { maxFileSize: "2MB", maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) throw new Error("Unauthorized");
      
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (!user) throw new Error("User not found");
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Task file upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;