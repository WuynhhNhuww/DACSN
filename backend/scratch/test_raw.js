const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config({ path: path.join(__dirname, "../.env") });

const testRaw = async () => {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("Raw Success:", response.data);
    } catch (error) {
        console.error("Raw Error Status:", error.response?.status);
        console.error("Raw Error Data:", JSON.stringify(error.response?.data, null, 2));
    }
};

testRaw();
