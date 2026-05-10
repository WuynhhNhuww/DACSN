const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config({ path: path.join(__dirname, "../.env") });

const listModels = async () => {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    try {
        const response = await axios.get(url);
        const models = response.data.models.map(m => m.name);
        console.log("Is gemini-2.0-flash available?", models.includes("models/gemini-2.0-flash"));
        console.log("Is gemini-1.5-flash available?", models.includes("models/gemini-1.5-flash"));
        console.log("All gemini models:", models.filter(m => m.includes("gemini")));
    } catch (error) {
        console.error("List Error Status:", error.response?.status);
        console.error("List Error Data:", JSON.stringify(error.response?.data, null, 2));
    }
};

listModels();
