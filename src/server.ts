import express from 'express';
import {apiAuthRouter} from "./authenticationroutes";
import {apiBookRouter} from "./booksroutes";
import {apiBorrowRouter} from "./borrowroutes";
import {apiUserRouter} from "./usersroutes";
const appExpress = express();

appExpress.use(express.json());

//La fonctionnalité d'authentification
appExpress.use('/api/auth', apiAuthRouter)
appExpress.use('/api/Book', apiBookRouter)
appExpress.use('/api', apiBorrowRouter)
appExpress.use('/api/profile-user', apiUserRouter)
//Faisons démarrer le serveur 
appExpress.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});