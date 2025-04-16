import { NextFunction, Request, Response } from "express";
import { verifytoken } from "./jwt-auth";
import { authTokensBlackList } from "../src/Controllers/authenticationroutes";
import { sql_db_pool_promise } from "../src/database/mysql";

declare global {
    namespace Express {
      interface Request {
        userId?: number;
      }
    }
}

export const authenticationfilter = async(req: Request, res: Response, next: NextFunction) : Promise<any> => {
    const authHeader = req.headers['authorization'] as string;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorizedd. Accès refusé !' });
    }
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized. Accès refusé !' });
    }
    
    try {
        // Vérifier si le token est dans la base de données blacklistée
        const sqlRequest = "SELECT * FROM blacklist_tokens WHERE token = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [token]) as any[];
        if (result.length > 0) {
            return res.status(401).json({ message: "Unauthorized. This token is blacklisted" });
        }
        const decoded = verifytoken(token);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: "Invalid token" });
    }
};



// Middleware pour vérifier les rôles des utilisateurs
export const authorizeRole = (role: 'admin' | 'lecteur') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.userId; // Je vais d'abord récupérer l'id de l'utilisateur 
        if (!userId) {
            res.status(401).json({ message: "Unauthorizedd. Accès refusé !" });
            return;
        }   

        try {
            // Je récupère mtn le role de l'utilisateur 
            const sqlRequest = "SELECT role FROM user WHERE id = ?";
            const [result] = await sql_db_pool_promise.execute(sqlRequest, [userId]) as any[];

            if (result.length === 0) {
                res.status(404).json({ message: "Utilisateur non reconnu" });
                return;
            }

            const userRole = result[0].role;

            if (userRole !== role) {
                res.status(403).json({ message: "Attention vous n'avez pas les roles requis pour effectuer cet action" });
                return;
            }

            next();
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Echec " });
            return;
        }
    };
};
