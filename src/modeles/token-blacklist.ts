import {sql_db_pool_promise} from "../mysql";
//Je vais définir une fonction qui va inséré le token dans la table des tokens blacklisté en base de donnée 
export const insertToken = async(token:string)  => {
    const sqlRequest = "INSERT INTO tokens_blacklist(token) VALUES (?)";
    const [result] = await sql_db_pool_promise.execute(sqlRequest, [token]);
}

