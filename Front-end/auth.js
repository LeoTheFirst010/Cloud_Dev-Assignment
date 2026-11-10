
const AUTH_CONFIG = {
    tenantId: "9cc2575b-3932-4421-a59b-02b4dc9b0940",
    frontendClientId: "e3c46f69-a6bc-4b62-98da-e82f49ec8141",
    apiClientId: "e8fafd5c-bab6-4c48-b5ba-6fd8dca45854"
};

const API_SCOPE =
    `api://${AUTH_CONFIG.apiClientId}/access_as_user`;


const msalApp = new msal.PublicClientApplication({
    auth: {
        clientId: AUTH_CONFIG.frontendClientId,
        authority:
            `https://login.microsoftonline.com/${AUTH_CONFIG.tenantId}`,
        redirectUri: window.location.origin + "/"
    },
    cache: {
        cacheLocation: "sessionStorage"
    }
});

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const userGreeting = document.getElementById("userGreeting");
const addCourseSection = document.getElementById("addCourseSection");

const loginRequest = {
    scopes: [API_SCOPE]
};

function updateLoginUI() {
    const account = msalApp.getActiveAccount() ||
        msalApp.getAllAccounts()[0];

    if (account) {
        msalApp.setActiveAccount(account);

        userGreeting.textContent =
            `Hello, ${account.name || account.username}`;

        loginButton.hidden = true;
        logoutButton.hidden = false;
        addCourseSection.hidden = false;
    } else {
        userGreeting.textContent = "Welcome, Guest";

        loginButton.hidden = false;
        logoutButton.hidden = true;
        addCourseSection.hidden = true;
    }
}

loginButton.addEventListener("click", async () => {
    try {
        const result = await msalApp.loginPopup(loginRequest);

        msalApp.setActiveAccount(result.account);
        updateLoginUI();
    } catch (error) {
        console.error("Login failed:", error);
    }
});

logoutButton.addEventListener("click", async () => {
    await msalApp.logoutPopup({
        account: msalApp.getActiveAccount(),
        mainWindowRedirectUri: window.location.href
    });

    updateLoginUI();
});

async function getCourseAccessToken() {
    const account = msalApp.getActiveAccount();

    if (!account) {
        throw new Error("Please sign in first.");
    }

    try {
        const result = await msalApp.acquireTokenSilent({
            ...loginRequest,
            account
        });

        return result.accessToken;
    } catch (error) {
        if (!(error instanceof msal.InteractionRequiredAuthError)) {
            throw error;
        }

        const result = await msalApp.acquireTokenPopup({
            ...loginRequest,
            account
        });

        return result.accessToken;
    }
}

updateLoginUI();
