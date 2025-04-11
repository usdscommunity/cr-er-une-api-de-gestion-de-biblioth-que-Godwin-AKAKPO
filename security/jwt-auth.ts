const jwtAuth = require('jsonwebtoken')
const jwtSecret  =  process.env.JWT_SECRET


export const generateToken = (userId : number) => {
    return jwtAuth.sign(
        {userId}, 
        jwtSecret, 
        {
            expiresIn : '1h',
        }
    );
 
}
export const verifytoken = (token: string)  => {
    return jwtAuth.verify(token, jwtSecret);
}
