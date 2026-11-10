
const TENANT_ID = process.env.ENTRA_TENANT_ID;
const API_CLIENT_ID = process.env.ENTRA_API_CLIENT_ID;

const ISSUER =
    `https://login.microsoftonline.com/${TENANT_ID}/v2.0`;

let verifierPromise;

async function getVerifier() {
    if (!TENANT_ID || !API_CLIENT_ID) {
        throw new Error("Missing Microsoft Entra configuration.");
    }

    if (!verifierPromise) {
        verifierPromise = import("jose").then(
            ({ createRemoteJWKSet, jwtVerify }) => ({
                jwtVerify,
                jwks: createRemoteJWKSet(
                    new URL(
                        `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
                    )
                )
            })
        );
    }

    return verifierPromise;
}

async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please sign in before adding a course."
        });
    }

    try {
        const token = authorization.slice(7);
        const { jwtVerify, jwks } = await getVerifier();

        const { payload } = await jwtVerify(token, jwks, {
            issuer: ISSUER,
            audience: API_CLIENT_ID,
            algorithms: ["RS256"]
        });

        const scopes = (payload.scp || "").split(" ");

        if (!scopes.includes("access-as-user")) {
            return res.status(403).json({
                message: "You do not have permission to add courses."
            });
        }

        req.user = {
            id: payload.oid || payload.sub,
            name: payload.name || "User"
        };

        next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired authentication token."
        });
    }
}

module.exports = { requireAuth };
