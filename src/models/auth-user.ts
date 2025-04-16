import {sql_db_pool_promise} from "../database/mysql";
const bcrypt = require('bcrypt');

async function createUser(email: string, password: string, role: string = 'lecteur'){
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt)

    const [result]=await sql_db_pool_promise.execute(
        'INSERT INTO user (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role]
    );
}

export {createUser}