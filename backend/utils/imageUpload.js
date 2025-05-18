import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadImage = async (base64Image) => {
    try {
        // Extract image data and type from base64 string
        const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 string');
        }

        const imageType = matches[1];
        const imageData = matches[2];
        const extension = imageType.split('/')[1];
        
        // Generate unique filename
        const fileName = `${Date.now()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        // Save the file
        fs.writeFileSync(filePath, imageData, 'base64');

        // Return the URL path that can be accessed from the frontend
        return `/uploads/${fileName}`;
    } catch (error) {
        console.error('Error saving image:', error);
        throw new Error('Failed to save image');
    }
}; 