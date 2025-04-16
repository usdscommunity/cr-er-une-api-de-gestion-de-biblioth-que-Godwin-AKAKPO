import express from 'express';
import {Request, Response} from 'express';
import {Book} from '../models/Book';
import {sql_db_pool_promise} from "../database/mysql";
import {authenticationfilter} from "../../security/auth-filter";
import {authorizeRole} from "../../security/auth-filter";

//const appExpress = express();
const BookRouter = express.Router();

//Ajouter un livre
BookRouter.post("", authenticationfilter, authorizeRole('admin'), async(req : Request, res :Response)  =>{
    const book = req.body as Book;

    if (!book.title || !book.author || !book.isbn){
        res.status(400).json({message:"Les champs titre, auteur, et isbn sont requis pour l'ajout de livre"});
        return;
    }
    try {
       
        const sqlRequest : string = "INSERT INTO book(title, author, isbn, available, user_id) values(?, ?, ?, ?, ?)";
        const [result] = await sql_db_pool_promise.execute(
            sqlRequest,
            [book.title, book.author,  book.isbn, book.available, book.user_id]
        )
        res.status(201).json({message: "Livre crée avec succès !", book: book, result:result});
        return;
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la creation du livre"})
        return;
    }

});

//RETRIEVE : Récupérer tous les livres

BookRouter.get("", authenticationfilter, async(req : Request, res :Response)  =>{
    try {
        const sqlRequest : string = "SELECT * FROM book";
        const [result] = await sql_db_pool_promise.execute(sqlRequest);
        res.status(200).json(result);
        return;
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la récupération des livres "})
        return;
    }
});

//RETRIEVE : Récupérer un livre par son ID   
BookRouter.get("/:id", authenticationfilter,  async(req : Request, res :Response)  =>{
    const id = req.params['id'];

    try {
        const sqlRequest : string = "SELECT * FROM book WHERE id = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [id])as any[];
        if (result['length'] === 0){
            res.status(404).json({message : "Livre non retrouvé "})
        }
        res.status(200).json(result);
        return;

    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la récupération du Livre "})
        return;
    }
});

//Mettre à jour une livre
BookRouter.put("/:id", authenticationfilter, authorizeRole('admin'), async(req : Request, res :Response)  =>{
    const id = req.params['id'];
    const book = req.body as Book;

    if (!book.title || !book.author || !book.isbn ){
        res.status(400).json({message:"Les champs title, author, isbn sont requis pour la mise à jour"});
        return;
    }
    try {
        const sqlRequest : string = "UPDATE book SET title = ?, author = ?,  isbn = ?, available = ?, user_id = ? WHERE id = ?";
        const [result] = await sql_db_pool_promise.execute(
            sqlRequest,
            [book.title, book.author, book.isbn, book.available, book.user_id, id]
        )as any[];
        if (result['affectedRows'] == 0){
            res.status(404).json({message : "Livre non retrouvé "})
            return;
        } 
        res.status(201).json({message: "Livre mis à jour avec succès !", book: book, result:result});
        return;
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la mis à jour du livre"})
        return;
    }
});

//Supprimer une livre
BookRouter.delete("/:id", authenticationfilter, authorizeRole('admin'), async(req : Request, res :Response)  =>{
    const id = req.params['id'];
    const book = req.body as Book;
    try {
        const sqlRequest : string = "DELETE FROM book WHERE id = ?";
        const [result] = await sql_db_pool_promise.execute(
            sqlRequest,
            [id]
        )as any[];
        if (result['affectedRows'] === 0){
            res.status(404).json({message : "Livre non retrouvé "})
            return;
        } 
        res.status(201).json({message: "Livre supprimé avec succès !", book: book, result:result});
        return;
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la suppression du livre "});
        return;
    }
});

export const apiBookRouter = BookRouter