import express from 'express';
import {Request, Response} from 'express';
import {createUser} from "../models/auth-user";
import {User} from  '../models/User';
import {sql_db_pool_promise} from "../database/mysql";
import { generateToken } from '../../security/jwt-auth';
import {authenticationfilter} from "../../security/auth-filter";
import {insertToken} from "../models/token-blacklist";
const bcrypt = require('bcrypt');


//const appExpress = express();
const authRouter = express.Router();
const tokenBlacklist = new Set();

//Inscription de utilisateurs
authRouter.post("/register", async(req : Request, res :Response)  =>{
    const user = req.body as User;

    if (!user.email || !user.password){
        res.status(400).json({message:"Veuillez remplir tous les champs"});
        return;
    }
    const sqlRequest = "SELECT * FROM user WHERE email = ?";
    const [result] = await sql_db_pool_promise.execute(sqlRequest, [user.email]) as any [];
    if (result['length']> 0){
        res.status(406).json({message: "Un utilisateur existe déja avec ce mail"});
        return;
    }
    try {
        await createUser(user.email, user.password, user.role);
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'User create failed' });
    }
});

//Connexion des utilisateurs 
authRouter.post("/login", async(req : Request, res :Response)  =>{
    const { email, password } = req.body;

    if (!email || !password){
        res.status(400).json({message:"Email incorrect"});
    }
    try {
        const sqlRequest = "SELECT * FROM user WHERE email = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [email]) as any[];
        const users = result as any[];

        if (users.length === 0){
           res.status(401).json({message : "Email incorrect"});
           return;
        }
        const user = users[0];
        if (!(await bcrypt.compare(password, user.password))){
            res.status(401).json({message : "Mot de passe incorrect "});
            return;
        }
        const token = generateToken(user.id)
        res.status(200).json({"token": token})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }

});

//Deconnexion des utilisateurs 
authRouter.post("/logout",   async(req : Request, res : Response)=>{
    const authHeader = req.headers['authorization'] as string;
    const token = authHeader.replace("Bearer ", "");
    try {
        await insertToken(token);  // Ici on procède à  l'enregistrement du token dans la base de données précisement dans la table token_blacklist
       
        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la déconnexion" });
    }
   
})


export const apiAuthRouter = authRouter; 
export const authTokensBlackList = tokenBlacklist;