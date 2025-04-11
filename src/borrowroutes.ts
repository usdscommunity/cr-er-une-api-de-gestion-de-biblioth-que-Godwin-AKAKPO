import express from 'express';
import {Request, Response} from 'express';
import {sql_db_pool_promise} from "./mysql";
import {authenticationfilter} from "../security/auth-filter";
import {authorizeRole} from "../security/auth-filter";

//const appExpress = express();
const BorrowRouter = express.Router();
const dayjs = require('dayjs');

//Ecrivons le code de la route pour enregistrer un emprunt 
BorrowRouter.post("/borrow/:bookId",  authenticationfilter, authorizeRole('lecteur'), async(req: Request, res: Response) =>{
    const bookId = req.params['bookId'];
    const UserId = req.userId; // Je récupère l'id de l'utilisateur connecté grace à mon middleware
    try {
        //Vérifions d'abord si le livre que l'utilisateur essai d'emprunter existe
        const sqlRequest = "SELECT * FROM books WHERE id =  ?";
        const [result1] = await sql_db_pool_promise.execute(sqlRequest, [bookId]) as any[];
        if (result1['length'] === 0){
            //Il s'agit du cas ou le livre n'existe pas on le lui signale
            res.status(404).json({message: "Le livre que vous essayez d'emprunter n'existe pas dans cette bibliothèque"});
        }else{
            //Si le livre existe alors on  vérifie mtn qu'il n'a pas encore été emprunté
            const sqlRequest = "SELECT * FROM borrowhistory WHERE book_id = ? AND returned_at IS NULL";
            const [result2] = await sql_db_pool_promise.execute(sqlRequest, [bookId]) as any[];
            if (result2['length'] > 0){
                res.status(404).json({message: "Le livre que vous desirez emprunté a déja été emprunté"})
            }else{
                //Dans le cas ou le livre existe et est disbonible alors on procède à l'enregistrement de l'emprunt de l'utilisateur
                const sqlRequest = "INSERT INTO borrowhistory(book_id, user_id) VALUES (?,?)";
                const [result3] = await sql_db_pool_promise.execute(sqlRequest, [bookId, UserId]);
                const sqlResult = "UPDATE books SET available = 0, user_id = ? WHERE id = ?";
                const [result4] = await sql_db_pool_promise.execute(sqlResult, [UserId , bookId]);
                res.status(200).json({message: "L'emprunt du livre a été enregistré avec succcès", result3 : result3});
            }
        }
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
        const sqlRequest = "SELECT * FROM books WHERE id =  ?";
        const [result1] = await sql_db_pool_promise.execute(sqlRequest, [bookId]) as any[];
        if (result1['length'] === 0){
            //Il s'agit du cas ou le livre n'existe pas on le lui signale
            res.status(404).json({message: "Le livre que vous essayez de retourner n'existe pas dans cette bibliothèque"});
        }else{
            //Si le livre existe alors on  vérifie mtn qu'il a vraiment été emprunté et n'est pas encore retourné 
            const sqlRequest = "SELECT * FROM borrowhistory WHERE user_id = ? AND book_id = ? AND returned_at IS NULL";
            const [result2] = await sql_db_pool_promise.execute(sqlRequest, [UserId, bookId]) as any[];
            if (result2['length'] === 0){
                res.status(404).json({message: "Aucun emprunt n'est actif pour ce livre à cet instant"})
            }else{
               
                //Dans le cas ou le livre existe et a été vraiment emprunter on enregistre mtn le retour du livre 
                const sqlRequest = "UPDATE borrowhistory SET returned_at = ? WHERE id = ?";
                const [result3] = await sql_db_pool_promise.execute(sqlRequest, [
                dayjs().format('YYYY-MM-DD'),
                result2[0].id
                ]);
                const sqlResult = "UPDATE books SET available = ?,  user_id = NULL WHERE id = ?";
                const [result4] = await sql_db_pool_promise.execute(sqlResult, [1, bookId]);
                res.status(200).json({message: "Le livre que vous avez emprunté a été retourné avec succès"});
            }
        } 
    }catch (err) {
        console.log(err);
        res.status(500).json({message : "Echec lors du retour du livre emprunte", err})
    }
})

//Ecrivons le code de la route pour retourner un livre emprunter 
BorrowRouter.get("/my-books", authenticationfilter, authorizeRole('lecteur'), async (req : Request, res : Response)=>{
    const UserId = req.userId;
    console.log("userId dans /my-books :", req.userId);
    try {
        const sqlRequest = "SELECT title, author FROM Books WHERE user_id = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [UserId]) as any[];
        if (result['length'] === 0 ){
            res.status(404).json({message: "Vous n'avez aucun livre à votre actif"});
        }else {
            res.status(200).json({result})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message : "Erreur lors de la récupération des livres empruntes"})
        
    }
})
export const apiBorrowRouter = BorrowRouter