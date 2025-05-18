import { ImageSourcePropType } from 'react-native';

export interface Category {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

// Base MenuItem interface for backend data
export interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string | Category;
    image: string;  // URL string from backend
    isAvailable: boolean;
    createdAt: string;
}

// Extended interface for frontend use with proper image type
export interface MenuItemWithImage extends Omit<MenuItem, 'image'> {
    image: ImageSourcePropType;
} 
