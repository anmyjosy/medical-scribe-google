import { supabase } from '@/lib/supabaseClient';
import { PatientFile } from '@/types';

/**
 * Upload a file to Supabase storage for a specific patient
 */
const API_BASE_URL = '';

export const uploadPatientFile = async (
    patientId: string,
    file: File,
    recordId?: string
): Promise<PatientFile> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No authenticated user found');
        }

        // 1. Attempt to extract text content (Non-blocking usually, but we want it for sidecar)
        let extractedText = '';
        try {
            // Only try for PDF or DOCX
            if (file.type === 'application/pdf' || file.type.includes('wordprocessingml')) {
                console.log('Attempting text extraction for:', file.name);
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${API_BASE_URL}/api/extract-text`, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.text) {
                        extractedText = data.text;
                        console.log('Text extracted successfully:', extractedText.length, 'chars');
                    }
                } else {
                    console.warn('Text extraction failed:', await response.text());
                }
            }
        } catch (extractErr) {
            console.error('Text extraction error (continuing with upload):', extractErr);
        }

        // Create unique file path
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Folders
        const basePath = recordId
            ? `${user.id}/${patientId}/${recordId}`
            : `${user.id}/${patientId}`;

        const filePath = `${basePath}/${timestamp}-${sanitizedFileName}`;

        console.log('Uploading file to:', filePath);

        // 2. Upload original file
        const { error: uploadError } = await supabase.storage
            .from('patient-files')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error details:', uploadError);
            if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
                throw new Error(
                    'The "patient-files" bucket does not exist in Supabase. ' +
                    'Please create it in your Supabase Dashboard (Storage → Create bucket → Name: "patient-files" → Private). ' +
                    'Then run the SQL policies from SUPABASE_SETUP.sql file.'
                );
            }
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 3. If text extracted, upload sidecar .txt file
        if (extractedText) {
            const textFileName = `${timestamp}-${sanitizedFileName}.txt`;
            const textFilePath = `${basePath}/${textFileName}`;
            const textBlob = new Blob([extractedText], { type: 'text/plain' });

            console.log('Uploading sidecar text file to:', textFilePath);
            await supabase.storage
                .from('patient-files')
                .upload(textFilePath, textBlob);
        }

        // Get signed URL (valid for 1 year)
        const { data: urlData } = await supabase.storage
            .from('patient-files')
            .createSignedUrl(filePath, 3600 * 24 * 365);

        if (!urlData?.signedUrl) {
            throw new Error('Failed to generate signed URL');
        }

        console.log('File uploaded successfully');

        // Create file record
        const patientFile: PatientFile = {
            id: `${patientId}-${timestamp}`,
            patientId,
            recordId, // Add recordId to the returned object
            fileName: file.name,
            fileUrl: urlData.signedUrl,
            fileType: file.type || 'application/octet-stream',
            uploadedAt: new Date().toISOString(),
            fileSize: file.size,
        };

        return patientFile;
    } catch (error: any) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

/**
 * Delete a file from Supabase storage
 */
export const deletePatientFile = async (
    patientId: string,
    fileName: string,
    recordId?: string
): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No authenticated user found');
        }

        let folderPath = `${user.id}/${patientId}`;
        if (recordId) {
            folderPath = `${folderPath}/${recordId}`;
        }

        // List all files for this patient/record to find the matching one
        const { data: files, error: listError } = await supabase.storage
            .from('patient-files')
            .list(folderPath);

        if (listError) {
            throw new Error(`Failed to list files: ${listError.message}`);
        }

        // Find the file that matches the original filename
        const fileToDelete = files?.find(f => f.name.includes(fileName));

        if (!fileToDelete) {
            throw new Error('File not found');
        }

        const filePath = `${folderPath}/${fileToDelete.name}`;

        // Delete the file
        const { error: deleteError } = await supabase.storage
            .from('patient-files')
            .remove([filePath]);

        if (deleteError) {
            throw new Error(`Delete failed: ${deleteError.message}`);
        }
    } catch (error: any) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

/**
 * Get files for a specific consultation record
 */
export const getConsultationFiles = async (
    patientId: string,
    recordId: string
): Promise<PatientFile[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No authenticated user found');
        }

        const folderPath = `${user.id}/${patientId}/${recordId}`;

        // List all files in the consultation folder
        const { data: files, error: listError } = await supabase.storage
            .from('patient-files')
            .list(folderPath);

        if (listError) {
            console.error('Error listing files:', listError);
            return [];
        }

        if (!files || files.length === 0) {
            return [];
        }

        // Filter out sidecar text files (hidden from UI)
        const visibleFiles = files.filter(f => !f.name.endsWith('.pdf.txt') && !f.name.endsWith('.docx.txt') && !f.name.endsWith('.doc.txt'));

        // Get signed URLs and create PatientFile objects
        const patientFiles: PatientFile[] = await Promise.all(
            visibleFiles.map(async (file) => {
                const filePath = `${folderPath}/${file.name}`;

                // Get signed URL
                const { data: urlData } = await supabase.storage
                    .from('patient-files')
                    .createSignedUrl(filePath, 3600 * 24 * 365);

                // Extract original filename (remove timestamp prefix)
                const originalFileName = file.name.replace(/^\d+-/, '');

                return {
                    id: `${patientId}-${recordId}-${file.name}`,
                    patientId,
                    recordId,
                    fileName: originalFileName,
                    fileUrl: urlData?.signedUrl || '',
                    fileType: file.metadata?.mimetype || 'application/octet-stream',
                    uploadedAt: file.created_at || new Date().toISOString(),
                    fileSize: file.metadata?.size || 0,
                };
            })
        );

        return patientFiles;
    } catch (error: any) {
        console.error('Error getting consultation files:', error);
        return [];
    }
};

/**
 * Get all files for a specific patient (Legacy support / Root files)
 */
export const getPatientFiles = async (
    patientId: string
): Promise<PatientFile[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No authenticated user found');
        }

        const folderPath = `${user.id}/${patientId}`;

        // List all files in the patient's folder
        const { data: files, error: listError } = await supabase.storage
            .from('patient-files')
            .list(folderPath);

        if (listError) {
            console.error('Error listing files:', listError);
            return [];
        }

        if (!files || files.length === 0) {
            return [];
        }

        // Filter out folders (which don't have metadata usually, or we can check names)
        // This prevents the new recordId folders from appearing as files
        const fileObjects = files.filter(f => f.metadata !== null);

        // Filter out sidecar text files (hidden from UI)
        const visibleFiles = fileObjects.filter(f => !f.name.endsWith('.pdf.txt') && !f.name.endsWith('.docx.txt') && !f.name.endsWith('.doc.txt'));

        // Get signed URLs and create PatientFile objects
        const patientFiles: PatientFile[] = await Promise.all(
            visibleFiles.map(async (file) => {
                const filePath = `${folderPath}/${file.name}`;

                // Get signed URL
                const { data: urlData } = await supabase.storage
                    .from('patient-files')
                    .createSignedUrl(filePath, 3600 * 24 * 365);

                // Extract original filename (remove timestamp prefix)
                const originalFileName = file.name.replace(/^\d+-/, '');

                return {
                    id: `${patientId}-${file.name}`,
                    patientId,
                    fileName: originalFileName,
                    fileUrl: urlData?.signedUrl || '',
                    fileType: file.metadata?.mimetype || 'application/octet-stream',
                    uploadedAt: file.created_at || new Date().toISOString(),
                    fileSize: file.metadata?.size || 0,
                };
            })
        );

        return patientFiles;
    } catch (error: any) {
        console.error('Error getting patient files:', error);
        return [];
    }
};

/**
 * Fetch all extracted text context for a patient
 */
export const getPatientFileContext = async (patientId: string, recordId?: string): Promise<string> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return '';

        const pathsToCheck = [`${user.id}/${patientId}`];
        if (recordId) {
            pathsToCheck.push(`${user.id}/${patientId}/${recordId}`);
        }

        // List all files at root level of patient folder
        // List all files from all relevant paths
        const allFiles: any[] = [];

        for (const path of pathsToCheck) {
            const { data: files, error: listError } = await supabase.storage
                .from('patient-files')
                .list(path);

            if (!listError && files) {
                // Add full path to file object for downloading later
                const filesWithPaths = files.map(f => ({ ...f, fullPath: `${path}/${f.name}` }));
                allFiles.push(...filesWithPaths);
            }
        }

        if (allFiles.length === 0) return '';

        // Filter for .txt sidecar files
        const textFiles = allFiles.filter(f => f.name.endsWith('.txt'));

        if (textFiles.length === 0) return '';

        console.log(`Found ${textFiles.length} text context files for patient ${patientId}`);

        // Fetch content for each
        const texts = await Promise.all(textFiles.map(async (f) => {
            const { data, error } = await supabase.storage
                .from('patient-files')
                .download(f.fullPath);

            if (error || !data) {
                console.error(`Failed to download context file ${f.fullPath}:`, error);
                return '';
            }

            return await data.text();
        }));

        return texts.join('\n\n');

    } catch (error) {
        console.error('Error fetching patient file context:', error);
        return '';
    }
};
