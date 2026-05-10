const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/productModel");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
console.log("AI Controller initialized. Key present:", !!process.env.GEMINI_API_KEY);

// Cache đơn giản để tránh lỗi 429 (Rate Limit) khi gọi gợi ý quá nhiều
let recommendationCache = {
    data: null,
    lastFetched: 0
};

// 1. AI Chatbot Assistant
exports.chatWithAI = async (req, res) => {
    try {
        const { message, history = [], productId } = req.body;
        console.log("AI Chat Request - Message:", message, "ProductId:", productId);

        let systemPrompt = "Bạn là trợ lý mua sắm thông minh của WPN Store. Hãy trả lời thân thiện, hữu ích và ngắn gọn bằng tiếng Việt.";
        
        if (productId && productId.match(/^[0-9a-fA-F]{24}$/)) {
            const product = await Product.findById(productId);
            if (product) {
                systemPrompt += `\nNgười dùng đang xem sản phẩm: ${product.name}. 
                Mô tả: ${product.description}. 
                Giá: ${product.price}đ. 
                Tồn kho: ${product.stock}. 
                Hãy tư vấn dựa trên thông tin này.`;
            }
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Workaround cho systemInstruction vì một số model/quota gặp lỗi 503/429
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: "Hãy đóng vai là: " + systemPrompt }] },
                { role: "model", parts: [{ text: "Tôi đã hiểu. Tôi sẽ đóng vai trợ lý bán hàng chuyên nghiệp cho WPN Store và hỗ trợ bạn theo các quy tắc đã nêu." }] },
                ...history
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        let text = response.text();

        res.json({ text });
    } catch (error) {
        console.error("AI Chat Error Full Details:", error);
        res.status(500).json({ 
            message: "AI đang bận, vui lòng thử lại sau.",
            error: error.message 
        });
    }
};

// 2. AI Product Description Generator
exports.generateDescription = async (req, res) => {
    try {
        const { productName, category, attributes = "" } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `Bạn là một chuyên gia viết nội dung quảng cáo (Copywriter). 
        Hãy viết một đoạn mô tả sản phẩm thật hấp dẫn, chuyên nghiệp và tối ưu SEO cho sản phẩm sau:
        - Tên sản phẩm: ${productName}
        - Danh mục: ${category}
        - Thuộc tính bổ sung: ${attributes}
        Yêu cầu: Viết khoảng 100-200 từ, có các icon minh họa, nêu bật lợi ích của sản phẩm. Trình bày bằng Tiếng Việt.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Trích xuất mô tả (nếu AI có giải thích thêm)
        let cleanedText = text;
        if (text.includes("```")) {
            const match = text.match(/```(?:markdown|text)?([\s\S]*?)```/);
            if (match) cleanedText = match[1];
        }

        res.json({ description: cleanedText.trim() });
    } catch (error) {
        console.error("AI Generate Description Error Full Details:", error);
        res.status(500).json({ message: "Không thể tạo mô tả lúc này.", error: error.message });
    }
};

// 3. AI Smart Recommendations
exports.getRecommendations = async (req, res) => {
    try {
        const now = Date.now();
        // 1. Kiểm tra Cache (Hạn mức 10 phút)
        if (recommendationCache.data && (now - recommendationCache.lastFetched < 600000)) {
            console.log("AI Recommendation: Returning cached data to avoid rate limit.");
            return res.json(recommendationCache.data);
        }

        const { recentCategories = [], recentProductNames = [] } = req.body;

        // Lấy danh sách sản phẩm hiện có
        const products = await Product.find({ status: "approved", isDeleted: false })
            .select("name category price ratingAvg")
            .limit(50);

        if (products.length === 0) return res.json([]);

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const productListString = products.map(p => `ID:${p._id}|Name:${p.name}|Cat:${p.category}`).join("\n");

        const prompt = `Dựa trên sở thích của người dùng:
        - Danh mục đã xem: ${recentCategories.join(", ")}
        - Sản phẩm đã xem: ${recentProductNames.join(", ")}

        Hãy chọn ra 6 mã ID sản phẩm phù hợp nhất từ danh sách sau đây để gợi ý cho người dùng. 
        Chỉ trả về danh sách ID, cách nhau bởi dấu phẩy, không giải thích gì thêm.
        
        Danh sách sản phẩm:
        ${productListString}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const recommendedIds = (text.match(/[0-9a-fA-F]{24}/g) || [])
            .map(id => id.trim());

        let recommendedProducts = await Product.find({ _id: { $in: recommendedIds } });

        if (recommendedProducts.length < 6) {
            const extra = await Product.find({ 
                _id: { $nin: recommendedProducts.map(p => p._id) },
                status: "approved",
                isDeleted: false
            }).limit(6 - recommendedProducts.length);
            recommendedProducts = [...recommendedProducts, ...extra];
        }

        // 2. Lưu vào Cache trước khi trả về
        recommendationCache = {
            data: recommendedProducts,
            lastFetched: now
        };

        res.json(recommendedProducts);
    } catch (error) {
        console.error("AI Recommendation Error:", error.message);
        
        // Nếu bị lỗi 429 hoặc bất kỳ lỗi gì, trả về fallback ngay lập tức mà không crash
        const fallback = await Product.find({ status: "approved", isDeleted: false })
            .sort({ ratingAvg: -1 })
            .limit(6);
        res.json(fallback);
    }
};

// 4. AI Powered Search
exports.searchAI = async (req, res) => {
    try {
        const { query } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `Phân tích câu truy vấn tìm kiếm sản phẩm sau: "${query}"
        Hãy trả về một đối tượng JSON (chỉ JSON, không giải thích) chứa các trường:
        - name: (chuỗi search name)
        - category: (chuỗi danh mục nếu có: "Thời trang", "Điện tử", "Gia dụng", "Mỹ phẩm", "Thể thao", "Sách")
        - minPrice: (số)
        - maxPrice: (số)
        - sort: ("price_asc", "price_desc", "newest", "popular")
        
        Nếu không có thông tin nào, hãy để null. 
        Ví dụ: "tìm điện thoại dưới 10 triệu" -> {"name": "điện thoại", "maxPrice": 10000000}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        let jsonText = text;
        if (text.includes("```")) {
            const match = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
            if (match) jsonText = match[1];
        } else {
            // Thử tìm cặp ngoặc nhọn đầu tiên và cuối cùng
            const firstBrace = text.indexOf("{");
            const lastBrace = text.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = text.substring(firstBrace, lastBrace + 1);
            }
        }

        const searchParams = JSON.parse(jsonText.trim());

        // Xây dựng query MongoDB
        let mongoQuery = { status: "approved", isDeleted: false };
        if (searchParams.name) mongoQuery.name = { $regex: searchParams.name, $options: "i" };
        if (searchParams.category) mongoQuery.category = searchParams.category;
        
        if (searchParams.minPrice || searchParams.maxPrice) {
            mongoQuery.price = {};
            if (searchParams.minPrice) mongoQuery.price.$gte = searchParams.minPrice;
            if (searchParams.maxPrice) mongoQuery.price.$lte = searchParams.maxPrice;
        }

        let products = await Product.find(mongoQuery).limit(20);

        // Nếu không thấy bằng regex name, thử tìm bằng keyword/category linh hoạt hơn
        if (products.length === 0 && searchParams.name) {
            delete mongoQuery.name;
            products = await Product.find({ ...mongoQuery, $or: [
                { name: { $regex: searchParams.name.split(" ")[0], $options: "i" } },
                { category: { $regex: searchParams.name, $options: "i" } }
            ]}).limit(20);
        }

        res.json({ products, params: searchParams });
    } catch (error) {
        console.error("AI Search Error Full Details:", error);
        res.status(500).json({ 
            message: "Không thể thực hiện tìm kiếm AI lúc này.",
            error: error.message 
        });
    }
};
