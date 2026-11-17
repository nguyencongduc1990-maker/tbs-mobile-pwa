
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


/**
 * TBS MOBILE V2.7.3
 * Automatic backend authorization.
 *
 * Default: LOCKED
 * Unlock only after verified backend approval.
 */

let authCheckVersionV273 = 0;


function lockAppV273() {
  document.body.classList.add("locked");
  document.body.dataset.role = "";

  const roleStatus =
    document.getElementById("userRoleStatus");

  if (roleStatus) {
    roleStatus.textContent =
      "Chưa được cấp quyền";
  }
}



function unlockAppV273(role) {
  document.body.dataset.role = role;

  const roleStatus =
    document.getElementById("userRoleStatus");

  if (roleStatus) {
    roleStatus.textContent =
      role === "ADMIN"
        ? "Đã cấp quyền ADMIN"
        : "Đã cấp quyền USER";
  }

  document.body.classList.remove("locked");
}

onAuthStateChanged(auth, async user => {
  const checkVersion = ++authCheckVersionV273;

  // Always lock before checking permissions.
  lockAppV273();

  if (!user) {
    loginBtn.hidden = false;
    loginBtn.disabled = false;
    loginBtn.textContent = "Đăng nhập bằng Google";

    userBox.hidden = true;

    status.textContent =
      "Vui lòng đăng nhập để xác minh danh tính.";

    return;
  }

  loginBtn.hidden = true;
  userBox.hidden = false;

  document.getElementById("userName")
    .textContent = user.displayName || "";

  document.getElementById("userEmail")
    .textContent = user.email || "";

  document.getElementById("userUid")
    .textContent = user.uid;

  status.textContent =
    "Đang kiểm tra quyền truy cập...";

  try {
    const token = await user.getIdToken();

    const response = await fetch(
      "https://tbs-mobile-api.nguyencongduc1990.workers.dev/auth/access",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `AUTH_HTTP_${response.status}`
      );
    }

    const result = await response.json();

    // Ignore responses from an outdated login.
    if (
      checkVersion !== authCheckVersionV273 ||
      auth.currentUser?.uid !== user.uid
    ) {
      return;
    }

    if (
      result.success === true &&
      result.authenticated === true &&
      result.authorized === true &&
      result.database === "PROTECTED" &&
      ["ADMIN", "USER"].includes(result.role)
    ) {
      unlockAppV273(result.role);

      status.textContent =
        result.role === "ADMIN"
          ? "Đã xác thực. Quyền truy cập: ADMIN"
          : "Đã xác thực. Quyền truy cập: USER";

      console.log(
        "TBS V2.7.3 AUTHORIZATION: APPROVED",
        result.role
      );

      return;
    }

    lockAppV273();

    status.textContent =
      "Tài khoản chưa được cấp quyền truy cập.";

    console.warn(
      "TBS V2.7.3 AUTHORIZATION: DENIED",
      result.reason || "ACCESS_DENIED"
    );

  } catch (error) {
    if (
      checkVersion !== authCheckVersionV273 ||
      auth.currentUser?.uid !== user.uid
    ) {
      return;
    }

    lockAppV273();

    status.textContent =
      "Không thể xác minh quyền truy cập. Vui lòng thử lại.";

    console.error(
      "TBS V2.7.3 AUTHORIZATION ERROR:",
      error.message
    );
  }
}, error => {
  ++authCheckVersionV273;

  lockAppV273();

  status.textContent =
    "Lỗi khởi tạo xác thực: " +
    (error.code || "UNKNOWN");
});


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
