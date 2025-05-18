import User from '../model/User.js';  // Note the .js extension
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // You'll need to install this: npm install jsonwebtoken
import multer from 'multer'; // You'll need to install this: npm install multer
import path from 'path';

export const userController = {
    // Create a new user
    async createUser(req, res) {
      try {
          debugger
            const { username, password, role, email,phoneNumber } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [{ username }, { email }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'Username or email already exists' 
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const user = new User({
                username,
                password: hashedPassword,
                role,
                email,phoneNumber
            });

            await user.save();

            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    phoneNumber: user.phoneNumber
                }
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error creating user',
                error: error.message 
            });
        }
    },

    // Get user by ID
    async getUserById(req, res) {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching user',
                error: error.message 
            });
        }
    },

    // Get all users
    async getAllUsers(req, res) {
        try {
            const users = await User.find().select('-password');
            res.json(users);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching users',
                error: error.message 
            });
        }
    },

    // Update user
    async updateUser(req, res) {
        try {
            const { username, email, role } = req.body;
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { username, email, role },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                message: 'User updated successfully',
                user
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error updating user',
                error: error.message 
            });
        }
    },

    // Delete user
    async deleteUser(req, res) {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error deleting user',
                error: error.message 
            });
        }
    },

    // Login user
    async login(req, res) {
        try {
            const { username, password, role } = req.body;
            // Update to include all valid roles
            if (!['admin', 'customer', 'delivery', 'faculty', 'student'].includes(role.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role'
                });
            }

            // Find user by email and role
            const user = await User.findOne({ 
                email: username,
                role: role.toLowerCase()
            });

            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid credentials' 
                });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid credentials' 
                });
            }

            // Send success response with _id
            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,  // Make sure we're sending the MongoDB _id
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error during login',
                error: error.message 
            });
        }
    },

    // Update user profile
    async updateProfile(req, res) {
        try {
            const { userId } = req.params;
            const { username, email, phoneNumber, currentPassword, newPassword } = req.body;

            // Find the user
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Create an update object
            const updateData = {};
            
            // Only update fields that are provided
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (phoneNumber) updateData.phoneNumber = phoneNumber;

            // If changing password, verify current password first
            if (currentPassword && newPassword) {
                const isValidPassword = await bcrypt.compare(currentPassword, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({
                        success: false,
                        message: 'Current password is incorrect'
                    });
                }
                // Hash the new password
                updateData.password = await bcrypt.hash(newPassword, 10);
            }

            // Check if email already exists (if email is being updated)
            if (email && email !== user.email) {
                const emailExists = await User.findOne({ email, _id: { $ne: userId } });
                if (emailExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
            }

            // Check if username already exists (if username is being updated)
            if (username && username !== user.username) {
                const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
                if (usernameExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already in use'
                    });
                }
            }

            // Update the user
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            ).select('-password');

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser
            });

        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating profile',
                error: error.message
            });
        }
    },

    // Update profile picture
    async updateProfilePicture(req, res) {
        try {
            const { userId } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }

            // Update the imageUrl to not include 'api'
            const imageUrl = `/uploads/profile/${req.file.filename}`;
            console.log('Saving image URL:', imageUrl); // Debug log

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePicture: imageUrl },
                { new: true }
            ).select('-password');

            res.status(200).json({
                success: true,
                message: 'Profile picture updated successfully',
                user: updatedUser
            });

        } catch (error) {
            console.error('Profile picture update error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating profile picture',
                error: error.message
            });
        }
    }
};

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/profile/'); // Make sure this path exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'));
        }
    }
});