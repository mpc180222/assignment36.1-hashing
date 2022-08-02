/** User class for message.ly */

const { DB_URI, BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../expressError");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register(username, password, first_name, last_name, phone) {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      const result = await db.query(`INSERT INTO users (username, password, first_name, last_name,
        phone, join_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        returning username, first_name, last_name, phone`, [username, hashedPassword, first_name, last_name, phone]);
        return result.rows[0];
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    
    const result = await db.query(`SELECT username, password FROM users WHERE username = $1`, [username])
    
    if (result.rows.length === 0 ){
      throw new ExpressError("User not found", 404)
    }
    const correctPassword = result.rows[0].password;

    const passwordResponse = await bcrypt.compare(password, correctPassword);
    return passwordResponse

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 

    const results = await db.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE username = $1 RETURNING username, last_login_at`, [username])
    
    if(results.rows.length === 0){throw new ExpressError("User not found", 400)}
  }

    

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {

    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`)

    return results.rows;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 

    const results = await db.query(`SELECT username, first_name, last_name, phone,
      join_at, last_login_at FROM users WHERE username = $1`, [username])
    if(results.rows.length === 0){throw new ExpressError("User not found", 400)}
    return results.rows[0];

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 

    const results = await db.query(`SELECT messages.id, messages.from_username, messages.to_username, messages.body,
    messages.sent_at, messages.read_at, users.username, users.first_name, users.last_name, users.phone FROM messages LEFT JOIN
    users ON messages.to_username = users.username WHERE messages.from_username = $1`, [username]);
    if(results.rows.length === 0){throw new ExpressError("Messages not found from this user", 400)}
    
    return results.rows.map(r => ({id: r.id, toUser: {username: r.username, first_name: r.first_name, last_name: r.last_name, phone: r.phone}, 
      body: r.body, sentAt: r.sent_at, readAt: r.read_at}))
    // to_user: {r.username, r.first_name, r.last_name, r.phone} 
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 

    const results = await db.query(`SELECT messages.id, messages.from_username, messages.to_username, messages.body,
    messages.sent_at, messages.read_at, users.username, users.first_name, users.last_name, users.phone FROM messages LEFT JOIN
    users ON messages.from_username = users.username WHERE messages.to_username = $1`, [username]);
    if(results.rows.length === 0){throw new ExpressError("Messages not found to this user", 400)}
    
    return results.rows.map(r => ({id: r.id, fromUser: {username: r.username, first_name: r.first_name, last_name: r.last_name, phone: r.phone}, 
      body: r.body, sentAt: r.sent_at, readAt: r.read_at}))

  }
}


module.exports = User;