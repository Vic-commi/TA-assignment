const jwt = require('jsonwebtoken');

const generateAccessToken = (id, email) => {
    return jwt.sign(
        {
            'user_id': id,
            'email': email
        }, 
            process.env.TOKEN_SECRET, 
        {
            expiresIn: "1h"
        }
    );
}

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send("Access Denied");
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid Token");
        req.user = user;
        next();
    });
};

const isUserRegistered = (req, res, next) => {
    const token = req.cookies.token;

    if(!token) {
        req.user = null;
        next();
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        req.user = user;
        next();
    });

}

module.exports = { generateAccessToken, verifyToken, isUserRegistered };