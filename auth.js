
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
