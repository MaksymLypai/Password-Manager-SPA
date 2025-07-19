function sha512(message) {
  return CryptoJS.SHA512(message).toString();
}

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
});
document.getElementById("btnRegister").addEventListener("click", function (e) {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const key = sha512(password);
  const data = {
    master: username,
    vault: [],
  };
  const encrypted = encryptData(data, key);
  downloadFile(encrypted, "password.json");
});
