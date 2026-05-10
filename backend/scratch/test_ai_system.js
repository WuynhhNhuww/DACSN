const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function test() {
    try {
        console.log("API Key:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: "Hãy đóng vai là: Bạn là một trợ lý bán hàng chuyên nghiệp." }] },
                { role: "model", parts: [{ text: "Tôi đã hiểu. Tôi sẽ đóng vai đó." }] }
            ]
        });
        const result = await chat.sendMessage("Bạn là ai?");
        const response = await result.response;
        console.log("AI Response:", response.text());
    } catch (err) {
        console.error("AI Test Error:", err);
    }
}

test();
