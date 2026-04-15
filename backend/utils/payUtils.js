const crypto = require("crypto");
const qs = require("qs");

/**
 * ✅ Sort object + encode theo chuẩn VNPay
 */
function vnpaySortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
        let value = obj[key];

        // Convert sang string để tránh lỗi
        if (value === null || value === undefined) {
            value = "";
        }

        // Encode theo chuẩn VNPay
        sorted[key] = encodeURIComponent(value).replace(/%20/g, "+");
    });

    return sorted;
}

/**
 * ✅ Tạo chuỗi dữ liệu để ký (signData)
 */
function buildSignData(params) {
    return qs.stringify(params, { encode: false });
}

/**
 * ✅ Tạo chữ ký VNPay (HMAC SHA512)
 */
function createVnpaySignature(secretKey, signData) {
    return crypto
        .createHmac("sha512", secretKey)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");
}

/**
 * ✅ Verify chữ ký từ VNPay trả về
 */
function verifyVnpaySignature(secretKey, params) {
    const secureHash = params["vnp_SecureHash"];

    // Xóa hash trước khi kiểm tra
    delete params["vnp_SecureHash"];
    delete params["vnp_SecureHashType"];

    // Sort + encode
    const sortedParams = vnpaySortObject(params);

    // Build lại chuỗi ký
    const signData = buildSignData(sortedParams);

    // Tạo lại chữ ký
    const checkSum = createVnpaySignature(secretKey, signData);

    return secureHash === checkSum;
}

/**
 * (OPTIONAL) Signature cho MoMo
 */
function createMomoSignature(secretKey, rawData) {
    return crypto
        .createHmac("sha256", secretKey)
        .update(rawData)
        .digest("hex");
}

module.exports = {
    vnpaySortObject,
    buildSignData,
    createVnpaySignature,
    verifyVnpaySignature,
    createMomoSignature
};