
const header = {
    headers: {
       'Accept': 'application/json',
       'X-Client-ID': 'app',
       'ngrok-skip-browser-warning': 'true'
    }
}

const headerJson = () => {
    const token = localStorage.getItem(TOKEN_KEYS.access);
    return {
        headers: {
            // "content-type": 'application/json',
            // "Authorization": `Bearer ${token}`
            'Accept': 'application/json',
            'X-Client-ID': 'app',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
        }
    }
}

const TOKEN_KEYS = {
    access: 'access_token',
    refresh: 'refresh_token',
    is_authenticated: 'authenticate',
    sessionId: 'sessionId',
    role: 'user_role',
}

const setToken = ({access, refresh, user}) => {
    localStorage.setItem(TOKEN_KEYS.access, access);
    localStorage.setItem(TOKEN_KEYS.refresh, refresh);
    localStorage.setItem(TOKEN_KEYS.is_authenticated, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEYS.role, user?.role);
}

const getToken = () => {
    return {
      access: localStorage.getItem(TOKEN_KEYS.access),
      refresh: localStorage.getItem(TOKEN_KEYS.refresh),
      sessionId: localStorage.getItem(TOKEN_KEYS.sessionId)
    }
}

const getUser = () => {
    const userString = localStorage.getItem(TOKEN_KEYS.is_authenticated);
    return userString ? JSON.parse(userString) : null; 
}

const getUserRole = () => {
    return {
        role: localStorage.getItem(TOKEN_KEYS.role),
    } 
}

const setUrl = (url: string) => {
    localStorage.setItem("url", url)
}

const getUrl = () => {
    return localStorage.getItem("url") || "";
}

export {
    header,
    setToken,
    getToken,
    getUser,
    headerJson,
    getUserRole,
    setUrl,
    getUrl,
}