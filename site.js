document.getElementById('btnGetData').addEventListener("click", getdata);
document.getElementById('btnLogout').addEventListener("click", logout);
document.getElementById('btnLogin').addEventListener("click", login);

function showLoginForm(show, username) {
    if (show) {
        document.getElementsByClassName('login-form')[0].style.display = "block";
        document.getElementById('btnLogout').style.display = "none";
    }
    else {
        document.getElementsByClassName('login-form')[0].style.display = "none";
        document.getElementById('btnLogout').style.display = "block";
        document.getElementById('btnLogout').value = `Logout ${username}`;
        
    }
}

const serverUri = "http://127.0.0.1:4071";

function logout() {
    document.getElementById('content').innerHTML = '';
    return axios.post(`${serverUri}/logout`, {}, {withCredentials : true})
                .then(res => {                   
                    showLoginForm(true);                  
                });
    
}

function login() {
    document.getElementById('content').innerHTML = '';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    return axios.post(`${serverUri}/login`, {username, password}, {withCredentials : true}) 
                    .then(res => {                        
                       showLoginForm(false, username)
                    })
                    .catch(function (error) {            
                        document.getElementById('content').innerHTML = error;           
                    });  
}

function getdata() {
    document.getElementById('content').innerHTML = '';
    axios.get(`${serverUri}/protected`, {withCredentials : true})
         .then(function (response) {
            document.getElementById('content').innerHTML = JSON.stringify(response.data);        
        })
        .catch(function (error) {            
            document.getElementById('content').innerHTML = error;           
        });        
}


