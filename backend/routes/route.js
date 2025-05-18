import { Router } from "express";
import { userController, upload } from "../controller/userController.js";
import { categoryController } from "../controller/categoryController.js";
import { menuItemController } from "../controller/menuItemController.js";
//import { newOrder, getAllOrders, updateOrderStatus, getOrderDetails,createPaymentIntent } from "../controller/OrderController.js";


import {
    createOrder,
    getOrderById,
    getOrderStatus,
    cancelOrder,
    handleStripeWebhook,
    getAllOrders,
    updateOrderStatus,
    getOrderDetails,
    placeOrder,
    placeOrderStripe,
    verifyStripe,
    getUserOrders,
    getRevenueReport
} from '../controller/OrderController.js';



export const router = new Router();

router.get('/',(req,res)=>{
    res.send("helo there")
})

// router.get('/orders', getAllOrders);
// router.get('/orders/:id', getOrderById);
// router.put('/orders/:id', updateOrder);
// router.delete('/orders/:id', deleteOrder);


router.post('/createuser', userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/login', userController.login);

// Category routes
router.post('/addcategories', categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Menu item routes
router.get('/menu-items', menuItemController.getAllMenuItems);
router.get('/menu-items/all', menuItemController.getAllMenuItemsAdmin);
router.post('/menu-items', menuItemController.createMenuItem);
router.put('/menu-items/:id', menuItemController.updateMenuItem);
router.delete('/menu-items/:id', menuItemController.deleteMenuItem);

//router.post('/new-order', newOrder);
//router.post('/new-order', orderController.newOrder);
router.get('/orders', getAllOrders);
router.post('/update-order-status', updateOrderStatus);
router.get('/orders/:orderId', getOrderDetails);
//router.post('/create-payment-intent',createPaymentIntent);

//router.post('/create', orderController.createOrder);
//router.post('/confirm-payment', orderController.confirmPayment);
//router.get('/:orderId', orderController.getOrderDetails);



router.post('/orders', createOrder);
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);
router.put('/orders/:orderId/status', updateOrderStatus);
router.get('/orders/:orderId/status', getOrderStatus);
router.post('/orders/:orderId/cancel', cancelOrder);
router.post('/webhook', handleStripeWebhook);
router.post('/place-order', placeOrder);
router.post('/place-order-stripe', placeOrderStripe);
router.post('/verify-stripe', verifyStripe);
router.get('/user-orders/:userId', getUserOrders);

// Profile routes
router.put('/users/:userId/profile', userController.updateProfile);
router.put('/users/:userId/profile-picture', upload.single('profilePicture'), userController.updateProfilePicture);

// Revenue report route
router.get('/revenue-report', getRevenueReport);

