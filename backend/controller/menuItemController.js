import MenuItem from '../model/MenuItem.js';
import { uploadImage } from '../utils/imageUpload.js';

export const menuItemController = {
    // Create new menu item
    async createMenuItem(req, res) {
        try {
            const { name, description, price, category, image } = req.body;

            // Upload image and get the path
            let imagePath;
            try {
                imagePath = await uploadImage(image);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading image',
                    error: error.message
                });
            }

            const menuItem = new MenuItem({
                name,
                description,
                price,
                category,
                image: imagePath
            });

            await menuItem.save();

            res.status(201).json({
                success: true,
                message: 'Menu item created successfully',
                menuItem
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating menu item',
                error: error.message
            });
        }
    },

    // Get all menu items (only available ones - for user menu)
    async getAllMenuItems(req, res) {
        try {
            const menuItems = await MenuItem.find({ isAvailable: true })
                .populate('category', 'name')
                .sort({ createdAt: -1 });
            
            res.status(200).json({
                success: true,
                menuItems
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching menu items',
                error: error.message
            });
        }
    },

    // Get all menu items including unavailable ones (for admin)
    async getAllMenuItemsAdmin(req, res) {
        try {
            const menuItems = await MenuItem.find({})
                .populate('category', 'name')
                .sort({ createdAt: -1 });
            
            res.status(200).json({
                success: true,
                menuItems
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching menu items',
                error: error.message
            });
        }
    },

    // Get menu items by category
    async getMenuItemsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const menuItems = await MenuItem.find({
                category: categoryId,
                isAvailable: true
            }).populate('category', 'name');

            res.status(200).json({
                success: true,
                menuItems
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching menu items',
                error: error.message
            });
        }
    },

    // Update menu item
    async updateMenuItem(req, res) {
        try {
            const { id } = req.params;
            const update = req.body;

            const menuItem = await MenuItem.findByIdAndUpdate(
                id,
                update,
                { new: true }
            ).populate('category', 'name');

            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Menu item updated successfully',
                menuItem
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating menu item',
                error: error.message
            });
        }
    },

    // Delete menu item (permanent deletion)
    async deleteMenuItem(req, res) {
        try {
            const { id } = req.params;
            const menuItem = await MenuItem.findByIdAndDelete(id);

            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Menu item deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting menu item',
                error: error.message
            });
        }
    }
}; 