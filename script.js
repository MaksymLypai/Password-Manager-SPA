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
function decryptData(encrypted, key) {
  const decrypted = CryptoJS.AES.decrypt(encrypted, key);
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}

document.getElementById("btnLogin").addEventListener("click", function (e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const fileInput = document.getElementById("passwordFile");
  const reader = new FileReader();
  const key = sha512(password);

  reader.onload = function (e) {
    try {
      const decrypted = decryptData(e.target.result, key);
      if (decrypted.master === username) {
        localStorage.setItem("vault", JSON.stringify(decrypted));
        localStorage.setItem("vaultKey", key);
        alert("Login successful");
      } else {
        alert("Invalid username or password");
      }
    } catch (err) {
      alert("Invalid file or credentials");
    }
  };

  reader.readAsText(fileInput.files[0]);
});
function logout() {
  const vault = JSON.parse(localStorage.getItem("vault"));
  const key = localStorage.getItem("vaultKey");
  const encrypted = encryptData(vault, key);
  downloadFile(encrypted, "password_updated.json");
  localStorage.clear();
  location.reload();
}

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", logout);
}

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("vault")) {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("searchNewVault").style.display = "block";
    document.getElementById("vaultSection").style.display = "block";
    renderVault();
  }
});
document.getElementById("btnAddEntry").addEventListener("click", function (e) {
  e.preventDefault();
  const vault = JSON.parse(localStorage.getItem("vault"));
  const entry = {
    accountName: document.getElementById("accountName").value,
    app: document.getElementById("appName").value,
    username: document.getElementById("accountUsername").value,
    password: document.getElementById("accountPassword").value,
    oldPasswords: [],
    strength: getPasswordStrength(document.getElementById("accountPassword").value),
    created: new Date().toISOString(),
  };
  vault.vault.push(entry);
  localStorage.setItem("vault", JSON.stringify(vault));
  renderVault();
});
function renderVault() {
  const vault = JSON.parse(localStorage.getItem("vault"));
  const tbody = document.getElementById("vaultTableBody");
  tbody.innerHTML = "";
  vault.vault.forEach((entry, index) => {
    const row = `<tr>
      <td>${entry.accountName}</td>
      <td>${entry.username}</td>
      <td>${entry.password}</td>
      <td>
        <button class="btn btn-edit" onclick="editEntry(${index})">Edit</button>
        <button class="btn btn-del" onclick="deleteEntry(${index})">Delete</button>
      </td>
    </tr>`;
    tbody.innerHTML += row;
  });
}
function editEntry(index) {
  const vault = JSON.parse(localStorage.getItem("vault"));
  const entry = vault.vault[index];
  document.getElementById("accountName").value = entry.accountName;
  document.getElementById("appName").value = entry.app;
  document.getElementById("accountUsername").value = entry.username;
  document.getElementById("accountPassword").value = entry.password;
  vault.vault.splice(index, 1);
  localStorage.setItem("vault", JSON.stringify(vault));
  renderVault();
}

function deleteEntry(index) {
  const vault = JSON.parse(localStorage.getItem("vault"));
  vault.vault.splice(index, 1);
  localStorage.setItem("vault", JSON.stringify(vault));
  renderVault();
}
