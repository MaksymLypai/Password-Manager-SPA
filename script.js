//constants showing allowed characters used for password generation
const specialCharacters = "!@#$%^&*()_+-=[]{}|;:,.<>?`~";
const numberCharacters = "1234567890";
const lowercaseCharacters = "abcdefghijklmnopqrstuvwxyz";
const uppercaseCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let passwordData = null;
let userLoggedIn = false;

//selectors with windows navigation to different forms
const windowSignIn = document.getElementById("loginForm")
const windowRegister = document.getElementById("registerForm")
const windowVault = document.getElementById("searchNewVault")
const windowGeneratePassword = document.getElementById("passwordGenerator")
const windowLogoutUser = document.getElementById("logoutForm")
const windowNewVault = document.getElementById("newVault")

const pwdTitle = document.getElementById("pwd_title")
const vaultTitle = document.getElementById("vault")
const loadingIcon = '<img src="images/loading.png!sw800" class="loading" alt="">';

function encryptText(plainText, encryptionKey) {
    /*
    * function used to encrypt strings such as passwords
    */
    return CryptoJS.AES.encrypt(plainText, encryptionKey).toString()
}

function decryptText(encryptedText, decryptionKey) {
    /*
    * function used to dencrypt strings with unique keys
    */
    return CryptoJS.AES.decrypt(encryptedText, decryptionKey).toString(CryptoJS.enc.Utf8);
}

function generateSha512Hash(plainText) {
    /*
    * function used to generate hash codes
    */
    return CryptoJS.SHA512(plainText).toString()
}

async function delay(milliseconds) {
    // function used to wait execution to simulate the login/processing
    await new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function logoutUser() {
    /*
    * This function is responsible in the sign-out process of a user.
    * */
    const writerElement = document.getElementById("logoutError");
    writerElement.innerHTML = "";
    writerElement.classList.remove("error","success");

    if(passwordData && typeof passwordData === "object"){
        const password = document.getElementById('pwd_logout').value;
        if (passwordData["masterUsername"]["password"] === password){
            writerElement.innerHTML = loadingIcon;
            // writerElement.innerHTML = JSON.stringify(passwordData);
            await delay(3000);

            const hashKey = generateSha512Hash(passwordData["masterUsername"]["username"]+passwordData["masterUsername"]["password"]);
            const encryptedData = encryptText(JSON.stringify(passwordData), hashKey);
            let file = new Blob([encryptedData], {type: "application/json"});
            let link = document.createElement("a");
            link.href = URL.createObjectURL(file);
            link.download = "password_updated.json";
            link.click();

            writerElement.innerHTML = "Data saved and Password file generated successfully.";
            writerElement.classList.add("success");
            writerElement.classList.remove("error");

            await delay(1500);
            localStorage.clear() //delete all the locally saved data
            userLoggedIn = false;
            passwordData = null
            navigateToSignIn()
            window.location.reload(true);
        }else {
            writerElement.innerHTML = password.length === 0 ? "Account Password is Required":"Incorrect password";
            writerElement.classList.add("error");
            writerElement.classList.remove("success");
        }
    }
}

function registerAccount(event) {
    /*This function is responsible for registering and vault and prompting a download file*/
    event.preventDefault()
    const usernameSelector = document.getElementById('usrname');
    const pwdSelector = document.getElementById('pwd');
    const pwdConfirmSelector = document.getElementById('pwd_confirm');

    let validation = true;
    let username_validation = document.getElementById('usrname-notification')
    let pwd_validation = document.getElementById('pwd-notification')
    let pwd_confirm_validation = document.getElementById('pwd_confirm-notification')

    const username = usernameSelector.value.trim()
    const pwd = pwdSelector.value.trim()
    const pwd_confirm = pwdConfirmSelector.value.trim()

    if(username.length === 0){
        validation = false
        username_validation.innerText = "Username cannot be blank"
        username_validation.classList.add('error')
        username_validation.classList.remove('success')
    }else {
        username_validation.innerText = ""
        username_validation.classList.remove('error','success')
    }

    if (pwd.length === 0){
        validation = false
        pwd_validation.innerText = "Password cannot ne blank"
        pwd_validation.classList.add('error')
        pwd_validation.classList.remove('success')
    }else {
        pwd_validation.innerText = ""
        pwd_validation.classList.remove('error','success')
    }

    if (pwd_confirm.length === 0){
        validation = false
        pwd_confirm_validation.innerText = "Confirm Password cannot be blank"
        pwd_confirm_validation.classList.add('error')
        pwd_confirm_validation.classList.remove('success')
    }else {
        pwd_confirm_validation.innerText = ""
        pwd_confirm_validation.classList.remove('error','success')
    }

    if(!validation){
        return null;
    }

    if (pwd.length>0 && pwd_confirm.length>0 && pwd !== pwd_confirm){
        validation = false
        pwd_validation.innerText = "Password mismatch"
        pwd_confirm_validation.innerText = "Password mismatch"
        pwd_validation.classList.add('error')
        pwd_confirm_validation.classList.add('error')
    }else {
        pwd_validation.innerText = ""
        pwd_confirm_validation.innerText = ""
        pwd_validation.classList.remove('error','success')
        pwd_confirm_validation.classList.remove('error','success')
    }
    if (validation){
        const data = {
            "masterUsername": {
                "accountName": "",
                "username": username,
                "password": pwd,
                "website": "-",
                "extraInfo": "",
                "passwordStrength": checkPasswordStrength(pwd),
                "application": "",
                "playMins": 25,
                "score": 4,
                "level": 1,
                "oldPasswords": [],
                "passwordChangeDate": new Date().toISOString()
            },
        }
        const encryptedData = encryptText(JSON.stringify(data), generateSha512Hash(username+pwd));
        let file = new Blob([encryptedData], {type: "application/json"});
        let link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = "password.json";
        link.click();

        navigateToSignIn()
        usernameSelector.value = ""
        pwdSelector.value = ""
        pwdConfirmSelector.value = ""
    }
}

async function loginUser(event) {
    /*This function is responsible for the sign-in process of a user*/
    event.preventDefault()
    const formData = new FormData(document.querySelector('form')); // read form data

    const username = formData.get("username").trim();
    const password = formData.get("password").trim();
    const file = formData.get("attachment");
    const user_validation = document.getElementById("username-notification")
    const pwd_validation = document.getElementById("password-notification")
    let validation = true
    //validate user inputs
    if (username.length === 0){
        validation = false
        user_validation.innerText = "Username cannot be empty."
    }else {
        user_validation.innerText = ""
    }

    if (password.length === 0){
        validation = false
        pwd_validation.innerText = "Password field cannot be empty."
    }else {
        pwd_validation.innerText = ""
    }
    //if any error is found, display it and stop execution
    if (!validation){
        return null;
    }

    let file_notification = document.getElementById("file-notify");
    let signInError = document.getElementById("signInError");
    //validate file attached
    if (file.name){
        file_notification.innerText = ""
        file_notification.classList.remove('error','success')
        if (file.type === "application/json"){
            const reader = new FileReader();
            reader.onload = async function (ev) {
                const fileContent = ev.target.result;
                try {
                    // decrypt file content
                    passwordData = decryptText(fileContent, generateSha512Hash(username + password))
                    //if no exception, this means the logins are correct
                    passwordData = JSON.parse(passwordData)
                    userLoggedIn = true
                    //store values in the browser's localstorage
                    localStorage.setItem("loginStatus", true); //track if user is logged in
                    localStorage.setItem("passwordData", passwordData); //account details

                    signInError.innerHTML = loadingIcon;
                    // delay script for one second before redirecting
                    await delay(2000)

                    signInError.innerText = "Login is successful..."
                    signInError.classList.add("success")
                    signInError.classList.remove("error")
                    await delay(1000)
                    navigateToVault()
                    signInError.innerText = ""
                } catch (error) {
                    signInError.classList.add("error")
                    signInError.classList.remove("success")
                    signInError.innerText = "Incorrect Username, Password or invalid password file."
                }
            }
            reader.onerror = function (ev){
                alert("Error occurred while reading file: "+ev.target.error)
            }
            reader.readAsText(file)
        }else {
            file_notification.innerText = "Chosen password file isn't a JSON file"
            file_notification.classList.add("error")
        }
    }else {
        file_notification.innerText = "Password file is missing..."
        file_notification.classList.add("error")
    }
}

async function registerNewVault(event) {
    // Function used to register a new vault account
    event.preventDefault();
    const errorSelector = document.getElementById("newVaultError")
    errorSelector.innerHTML = loadingIcon
    errorSelector.classList.add("centered")

    await delay(2600)

    const formContent = new FormData(document.getElementById("registerNewVault"))
    const errors = validateVaultInputs(formContent);
    if (errors){
        errorSelector.innerHTML = errors;
        errorSelector.classList.remove("centered")
        return null;
    }

    const pwd = formContent.get("newPassword");
    const vaultQuery = formContent.get("vaultQuery");
    if(vaultQuery === ""){
        const record = {
            "accountName": formContent.get("newAccName"),
            "username": formContent.get("newUsername"),
            "password": pwd,
            "website": formContent.get("newVaultWebsite"),
            "extraInfo": formContent.get("textarea"),
            "passwordStrength": checkPasswordStrength(pwd),
            "application": formContent.get("newAppName"),
            "playMins": formContent.get("newPlayMins"),
            "score": formContent.get("newScore"),
            "level": formContent.get("newPasswordLevel"),
            "oldPasswords": [pwd],
            "passwordChangeDate": new Date().toISOString()
        }

        // alert("what of here")
        const keys = Object.keys(passwordData);
        if(passwordData && keys.includes("allPasswords")){
            passwordData["allPasswords"].push(pwd)
        }else {
            passwordData["allPasswords"] = [pwd]
        }

        // alert("passed here")
        if(passwordData && keys.includes("accounts")){
            passwordData["accounts"].push(record)
        }else {
            passwordData["accounts"] = [record]
        }
        errorSelector.innerHTML = "New vault added successfully."
    }else {
        if(vaultQuery === "-1"){
            //update master
            passwordData["masterUsername"]["username"] = formContent.get("newUsername");
            passwordData["masterUsername"]["accountName"] = formContent.get("newAccName");
            passwordData["masterUsername"]["website"] = formContent.get("newVaultWebsite");
            passwordData["masterUsername"]["extraInfo"] = formContent.get("textarea");
            passwordData["masterUsername"]["application"] = formContent.get("newAppName");
            passwordData["masterUsername"]["playMins"] = formContent.get("newPlayMins");

            passwordData["masterUsername"]["score"] = formContent.get("newScore");
            passwordData["masterUsername"]["level"] = formContent.get("newPasswordLevel");

            if(pwd !== passwordData["masterUsername"]["password"]){
                passwordData["masterUsername"]["password"] = pwd;
                passwordData["masterUsername"]["passwordStrength"] = checkPasswordStrength(pwd);
                passwordData["masterUsername"]["oldPasswords"].push(pwd);
                passwordData["masterUsername"]["passwordChangeDate"] = new Date().toISOString();
            }
        }else {
            //update an account
            passwordData["accounts"][vaultQuery]["username"] = formContent.get("newUsername");
            passwordData["accounts"][vaultQuery]["accountName"] = formContent.get("newAccName");
            passwordData["accounts"][vaultQuery]["website"] = formContent.get("newVaultWebsite");
            passwordData["accounts"][vaultQuery]["extraInfo"] = formContent.get("textarea");
            passwordData["accounts"][vaultQuery]["application"] = formContent.get("newAppName");
            passwordData["accounts"][vaultQuery]["playMins"] = formContent.get("newPlayMins");

            passwordData["accounts"][vaultQuery]["score"] = formContent.get("newScore");
            passwordData["accounts"][vaultQuery]["level"] = formContent.get("newPasswordLevel");

            if(pwd !== passwordData["accounts"][vaultQuery]["password"]){
                passwordData["accounts"][vaultQuery]["password"] = pwd;
                passwordData["accounts"][vaultQuery]["passwordStrength"] = checkPasswordStrength(pwd);
                passwordData["accounts"][vaultQuery]["oldPasswords"].push(pwd);
                passwordData["accounts"][vaultQuery]["passwordChangeDate"] = new Date().toISOString();
            }
        }
        errorSelector.innerHTML = "Record Updated successfully."
    }
    errorSelector.classList.add("success", "centered", "bold")
    errorSelector.classList.remove("error")
    searchVault()
}

function toggleTheme() {
    // function used to toggle between dark and light theme
    const wrapper = document.getElementById('bodyWrapper')
    wrapper.classList.toggle('dark-theme')
    const themeText = document.getElementById("themeBtn")
    themeText.innerText = themeText.innerText === "Dark Theme" ? "Light Theme":"Dark Theme"
}

function togglePassword(id, _icon, toggle=true) {
    if (toggle){
        const selector = document.getElementById(id);
        const icon = document.getElementById(_icon);
        if (selector.type === "password"){
            selector.type = "text"
            icon.src = "images/eye-closed.png"
        }else {
            selector.type = "password"
            icon.src = "images/eye-opened.png"
        }
    }
}

function isValidNumber(number) {
    //check if value passed is a valid number
    return !isNaN(number) && number !== '' && number !== null
}

function shuffleString(string) {
    /*convert the string to array first since string types are immutable
    * shuffle the array
    * join the array items back to a string*/
    return string.split("").sort( ()=> Math.random() - 0.5).join("")
}

function checkPasswordStrength(password) {
    //check the strength of a password
    if(password.length>0){
        let specialChars = 0
        let numChars = 0
        let lowerChars = 0
        let upperChars = 0
        password.split('').forEach(item => {
            specialChars += specialCharacters.includes(item)
            numChars += numberCharacters.includes(item)
            lowerChars += lowercaseCharacters.includes(item)
            upperChars += uppercaseCharacters.includes(item)
        })
        return (specialChars>1?1:specialChars)+(numChars>1?1:numChars)+(lowerChars>1?1:lowerChars)+(upperChars>1?1:upperChars)+(password.length>=8?1:0);
    }
    return -1
}

function generatePassword(){
    /*
    * Generate password based on user inputs
    * */
    const hasSpecialCharacters = document.getElementById('specialChars').checked
    const hasNumbers = document.getElementById('numbers').checked
    const hasLowercase = document.getElementById('lowercase').checked
    const hasUppercase = document.getElementById('uppercase').checked
    const passwordLength = document.getElementById('letterSize').value

    if (isValidNumber(passwordLength)){
        if (passwordLength >= hasSpecialCharacters+hasNumbers+hasLowercase+hasUppercase){
            let pwdList = [];
            let passcode = "";
            if (hasSpecialCharacters){
                pwdList.push(specialCharacters);
            }
            if(hasNumbers){
                pwdList.push(numberCharacters);
            }
            if(hasLowercase){
                pwdList.push(lowercaseCharacters)
            }
            if(hasUppercase){
                pwdList.push(uppercaseCharacters)
            }
            // iterate to ensure each checkbox is represented
            pwdList.forEach(item => passcode += item[Math.floor(Math.random() * item.length)])
            passcode = shuffleString(passcode)
            if (passcode.length !== passwordLength){
                for(let i = passcode.length; i<passwordLength; i++){
                    pwdList.sort(()=>Math.random()-0.5)
                    passcode += pwdList[0][Math.floor(Math.random() * pwdList[0].length)]
                }
                passcode = shuffleString(passcode)
            }
            // alert(checkPasswordStrength(passcode))
            document.getElementById('generatedPassword').textContent = passcode
            generateQR("qrcode2", passcode)
        }else {
            alert("Based on the checkboxes checked, the password length is inaccurate.")
        }
    }else {
        alert('The password length set is incorrect')
    }
}
function validateVaultInputs(formContent) {
    const username = formContent.get("newUsername");
    const pwd = formContent.get("newPassword");
    const pwd_confirm = formContent.get("newCPassword");
    const website = formContent.get("newVaultWebsite");
    const accName = formContent.get("newAccName");
    const appName = formContent.get("newAppName");
    const playMins = formContent.get("newPlayMins");
    const score = formContent.get("newScore");
    const pwdLevel = formContent.get("newPasswordLevel");

    let errors = []
    if (username.length === 0) errors.push("Username cannot be empty");
    if (pwd.length === 0) errors.push("Password cannot be empty");
    if (pwd_confirm.length === 0) errors.push("Confirm password cannot be empty");
    if (website.length === 0) errors.push("Confirm password cannot be empty");
    if (accName.length === 0) errors.push("Account Name cannot be empty");
    if (appName.length === 0) errors.push("Application Name cannot be empty");
    if (playMins.length === 0) errors.push("Play Mins value is required");
    if (score.length === 0) errors.push("Score value is required");
    if (pwdLevel.length === 0) errors.push("Password value is required");
    if(pwd.length>0 && pwd_confirm.length>0 && pwd !== pwd_confirm) errors.push("Password mismatch");

    if (errors){
        return errors.join('<br>');
    }
    return ""
}
function copyPassword() {
    // copy text/string to clipboard
    const password = document.getElementById('generatedPassword').textContent
    navigator.clipboard.writeText(password).then(() => alert("Password copied successfully"));
}
function generateQR(idSelector, textContent) {
    //generate QR code and display it
    document.getElementById(idSelector).innerHTML=""
    new QRCode(idSelector, {
        text: textContent,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H
    })
    document.querySelector("#"+idSelector+" img").removeAttribute("title")
}

function searchVault() {
    //search vault
    const search = document.getElementById("searchContent").value.trim()
    const writerTable = document.getElementById("searchTable");
    writerTable.classList.remove("hidden", "error", "success");
    if(search.length > 0){
        let tr = "";
        let counter = 1;
        if(search.toLowerCase() === "#all_vaults"){
            const master = passwordData["masterUsername"]
            let usr = master["username"]
            let accName = master["accountName"]
            let website = master["website"]
            tr += getTableRow(counter, usr, accName, "Master", website, getButtons("master", -1), "odd")
            counter++;

            if(Object.keys(passwordData).includes("accounts")){
                const accounts = passwordData["accounts"];
                if (accounts){
                    accounts.forEach((data, index)=>{
                        usr = data["username"]
                        accName = data["accountName"]
                        website = data["website"]
                        const trClass = counter % 2 === 0?"even":"odd";
                        tr += getTableRow(counter, usr, accName, "Vault", website, getButtons("vault", index), trClass)
                        counter++;
                    })
                }
            }
        }else {
            if(Object.keys(passwordData).includes("accounts")){
                const accounts = passwordData["accounts"];
                writerTable.innerHTML = JSON.stringify(accounts, null, 2);
                if (accounts){
                    accounts.forEach((data, index)=>{
                        let usr = data["username"]
                        let accName = data["accountName"]
                        let website = data["website"]
                        let extraInfo = data["extraInfo"]
                        let appName = data["application"]

                        const trClass = counter % 2 === 0?"even":"odd";
                        if(
                            usr.toLowerCase().includes(search.toLowerCase()) ||
                            accName.toLowerCase().includes(search.toLowerCase()) ||
                            appName.toLowerCase().includes(search.toLowerCase()) ||
                            website.toLowerCase().includes(search.toLowerCase()) ||
                            extraInfo.toLowerCase().includes(search.toLowerCase())
                        ){
                            tr += getTableRow(counter, usr, accName, "Vault", website, getButtons("vault", index), trClass)
                            counter++;
                        }
                    })
                }
            }
        }
        if(tr){
            windowVault.classList.add("width1000")
            writerTable.innerHTML = `
            <table class="table">
                <thead> 
                    <tr>
                        <th>#</th>
                        <th>Username</th>
                        <th>Acc Name</th>
                        <th>Acc Type</th>
                        <th>Website</th>
                        <th class="centered">BUTTONS</th>
                    </tr>
                </thead>
                <tbody>${tr}</tbody>
            </table>
            `
        }else {
            writerTable.innerHTML = "No record found";
            writerTable.classList.add("error");
        }
    }else {
        writerTable.innerHTML = "Search field cannot be blank"
        writerTable.classList.add("error")
        writerTable.classList.remove("success")
    }
}
function getButtons(vault, key) {
    return `<a class="btn btn-sm btn-show p-0" onclick="displayContent('${vault}', ${key})"><img src="images/info.webp" width="30" alt="" title="More information"/></a>
            <a class="btn btn-sm btn-edit p-0" onclick="editContent('${vault}', ${key})"><img src="images/edit.avif" width="25" alt="" title="Edit Record"/></a>
            <a class="btn btn-sm btn-del p-0" onclick="deleteContent('${vault}', ${key})"><img src="images/delete.png" width="25" alt="" title="Delete Record"/></a>`;
}

function getTableRow(id, username, accName, accType, website, buttons, classes) {
    return `<tr class="${classes}">
               <td>${id}</td><td>${username}</td> <td>${accName}</td> 
               <td class="uppercase">${accType}</td><td>${website}</td><td>${buttons}</td>
           </tr>`
}
function displayContent(root, key) {
    const selectedData = root === "master"?passwordData["masterUsername"]:passwordData["accounts"][key];
    document.getElementById("vaultAccName").innerText = selectedData["accountName"];
    document.getElementById("vaultWebsite").innerHTML = `<a href="${selectedData['website']}" target="_blank">${selectedData['website']}</a>`;
    document.getElementById("vaultUsername").innerText = selectedData["username"];
    document.getElementById("vaultPassword").innerText = selectedData["password"];
    document.getElementById("vaultStrength").innerText = `${selectedData["passwordStrength"]}/5`;
    document.getElementById("vaultNotes").innerText = selectedData["extraInfo"];
    generateQR("qrcode", selectedData["password"])
}
function editContent(root, key) {
    document.getElementById("vaultQuery").value=key;
    document.getElementById("vaultBtnName").innerText="Update Record";
    windowNewVault.classList.remove("hidden")

    const data = root === "master"? passwordData["masterUsername"] : passwordData["accounts"][key];
    document.getElementById("newUsername").value = data["username"]
    document.getElementById("newPassword").value = data["password"]
    document.getElementById("newCPassword").value = data["password"]
    document.getElementById("newVaultWebsite").value = data["website"]
    document.getElementById("newAccName").value = data["accountName"]
    document.getElementById("newAppName").value = data["application"]
    document.getElementById("newPlayMins").value = data["playMins"]
    document.getElementById("newScore").value = data["score"]
    document.getElementById("newPasswordLevel").value = data["level"]
    document.getElementById("textarea").value = data["extraInfo"]
}
function deleteContent(root, key) {
    if(root.toLowerCase() === "vault"){
        passwordData["accounts"].splice(key, 1);
        searchVault()
    }else {
        alert("Master account cannot be deleted...")
    }
}
// Navigate windows
function navigateToSignIn() {
    if(!userLoggedIn){
        windowSignIn.classList.remove("hidden")
        windowRegister.classList.add("hidden")
        windowVault.classList.add("hidden")
        windowGeneratePassword.classList.add("hidden")
        windowLogoutUser.classList.add("hidden")
    }
}
function navigateToRegister() {
    if(!userLoggedIn){
        windowRegister.classList.remove("hidden")
        windowSignIn.classList.add("hidden")
        windowVault.classList.add("hidden")
        windowGeneratePassword.classList.add("hidden")
        windowLogoutUser.classList.add("hidden")
    }
}
function navigateToVault() {
    if(passwordData && typeof passwordData === "object"){
        displayContent("master", -1)
        windowVault.classList.remove("hidden")
        windowRegister.classList.add("hidden")
        windowSignIn.classList.add("hidden")
        windowGeneratePassword.classList.add("hidden")
        windowLogoutUser.classList.add("hidden")

        vaultTitle.classList.add("bold")
        pwdTitle.classList.remove("bold")
    }
}
function navigateToNewVault() {
    if(passwordData && typeof passwordData === "object"){
        windowNewVault.classList.remove("hidden")
        windowRegister.classList.add("hidden")
        windowSignIn.classList.add("hidden")
        windowGeneratePassword.classList.add("hidden")
        windowLogoutUser.classList.add("hidden")
        document.getElementById("vaultQuery").value="";
        document.getElementById("vaultBtnName").innerText="Add New Record";

        //clear form
        document.getElementById("newUsername").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("newCPassword").value = "";
        document.getElementById("newVaultWebsite").value = "";
        document.getElementById("newAccName").value = "";
        document.getElementById("newAppName").value = "";
        document.getElementById("newPlayMins").value = "";
        document.getElementById("newScore").value = "";
        document.getElementById("newPasswordLevel").value = "";
        document.getElementById("textarea").value = "";
    }
    navigateHideSearchTable();
}
function navigateToPasswordGenerator() {
    if(passwordData && typeof passwordData === "object"){
        windowGeneratePassword.classList.remove("hidden")
        windowRegister.classList.add("hidden")
        windowSignIn.classList.add("hidden")
        windowVault.classList.add("hidden")
        windowLogoutUser.classList.add("hidden")

        pwdTitle.classList.add("bold")
        vaultTitle.classList.remove("bold")
    }
}
function navigateToLogoutUser() {
    document.getElementById("pwd_logout").value = ""
    if(passwordData && typeof passwordData === "object"){
        windowLogoutUser.classList.remove("hidden")
        windowRegister.classList.add("hidden")
        windowSignIn.classList.add("hidden")
        windowVault.classList.add("hidden")
        windowGeneratePassword.classList.add("hidden")

        pwdTitle.classList.remove("bold")
        vaultTitle.classList.remove("bold")
    }
}
function navigateHideSearchTable() {
    windowVault.classList.remove("width1000")
    document.getElementById("searchTable").classList.add("hidden")

}
(function() {
    document.getElementById('login').addEventListener('submit', loginUser);
    document.getElementById('register').addEventListener('submit', registerAccount);
    document.getElementById('registerNewVault').addEventListener('submit', registerNewVault);
}())
