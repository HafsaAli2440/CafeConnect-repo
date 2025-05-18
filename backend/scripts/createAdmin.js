import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env file
dotenv.config({ path: path.join(__dirname, '../database/.env') });

const createAdmin = async () => {
    try {
        // Connect to MongoDB with the correct database name
        await mongoose.connect('mongodb://127.0.0.1:27017/Cafe-Connect', {
            dbName: 'Cafe-Connect' // Specify the exact database name
        });

        // Define User Schema
        const userSchema = new mongoose.Schema({
            username: String,
            password: String,
            email: String,
            role: String,
            phoneNumber: String,
            createdAt: { type: Date, default: Date.now }
        });

        // Create User model
        const User = mongoose.model('User', userSchema);

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user data
        const adminData = {
            username: 'admin',
            password: hashedPassword,
            email: 'admin@cafeconnect.com',
            role: 'admin',
            phoneNumber: '1234567890'
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists');
        } else {
            // Create new admin user
            const admin = new User(adminData);
            await admin.save();
            console.log('Admin user created successfully');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the function
createAdmin(); 