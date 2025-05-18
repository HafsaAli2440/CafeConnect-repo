import { connect } from "mongoose";


export const connectDB = async() => {
    await connect(process.env.MONGO_URI, {
        dbName: "Cafe-Connect"
    })
        .then(() => {
            console.log("Database connected")
        })
        .catch((err) => {
            console.log('Error connecting:', err)
        })
}