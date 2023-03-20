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



// api for login of student
// body: {email, password}
router.post("/login-student",
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

        let sql = `select * from student_tb where email_id='${email}'`

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
                        student_id: result[0].student_id,
                    }
                }

                // After successful login authToken is generated and sended to user
                const authToken = jwt.sign(data, AUTH_KEY);
                // console.log(authToken);

                delete result[0].password
                res.send({ success: true, msg: "student login successful", result, authToken })
                return
            } else {
                res.send({ msg: "no student found" })
                return
            }
        })
    })



// api for updating the student password 
// headers: {auth-token} 
// body: {password} (new password)
// router.post("/update-student-password",
router.post("/update-student-password", fetchuser,
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

        // const { student_id, password } = req.body
        const { password } = req.body
        const { student_id } = req.user

        let sql = `select count(*) from student_tb where student_id='${student_id}'`

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

                let sql = `update student_tb set password="${secPassword}" where student_id=${student_id}`

                connection.query(sql, (err, result) => {
                    if(err) {
                        console.log(err.sqlMessage)
                        res.send({ success: false, err })
                        return
                    }

                    if(result) {
                        res.send({ success: true, msg: "password update successful", result })
                        return
                    }
                })
            } else {
                res.send({ msg: "no student found" })
                return
            }
        })
    })



// all the subjects taken by a student
router.get("/student-subjects", fetchuser,
    // body(fieldname, errorMsg)
    [
        body("student_id", "student id is number").isNumeric(),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req.user);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { student_id } = req.user

        let sql = `select course, semester from student_tb where student_id=${student_id}`
        let course, semester
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result) {
                course = result[0].course
                semester = result[0].semester
            } else {
                res.send({ msg: "no students found" })
                return
            }

            sql = `select subject_name, subject_code from subject_tb where course='${course}' and semester=${semester}`
            connection.query(sql, (err, result) => {
                if (err) {
                    console.log(err.sqlMessage)
                    res.send({ success: false, err })
                    return
                }

                if (result) {
                    res.send({ success: true, result })
                } else {
                    res.send({ msg: "no subjects found" })
                }
            })
        })
    })



// all the students of particular course and semester
router.post("/students",
    // body(fieldname, errorMsg)
    [
        body("course", "enter valid course name").isLength({ min: 3 }),
        body("semester", "enter semester value").isNumeric(),
        body("mode", "enter valid mode (min, all)").isLength({min: 3, max: 3}),
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { course, semester, mode } = req.body

        let sql = `select student_id, student_regno, student_name, email_id, course, department, semester from student_tb where course='${course}' and semester=${semester} ORDER BY(student_regno)`

        // minify the sql query based on requirement
        if(mode === "min") 
            sql = `select student_id, student_regno, student_name from student_tb where course='${course}' and semester=${semester} ORDER BY(student_regno)`

        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result) {
                res.send({ success: true, result })
                return
            }
        })
    })




// Export the module
module.exports = router;