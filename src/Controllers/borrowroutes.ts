import express from 'express';
import {Request, Response} from 'express';
import {sql_db_pool_promise} from "../database/mysql";
import {authenticationfilter} from "../../security/auth-filter";
import {authorizeRole} from "../../security/auth-filter";

//const appExpress = express();
const BorrowRouter = express.Router();
const dayjs = require('dayjs');

//Ecrivons le code de la route pour enregistrer un emprunt 
BorrowRouter.post("/borrow/:bookId",  authenticationfilter, authorizeRole('lecteur'), async(req: Request, res: Response) =>{
    const bookId = req.params['bookId'];
    const UserId = req.userId; // Je récupère l'id de l'utilisateur connecté grace à mon middleware
    try {
        //Vérifions d'abord si le livre que l'utilisateur essai d'emprunter existe
        const sqlRequest1 = "SELECT * FROM book WHERE id =  ?";
        const [result1] = await sql_db_pool_promise.execute(sqlRequest1, [bookId]) as any[];
        if (result1['length'] === 0){
            //Il s'agit du cas ou le livre n'existe pas on le lui signale
            res.status(404).json({message: "Le livre que vous essayez d'emprunter n'existe pas dans cette bibliothèque"});
        }
        //Si le livre existe alors on  vérifie mtn qu'il n'a pas encore été emprunté
        const sqlRequest2 = "SELECT * FROM borrowhistories WHERE book_id = ? AND returned_at IS NULL";
        const [result2] = await sql_db_pool_promise.execute(sqlRequest2, [bookId]) as any[];
        if (result2['length'] > 0){
            res.status(404).json({message: "Le livre que vous desirez emprunté a déja été emprunté"})
        }
        //Dans le cas ou le livre existe et est disbonible alors on procède à l'enregistrement de l'emprunt de l'utilisateur
        const sqlRequest3 = "INSERT INTO borrowhistories(book_id, user_id) VALUES (?,?)";
        const [result3] = await sql_db_pool_promise.execute(sqlRequest3, [bookId, UserId]);
        const sqlResult4 = "UPDATE book SET available = 0, user_id = ? WHERE id = ?";
        const [result4] = await sql_db_pool_promise.execute(sqlResult4, [UserId , bookId]);
        res.status(200).json({message: "L'emprunt du livre a été enregistré avec succcès", result3 : result3});
            
        
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de l'enregistrement de l'emprunt"})
    }
})

//Ecrivons le code de la route pour retourner un livre emprunter 
BorrowRouter.post("/return/:bookId", authenticationfilter, authorizeRole('lecteur'), async(req : Request, res : Response) => {
    const bookId = req.params['bookId'];
    const UserId = req.userId;
    try{
        //Vériifions d'abord si le livre que l'utilisateur essaie de retourner existe dans la base de données
        const sqlRequest1 = "SELECT * FROM book WHERE id =  ?";
        const [result1] = await sql_db_pool_promise.execute(sqlRequest1, [bookId]) as any[];
        if (result1['length'] === 0){
            //Il s'agit du cas ou le livre n'existe pas on le lui signale
            res.status(404).json({message: "Le livre que vous essayez de retourner n'existe pas dans cette bibliothèque"});
            return;
        }
        //Si le livre existe alors on  vérifie mtn qu'il a vraiment été emprunté et n'est pas encore retourné 
        const sqlRequest2 = "SELECT * FROM borrowhistories WHERE user_id = ? AND book_id = ? AND returned_at IS NULL";
        const [result2] = await sql_db_pool_promise.execute(sqlRequest2, [UserId, bookId]) as any[];
        if (result2['length'] === 0){
            res.status(404).json({message: "Aucun emprunt n'est actif pour ce livre à cet instant"})
            return;
        }      
        //Dans le cas ou le livre existe et a été vraiment emprunter on enregistre mtn le retour du livre 
        const sqlRequest3 = "UPDATE borrowhistories SET returned_at = ? WHERE id = ?";
        const [result3] = await sql_db_pool_promise.execute(sqlRequest3, [
            dayjs().format('YYYY-MM-DD HH:mm:ss'),
            result2[0].id
        ]);
        const sqlResult4 = "UPDATE book SET available = ?,  user_id = NULL WHERE id = ?";
        const [result4] = await sql_db_pool_promise.execute(sqlResult4, [1, bookId]);
        res.status(200).json({message: "Le livre que vous avez emprunté a été retourné avec succès"});
            
        
    }catch (err) {
        console.log(err);
        res.status(500).json({message : "Echec lors du retour du livre emprunte", err})
    }
})

//Ecrivons le code de la route pour retourner un livre emprunter 
BorrowRouter.get("/my-books", authenticationfilter, authorizeRole('lecteur'), async (req : Request, res : Response)=>{
    const UserId = req.userId;
   
    try {
        const sqlRequest = "SELECT title, author FROM Book WHERE user_id = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [UserId]) as any[];
        if (result['length'] === 0 ){
            res.status(404).json({message: "Vous n'avez aucun livre à votre actif"});
        }
        res.status(200).json({result})
        
    } catch (err) {
        console.log(err)
        res.status(500).json({message : "Erreur lors de la récupération des livres empruntes"})
        
    }
})
export const apiBorrowRouter = BorrowRouter