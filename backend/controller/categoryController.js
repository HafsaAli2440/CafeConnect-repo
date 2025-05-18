import Category from '../model/Category.js';

export const categoryController = {
    // Create new category
    async createCategory(req, res) {
        try {
            const { name, description } = req.body;

            // Check if category exists
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category already exists'
                });
            }

            // Create new category
            const category = new Category({
                name,
                description
            });

            await category.save();

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                category
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating category',
                error: error.message
            });
        }
    },

    // Get all categories
    async getAllCategories(req, res) {
        try {
            const categories = await Category.find({ isActive: true });
            res.status(200).json({
                success: true,
                categories
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching categories',
                error: error.message
            });
        }
    },

    // Update category
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const update = req.body;

            const category = await Category.findByIdAndUpdate(
                id,
                update,
                { new: true }
            );

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                category
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating category',
                error: error.message
            });
        }
    },

    // Delete category
    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const category = await Category.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting category',
                error: error.message
            });
        }
    }
}; 