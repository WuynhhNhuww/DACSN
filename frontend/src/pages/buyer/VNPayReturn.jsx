import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

export default function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const vnpMessage = searchParams.get("message");

    if (vnpResponseCode === "00") {
      setStatus("success");
      setMessage(vnpMessage || "Nạp tiền vào ví thành công!");
    } else {
      setStatus("error");
      setMessage(vnpMessage || "Giao dịch không thành công hoặc đã bị hủy.");
    }
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl text-center">
      {status === "loading" && (
        <>
          <FaSpinner className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Đang xác thực giao dịch...</h2>
          <p className="text-gray-500 mt-2">Vui lòng không tắt trình duyệt.</p>
        </>
      )}

      {status === "success" && (
        <>
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Thanh toán Thành công!</h2>
          <p className="text-green-600 font-medium mt-2">{message}</p>
          <button 
            onClick={() => navigate("/buyer/wallet")}
            className="mt-8 w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-200"
          >
            Quay lại Ví của tôi
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Giao dịch bị lỗi</h2>
          <p className="text-red-600 font-medium mt-2">{message}</p>
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => navigate("/buyer/wallet")}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              Quay lại
            </button>
            <button 
              onClick={() => navigate("/home")}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
            >
              Về Trang chủ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
