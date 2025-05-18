import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  orderItems: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  estimatedTime: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['COD', 'STRIPE'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  customerDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    location: {
        coordinates: {
            type: [Number],  // [longitude, latitude]
            required: true
        },
        address: String
    }
  },
  stripeSessionId: { type: String },
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);