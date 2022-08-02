const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config")
const jwt = require("jsonwebtoken");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")
const Message = require("../models/message")



/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/


 router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try{
    const id = req.params.id;
    const results = await Message.get(id);
    console.log(results.to_user.username, req.user.username)
    if(results.from_user.username !== req.user.username && results.to_user.username !== req.user.username){
        throw new ExpressError("You are neither the sender nor receiver of this message", 400);
    }
    return res.json({message:results})}
    catch(e){
        return next(e);
    }

})



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

 router.post('/', ensureLoggedIn, async (req, res, next) => {
    try{
    const {from_username, to_username, body} = req.body;
    const results = await Message.create(from_username, to_username, body)
    return res.json({message:results})}
    catch(e){
        return next(e);
    }

})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

 router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try{
    const msgCheck = await db.query(`SELECT to_username from messages WHERE id = $1`, [req.params.id]);
    if (msgCheck.rows[0].to_username !== req.user.username){
        throw new ExpressError("You can only view messages sent to you", 400);
    }

    const results = await Message.markRead(req.params.id);
    return res.json({message:results})}
    catch(e){
        return next(e);
    }

})

 module.exports = router;