const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const verifyAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const result = await User.updateMany(
            { isVerified: { $exists: false } }, // Or anyone who is false currently
            { $set: { isVerified: true } }
        );
        
        // Also update those who are explicitly false if they were created before now
        const result2 = await User.updateMany(
            { isVerified: false },
            { $set: { isVerified: true } }
        );

        console.log(`Updated ${result.modifiedCount + result2.modifiedCount} users to isVerified: true`);
        process.exit(0);
    } catch (error) {
        console.error("Error updating users:", error);
        process.exit(1);
    }
};

verifyAll();
