
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase TBS Mobile v2.0
const firebaseConfig = {
  apiKey: "AIzaSyB5Ujap691TJXjGHirK_jAZgyElQVK_oCI",
  authDomain: "tbs-mobile-v2.firebaseapp.com",
  projectId: "tbs-mobile-v2",
  storageBucket: "tbs-mobile-v2.firebasestorage.app",
  messagingSenderId: "310544621447",
  appId: "1:310544621447:web:017b6fb4f3a93102d1fd22"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("loginGoogle");
const logoutBtn = document.getElementById("logoutGoogle");
const status = document.getElementById("authStatus");
const userBox = document.getElementById("authUser");

loginBtn.addEventListener("click", async () => {
  loginBtn.disabled = true;
  status.textContent = "Đang đăng nhập Google...";

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Firebase Auth:", error.code);

    status.textContent =
      "Đăng nhập thất bại: " + error.code;
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    status.textContent =
      "Không thể đăng xuất: " + error.code;
  }
});

onAuthStateChanged(auth, user => {
  // Chưa có backend phê duyệt: luôn khóa app.
  document.body.classList.add("locked");

  if (user) {
    loginBtn.hidden = true;
    userBox.hidden = false;

    document.getElementById("userName")
      .textContent = user.displayName || "";

    document.getElementById("userEmail")
      .textContent = user.email || "";

    document.getElementById("userUid")
      .textContent = user.uid;

    status.textContent =
      "Đã xác thực Google. Chưa được cấp quyền truy cập.";
  } else {
    loginBtn.hidden = false;
    loginBtn.disabled = false;
    loginBtn.textContent = "Đăng nhập bằng Google";
    userBox.hidden = true;

    status.textContent =
      "Vui lòng đăng nhập để xác minh danh tính.";
  }
}, error => {
  status.textContent =
    "Lỗi khởi tạo xác thực: " + error.code;
});


/**
 * Lay Firebase ID Token cua tai khoan da dang nhap.
 * Token se duoc Backend xac minh truoc khi cap quyen.
 */
async function getFirebaseIdTokenV2() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("NOT_AUTHENTICATED");
  }

  return await user.getIdToken();
}


const TBS_API_URL =
  "https://tbs-mobile-api.nguyencongduc1990.workers.dev";

async function verifyLoginWithBackendV2() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const token = await getFirebaseIdTokenV2();

  const response = await fetch(
    `${TBS_API_URL}/auth/verify`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }
  );

  const result = await response.json();

  if (!response.ok || !result.authenticated) {
    throw new Error(
      result.error || "AUTH_VERIFICATION_FAILED"
    );
  }

  return result;
}

// Chỉ dùng để kiểm tra trong giai đoạn triển khai.
// Không lưu hoặc hiển thị ID Token.
window.testTbsAuthenticationV2 = async function () {
  try {
    const result = await verifyLoginWithBackendV2();

    console.log("FIREBASE VERIFICATION:", {
      authenticated: result.authenticated,
      authorized: result.authorized,
      message: result.message
    });

    return result;
  } catch (error) {
    console.error("VERIFICATION FAILED:", error.message);
    return { success: false, error: error.message };
  }
};


/**
 * TBS MOBILE V2.6
 * Test Cloudflare Worker -> Apps Script HMAC.
 *
 * Chi dung de kiem tra ket noi.
 * Khong cap quyen va khong truy cap database.
 */
window.testTbsHmacV26 = async function () {
  try {
    const token = await getFirebaseIdTokenV2();

    const response = await fetch(
      `${TBS_API_URL}/backend/test`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const result = await response.json();

    const output = {
      httpStatus: response.status,
      success: result.success === true,
      authenticated: result.authenticated === true,
      authorized: result.authorized === true,
      backendConnected: result.backendConnected === true,
      backendVersion: result.backendVersion || null,
      database: result.database || null,
      error: result.error || null,
      reason: result.reason || null
    };

    console.log("TBS HMAC V2.6 TEST:", output);

    return output;

  } catch (error) {
    const output = {
      success: false,
      error: error.message
    };

    console.error("TBS HMAC V2.6 ERROR:", output);

    return output;
  }
};


/**
 * TBS MOBILE V2.7.2
 * Test Firebase -> Worker -> Apps Script -> USERS.
 *
 * Chi kiem tra quyen, khong mo khoa giao dien.
 * Khong thay doi du lieu Google Sheets.
 */
window.testTbsAccessV272 = async function () {
  try {
    const token = await getFirebaseIdTokenV2();

    const response = await fetch(
      `${TBS_API_URL}/auth/access`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const result = await response.json();

    const output = {
      httpStatus: response.status,
      success: result.success === true,
      authenticated: result.authenticated === true,
      authorized: result.authorized === true,
      role: result.role || null,
      reason: result.reason || null,
      database: result.database || null,
      error: result.error || null
    };

    console.log("TBS ACCESS V2.7.2:", output);

    return output;

  } catch (error) {
    const output = {
      success: false,
      error: error.message
    };

    console.error("TBS ACCESS ERROR:", output);

    return output;
  }
};
