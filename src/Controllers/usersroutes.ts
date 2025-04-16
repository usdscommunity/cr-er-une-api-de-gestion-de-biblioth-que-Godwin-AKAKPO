import express from 'express';
import {Request, Response} from 'express';
import {sql_db_pool_promise} from "../database/mysql";
import {authenticationfilter} from "../../security/auth-filter"
const bcrypt = require('bcryptjs');
import {authorizeRole} from "../../security/auth-filter";
const userRouter = express();

//Récupérons l'utilisateur connecté 
userRouter.get("/",authenticationfilter, async(req: Request, res: Response) => {
    const UserId = req.userId;
    if (!UserId) {
        res.status(401).json({ message: "Utilisateur non connecté" });
        return;
    }
    try {
        const sqlRequest = "SELECT id, email, role FROM user WHERE id = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [UserId]) as any [];
        if(result['length'] === 0) {
            res.status(404).json({message: "Aucun utilisateur n'est connecté actuellement"});
            return;
        }
        res.status(200).json({message: " Information de l'Utilisateur connecté actuellement:", result :  result});
        
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Echec lors de la récupération de l'utilisateur connecté"});
    }
        
}) 
userRouter.put("/role/:id", authenticationfilter, authorizeRole('admin'), async (req: Request, res: Response) => { //Donnons la possibilité à un administrateur de chang
    const userIdToUpdate = req.params.id;
    const { role } = req.body;

    const allowedRoles = ['admin', 'lecteur'];

    if (!role || !allowedRoles.includes(role)) {
        res.status(400).json({ message: "Rôle invalide. Les rôles valides sont : 'admin', 'lecteur'" });
        return;
    }

    try {
        const sqlRequest = "UPDATE user SET role = ? WHERE id = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [role, userIdToUpdate]);

        res.status(200).json({ message: `Rôle de l'utilisateur mis à jour avec succès` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du rôle" });
    }
});

export const apiUserRouter = userRouter;