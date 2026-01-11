import { useState } from "react";
import axios from "axios";
import "./assets/style.css";
// API 設定
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

// 建立 Axios 實體，並設定 baseURL
const apiRequest = axios.create({
  baseURL: API_BASE,
});

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  // 將首圖也加入更多圖片陣列
  const thumbnails = tempProduct
    ? [tempProduct.imageUrl, ...tempProduct.imagesUrl]
    : [];

  // 表單輸入處理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // console.log(name, value);
    setFormData((preData) => ({ ...preData, [name]: value }));
  };

  // 驗證 token
  const checkLogin = async () => {
    try {
      // 從 Cookie 取得 Token
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hexToken="))
        ?.split("=")[1];
      console.log("目前 Token：", token);
      if (token) {
        apiRequest.defaults.headers.common["Authorization"] = token;
        const response = await apiRequest.post(`/api/user/check`);
        console.log("Token 驗證成功：", response);
      }
    } catch (error) {
      console.log("Token 驗證失敗：", error.response?.data);
    }
  };

  // 取得產品資料
  const getProducts = async () => {
    try {
      const response = await apiRequest.get(`/api/${API_PATH}/admin/products`);
      console.log("產品資料：", response.data);
      setProducts(response.data.products);
    } catch (error) {
      console.log("取得產品失敗：", error.response?.data);
    }
  };

  // 登入
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest.post(`/admin/signin`, formData);
      // console.log(response.data);
      const { token, expired } = response.data;
      // 儲存 Token 到 Cookie
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      // 設定 axios 預設 header
      apiRequest.defaults.headers.common["Authorization"] = token;
      getProducts();
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      console.log("登入失敗: ", error.response?.data);
    }
  };

  return (
    <>
      {!isAuth ? (
        <div className="login-page">
          <div className="login-card">
            <h2 className="login-title">請先登入</h2>
            <form
              className="form-floating"
              onSubmit={(e) => {
                handleSubmit(e);
              }}
            >
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  name="username"
                  placeholder="name@example.com"
                  value={formData.username}
                  onChange={(e) => handleInputChange(e)}
                />
                <label htmlFor="username">Email address</label>
              </div>
              <div className="form-floating">
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange(e)}
                />
                <label htmlFor="password">Password</label>
              </div>
              <button type="submit" className="btn login-btn w-100 mt-3">
                登入
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="container admin-shell">
          <header className="admin-topbar">
            <div className="admin-topbar__left">
              <h1 className="admin-title">產品後台</h1>
            </div>
            <div className="admin-topbar__right">
              <div className="login-status">
                <span
                  className={`login-dot ${
                    isAuth ? "login-dot--on" : "login-dot--off"
                  }`}
                />
                <span className="login-text">
                  {isAuth ? "已登入" : "未登入"}
                </span>
              </div>
              <button
                type="button"
                className="btn-system-check"
                onClick={checkLogin}
              >
                重新驗證
              </button>
            </div>
          </header>
          <main className="admin-panel">
            <div className="row g-4">
              <div className="col-lg-5">
                <h2 className="section-title">產品列表</h2>
                <div className="product-list">
                  {products.map((product) => {
                    const isSelected =
                      tempProduct && product.id === tempProduct.id;
                    return (
                      <div className="product-card" key={product.id}>
                        <div className="card-main">
                          <h5>{product.title}</h5>
                          <div className="price-row">
                            <span className="origin">
                              原價 $<del>{product.origin_price}</del>
                            </span>
                            <span className="sale">售價 ${product.price}</span>
                          </div>
                          <div className="stock">庫存 {product.num}</div>
                        </div>
                        <div className="card-side">
                          <span
                            className={`status ${
                              product.is_enabled ? "status--on" : "status--off"
                            }`}
                          >
                            {product.is_enabled ? "已啟用" : "未啟用"}
                          </span>
                          {/* 點擊查看細節，更新右側產品細節卡片 */}
                          <button
                            type="button"
                            className={`action-btn ${
                              isSelected ? "is-selected" : ""
                            }`}
                            onClick={() => {
                              setTempProduct(product);
                              setMainImage(product.imageUrl);
                            }}
                          >
                            查看細節
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="col-lg-7">
                <h2 className="section-title">單一產品細節</h2>
                {tempProduct ? (
                  <div className="product-detail">
                    <img
                      src={mainImage ? mainImage : tempProduct.imageUrl}
                      className="card-img-top"
                      style={{
                        height: "320px",
                        width: "100%",
                        objectFit: "cover",
                      }}
                      alt={tempProduct.title}
                    />
                    <div className="card-body">
                      <div className="detail-header">
                        <h4 className="detail-title">{tempProduct.title}</h4>
                        <span
                          className={`status ${
                            tempProduct.is_enabled
                              ? "status--on"
                              : "status--off"
                          }`}
                        >
                          {tempProduct.is_enabled ? "已啟用" : "未啟用"}
                        </span>
                      </div>
                      <p className="card-text">
                        商品描述：{tempProduct.description}
                      </p>
                      <p className="card-text">
                        商品內容：{tempProduct.content}
                      </p>
                      <div className="price-row price-row--detail">
                        <span className="origin">
                          原價 $<del>{tempProduct.origin_price}</del>
                        </span>
                        <span className="sale">售價 ${tempProduct.price}</span>
                      </div>
                      <h5 className="mt-3">更多圖片：</h5>
                      {/* 點擊縮圖切換主圖 */}
                      <div className="d-flex flex-wrap gap-2">
                        {thumbnails.map((url, index) => {
                          return (
                            <img
                              key={index}
                              src={url}
                              className={`thumb ${
                                url === mainImage ? "is-selected" : ""
                              }`}
                              onClick={() => setMainImage(url)}
                              alt={`${tempProduct.title}-${index}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary">請選擇一個商品查看</p>
                )}
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
