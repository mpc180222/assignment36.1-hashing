const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config")
const jwt = require("jsonwebtoken");
const { ensureLoggedIn } = require("../middleware/auth")
const User = require("../models/user")

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

 router.post('/login', async (req, res, next)=>{
    try{
        const {username, password} = req.body;
        if(!username || !password){
            throw new ExpressError("Missing info", 400)
        }
    let response = await User.authenticate(username, password);
    if(response === true){ 
    await User.updateLoginTimestamp(username);
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({message: `Logged in`, token});}
    }
    catch(e){

        return next(e);
    }

})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 * 
 */
 router.post('/register', async (req, res, next)=>{
    try{
        const {username, password, first_name, last_name, phone} = req.body;
        if(!username || !password || !first_name || !last_name || !phone){
            return new ExpressError("Missing info", 400)
        }
    let newUser = await User.register(username, password, first_name, last_name, phone);
    await User.updateLoginTimestamp(username);
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({token});
    }
    catch(e){

        return next(e);
    }

})

module.exports = router;