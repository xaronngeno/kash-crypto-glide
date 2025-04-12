
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FileUploadOptions {
  bucket?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    bucket = 'documents', 
    maxSize = 50, // 50MB default
    allowedTypes = ['.zip', 'application/zip']
  } = options;

  const uploadFile = async (file: File) => {
    // Validate file type and size
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only zip files are allowed.',
        variant: 'destructive'
      });
      return null;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: `File must be smaller than ${maxSize}MB.`,
        variant: 'destructive'
      });
      return null;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      toast({
        title: 'Upload Successful',
        description: 'Your zip file has been uploaded.',
      });

      return data;
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return { uploadFile, isUploading, uploadProgress };
};
