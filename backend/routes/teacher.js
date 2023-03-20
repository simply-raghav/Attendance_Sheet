const express = require('express');
const router = express.Router();

// database connection
const config = require('../conn')
const connection = config.connection

// bcryptjs package for password hashing and encryption
const bcrypt = require('bcryptjs');

// import validators
const { body, validationResult } = require('express-validator');

// JSON Web Token to generate unique Token for user
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');
// Signature Key
const AUTH_KEY = "MYNameISRahul@6820";

// api for login of teacher
router.post("/login-teacher",
    // body(fieldname, errorMsg)
    [
        body("email", "Enter valid email").isEmail(),
        body("password", "password min length 5").isLength({ min: 5 })
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body

        let sql = `select teacher_id, teacher_name, email_id, password from teacher_tb where email_id='${email}'`

        connection.query(sql, async (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }
            
            if (result.length > 0) {
                const passwordMatch = await bcrypt.compare(password, result[0].password);
                if (!passwordMatch) {
                    return res.status(400).json({ success: false, error: "Please Login using correct Credentials" });
                }

                // If Login Successful Generate new Token
                // Retrieving the unique id from database which is generated automatically by mongoDB
                const data = {
                    user: {
                        teacher_id: result[0].teacher_id,
                    }
                }

                // After successful login authToken is generated and sended to user
                const authToken = jwt.sign(data, AUTH_KEY);
                // console.log(authToken);

                // delete result[0]["password"]
                delete result[0].password
                res.send({ success: true, msg: "teacher login successful", result, authToken })
                return
            } else {
                res.send({ msg: "no teacher found" })
                return
            }
        })
    })



// api for updating the teacher password 
// headers: {auth-token} 
// body: {password} (new password)
// router.post("/update-teacher-password",
    router.post("/update-teacher-password", fetchuser,
    // body(fieldname, errorMsg)
    [
        body("password", "password min length 5").isLength({ min: 5 })
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // const { teacher_id, password } = req.body
        const { password } = req.body
        const { teacher_id } = req.user

        let sql = `select count(*) from teacher_tb where teacher_id='${teacher_id}'`

        connection.query(sql, async (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }
            if (result.length > 0) {
                // Encrypting the password
                const salt = await bcrypt.genSalt(10);
                const secPassword = await bcrypt.hash(password, salt);

                let sql = `update teacher_tb set password="${secPassword}" where teacher_id=${teacher_id}`

                connection.query(sql, (err, result) => {
                    if (err) {
                        console.log(err.sqlMessage)
                        res.send({ success: false, err })
                        return
                    }

                    if (result) {
                        res.send({ success: true, msg: "password update successful", result })
                        return
                    }
                })
            } else {
                res.send({ msg: "no teacher found" })
                return
            }
        })
    })

// all the subjects teached by a teacher
router.get("/teacher-subjects", fetchuser,
    // body(fieldname, errorMsg)
    [
        body("teacher_id", "teacher id is number").isNumeric(),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req.user);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { teacher_id } = req.user

        const sql = `select subject_name, subject_code, course, dept from subject_tb where subject_code in(select subject_code from teacher_subjects_tb where teacher_id=${teacher_id});`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result.length > 0) {
                res.send({ success: true, result })
                return
            } else if (result.length == 0) {
                res.send({ success: true, msg: "no subjects found" })
                return
            }
        })
    })
    


// Export the module
module.exports = router;