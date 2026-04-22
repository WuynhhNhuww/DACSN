import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [amount, setAmount] = useState("");
  const [actionType, setActionType] = useState(""); // "DEPOSIT" | "WITHDRAW"
  const [paymentMethod, setPaymentMethod] = useState("VNPAY"); // "VNPAY" | "SIMULATION"
  const [showModal, setShowModal] = useState(false);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/wallets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallet(data.wallet);
      setTransactions(data.transactions);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (actionType === "WITHDRAW" && Number(amount) < 50000) {
      alert("Số tiền rút tối thiểu là 50.000 VNĐ.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      if (actionType === "WITHDRAW") {
         // Thực hiện rút tiền qua API Backend (Gắn nhãn VNPay)
        await axios.post("http://localhost:5000/api/wallets/withdraw", { 
          amount: Number(amount),
          description: "Rút tiền về ngân hàng qua VNPay" 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Yêu cầu duyệt rút tiền qua cổng VNPay đã được gửi thành công!");
        setShowModal(false);
        setAmount("");
        fetchWallet();
        return;
      }

      // Luồng Nạp tiền (DEPOSIT) qua VNPAY
      if (true) { // Luôn dùng VNPay
        const { data } = await axios.post("http://localhost:5000/api/wallets/vnpay-create", { 
          amount: Number(amount) 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data.paymentUrl) {
          // Chuyển hướng sang cổng VNPay
          window.location.href = data.paymentUrl;
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Giao dịch thất bại");
    }
  };

  if (loading) return <div className="p-4 text-center">Đang tải dữ liệu ví...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-gray-50 rounded shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Ví Điện Tử (ShopeePay)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-md">
          <p className="text-sm opacity-80 uppercase tracking-wider mb-2">Số dư khả dụng</p>
          <h3 className="text-4xl font-bold mb-4">{wallet?.balance?.toLocaleString("vi-VN")} ₫</h3>
          
          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => { setActionType("DEPOSIT"); setShowModal(true); }}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Nạp tiền
            </button>
            <button 
              onClick={() => { setActionType("WITHDRAW"); setShowModal(true); }}
              className="px-4 py-2 border border-white rounded-lg font-semibold hover:bg-white/20 transition"
            >
              Rút tiền
            </button>
          </div>
        </div>
        
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-gray-500 text-sm mb-1">Số dư đang chờ (Đóng băng)</p>
          <p className="text-2xl font-bold text-gray-700">{wallet?.frozenBalance?.toLocaleString("vi-VN")} ₫</p>
          <p className="text-xs text-gray-400 mt-2">Tiền đang chờ đối soát hoặc chờ Admin duyệt.</p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-700">Lịch sử giao dịch</h3>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm">
              <th className="p-4">Thời gian</th>
              <th className="p-4">Loại giao dịch</th>
              <th className="p-4">Số tiền</th>
              <th className="p-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan="4" className="p-4 text-center text-gray-400">Chưa có giao dịch nào</td></tr>
            ) : (
              transactions.map(txn => (
                <tr key={txn._id} className="border-t">
                  <td className="p-4 text-gray-600">{new Date(txn.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="p-4 font-medium">{txn.type}</td>
                  <td className={`p-4 font-bold ${txn.type === 'DEPOSIT' || txn.type === 'SELLER_REVENUE' || txn.type === 'ORDER_REFUND' ? 'text-green-600' : 'text-red-500'}`}>
                    {txn.type === 'WITHDRAW' || txn.type === 'ORDER_PAYMENT' ? '-' : '+'}{txn.amount.toLocaleString("vi-VN")} ₫
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      txn.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                      txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{actionType === "DEPOSIT" ? "Nạp tiền vào ví" : "Rút tiền về ngân hàng"}</h3>
            <form onSubmit={handleTransaction}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 text-sm font-medium">Số tiền (VNĐ)</label>
                <input 
                  type="number" 
                  min={actionType === "WITHDRAW" ? "50000" : "10000"}
                  step="10000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder={actionType === "WITHDRAW" ? "Nhập số tiền (Tối thiểu 50.000đ)..." : "Nhập số tiền..."}
                />
                {actionType === "WITHDRAW" && amount && amount < 50000 && (
                  <p className="text-red-500 text-xs mt-1">Số tiền rút tối thiểu là 50.000 VNĐ</p>
                )}
              </div>
              
              <div className="mb-4">
                 <label className="block text-gray-700 mb-2 text-sm font-medium">
                   {actionType === "DEPOSIT" ? "Phương thức nạp tiền" : "Phương thức rút tiền"}
                 </label>
                 <div className="space-y-2">
                    <label className="flex items-center p-3 border border-orange-500 bg-orange-50 rounded-lg cursor-pointer transition">
                       <input 
                          type="radio" 
                          name="payMethod" 
                          value="VNPAY"
                          checked={true}
                          readOnly
                          className="mr-3 text-orange-600 focus:ring-orange-500"
                       />
                       <div>
                          <span className="font-semibold block text-orange-700">Cổng thanh toán VNPay</span>
                          <span className="text-xs text-orange-600">
                            {actionType === "DEPOSIT" ? "Thanh toán giao dịch qua VNPay an toàn" : "Xử lý rút tiền thông qua cổng VNPay"}
                          </span>
                       </div>
                    </label>
                    {actionType === "DEPOSIT" && (
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition opacity-50 cursor-not-allowed">
                         <input 
                            type="radio" 
                            name="payMethod" 
                            value="SIMULATION"
                            disabled
                            className="mr-3"
                         />
                         <div>
                            <span className="font-semibold block text-gray-500">Nạp tiền mô phỏng (Đã tắt)</span>
                            <span className="text-xs text-gray-400">Tiền thật được yêu cầu trong luồng thực tế</span>
                         </div>
                      </label>
                    )}
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                >
                  Tiếp tục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
