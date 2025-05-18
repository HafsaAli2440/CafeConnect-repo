import { Order } from "../model/OrderModel.js";
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51RAzPYPu5kyawoOkj3OTI0xuCu4pbPCQbUrbp02jPlhANYFvBUHfVoaioozzHoHzvvxTWCwBlQEJqxnbla0JgJcw001rIWCX6i');
// gateway initialize
//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const currency = 'pkr';
const deliveryCharge = 10;


const menuData = [
    { name: "Plain Fries", price: 130, prepTime: 5 },
    { name: "Zinger Burger", price: 250, prepTime: 7 },
    { name: "Spaghetti", price: 300, prepTime: 10 },
    { name: "Chicken Roll Paratha", price: 400, prepTime: 7 },
    { name: "Club Sandwiches", price: 500, prepTime: 8 },
    { name: "Biryani", price: 300, prepTime: 5 },
    { name: "Bar B Q Platter", price: 800, prepTime: 20 },
];

export const getSimilarOrdersInQueue = async (orderItems) => {
    try {
        const pendingOrders = await Order.find({ status: { $ne: 'completed' } });
        let similarOrdersInQueue = 0;

        pendingOrders.forEach(order => {
            order.orderItems.forEach(orderItem => {
                orderItems.forEach(item => {
                    if (orderItem.name === item.name) {
                        similarOrdersInQueue += 1;
                    }
                });
            });
        });

        return similarOrdersInQueue;
    } catch (error) {
        console.error("Error fetching similar orders:", error);
        return 0;
    }
};

export const estimatePreparationTime = (
    orderItems,
    availableLabor,
    similarOrdersInQueue,
    peakHours = false,
    specialRequests = false
) => {
    let totalTime = 0;

    orderItems.forEach(item => {
        const menuItem = menuData.find(menu => menu.name === item.name);
        if (menuItem) {
            let itemPrepTime = menuItem.prepTime * item.quantity;

            // Apply batch preparation efficiency
            if (item.quantity > 1) {
                itemPrepTime *= Math.max(0.6, 1 - 0.2 * Math.log10(item.quantity)); // Diminishing reductions for larger quantities
            }

            // Add time for special requests
            if (specialRequests) {
                itemPrepTime += 1; // Increment by 1 minute per item for special requests
            }

            totalTime += itemPrepTime;
        }
    });

    // Adjust for labor availability
    const laborFactor = Math.max(0.5, availableLabor); // Avoid penalizing too harshly for minor shortages
    totalTime /= laborFactor; // Scale time based on labor

    // Adjust for similar orders in queue (diminishing returns)
    totalTime += Math.min(similarOrdersInQueue * 2, 10); // Cap adjustment at 10 minutes

    // Adjust for peak hours
    if (peakHours) {
        totalTime *= 1.1; // Add 10% to total time during peak hours
    }

    // Dynamic capping based on order complexity
    const maxTime = 20 + Math.min(orderItems.length * 5, 15); // Base max is 20, add up to 15 mins for complex orders
    // totalTime = Math.max(10, totalTime); // Ensure at least 10 minutes
    // totalTime = Math.min(maxTime, totalTime); // Dynamically cap max time

    return Math.round(totalTime);
};

export const createOrder = async (req, res) => {
    try {
        const { userId, orderItems, totalPrice, paymentMethod, customerDetails } = req.body;
        
        // Validate required fields
        if (!userId || !orderItems || !totalPrice || !paymentMethod || !customerDetails) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const availableLabor = 0.8;
        const similarOrdersInQueue = await getSimilarOrdersInQueue(orderItems);
        const estimatedTime = estimatePreparationTime(orderItems, availableLabor, similarOrdersInQueue);

        const orderData = {
            userId,
            orderItems,
            totalPrice,
            estimatedTime,
            paymentMethod,
            customerDetails,
            status: 'pending',
            paymentStatus: 'pending'
        };

        if (paymentMethod === 'COD') {
            const newOrder = await Order.create(orderData);
            return res.status(201).json({
                success: true,
                order: newOrder,
                message: "Order placed successfully"
            });
        } else if (paymentMethod === 'STRIPE') {
            // Create a Payment Intent instead of a Checkout Session
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalPrice * 100), // Convert to cents
                currency: 'pkr',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    userId: userId.toString(),
                },
            });

            // Create order with payment intent ID
            orderData.stripePaymentIntentId = paymentIntent.id;
            const newOrder = await Order.create(orderData);

            return res.status(200).json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                orderId: newOrder._id
            });
        }
    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Update order payment status
        await Order.findOneAndUpdate(
            { stripeSessionId: session.id },
            { 
                paymentStatus: 'paid',
                status: 'processing'
            }
        );
    }

    res.json({ received: true });
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            orders: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Fetching order:', orderId);
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error in getOrderById:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};







// Placing orders using COD Method
export const placeOrder = async (req,res) => {
    
    try {
        
        const { userId, items, amount, address} = req.body;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true,message:"Order Placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

};

// Placing orders using Stripe Method
export const placeOrderStripe = async (req,res) => {
    try {
        
        const { userId, items, amount, address} = req.body
        const { origin } = req.headers;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Stripe",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency:currency,
                product_data: {
                    name:item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency:currency,
                product_data: {
                    name:'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({success:true,session_url:session.url});

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
};

// Verify Stripe 
export const verifyStripe = async (req,res) => {

    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

};

// Add this new function
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Only allow cancellation of pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Only pending orders can be cancelled"
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add this new function
export const getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            status: order.status,
            estimatedTime: order.estimatedTime
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Fetching orders for userId:', userId); // Debug log

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 });
        
        console.log('Found orders:', orders); // Debug log

        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error in getUserOrders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('Generating revenue report from:', startDate, 'to:', endDate);

        // Create date objects from the strings
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Query orders with confirmed status (completed or delivered)
        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end },
            status: { $in: ['completed', 'delivered'] }, // Only count completed/delivered orders
          
        });

        console.log('Found orders:', orders); // Debug log

        // Calculate revenue metrics
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + (order.totalPrice || 0); // Handle possible null values
        }, 0);
        
        // Group orders by payment method with error handling
        const paymentMethodStats = orders.reduce((acc, order) => {
            const method = order.paymentMethod || 'unknown';
            if (!acc[method]) {
                acc[method] = {
                    count: 0,
                    total: 0
                };
            }
            acc[method].count += 1;
            acc[method].total += order.totalPrice || 0;
            return acc;
        }, {});

        // Calculate daily revenue for confirmed orders
        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $in: ['completed', 'delivered'] },
                   
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalPrice" },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        console.log('Revenue report data:', { // Debug log
            totalRevenue,
            totalOrders,
            averageOrderValue
        });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                paymentMethodStats,
                dailyRevenue,
                dateRange: {
                    start: start.toISOString(),
                    end: end.toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Error generating revenue report:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

