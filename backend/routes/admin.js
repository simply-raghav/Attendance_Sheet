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
// Signature Key
const AUTH_KEY = "MYNameISRahul@6820";

// adding subjects to subject table
router.post("/add-subject",
    // body(fieldname, errorMsg)
    [
        body("subject_code", "Enter subject code of length 7").isLength({ min: 7, max: 7 }),
        body("subject_name", "subject name min length 2").isLength({ min: 2 }),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subject_code, subject_name } = req.body

        const sql = `insert into subject_TB(subject_code, subject_name) values('${subject_code}', '${subject_name}')`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result) {
                res.send({ success: true, msg: "subject added successfully" })
                return
            }
        })
    })

// adding teacher
router.post("/add-teacher",
    [
        body("teacher_name", "enter valid name").isLength({ min: 3 }),
        body("email", "enter valid email").isEmail(),
        body("password", "enter valid password").isLength({ min: 5 }),
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { teacher_name, email, password } = req.body

        // Encrypting the password
        const salt = await bcrypt.genSalt(10);
        const secPassword = await bcrypt.hash(req.body.password, salt);

        const sql = `insert into teacher_TB(teacher_name, email_id, password) values('${teacher_name}', '${email}', '${secPassword}')`
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


// api for sign up of user
router.post("/add-student",
    [
        body("name", "enter valid name").isLength({ min: 3 }),
        body("email", "enter valid email").isEmail(),
        body("reg_no", "enter valid Registration number").isLength({ min: 9, max: 9 }),
        body("course", "enter valid course").isLength({ min: 3 }),
        body("department", "enter valid department").isLength({ min: 3 }),
        body("semester", "enter valid semester").isNumeric({ min: 1, max: 6 }),
        body("password", "enter valid password").isLength({ min: 5 }),
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, reg_no, course, department, semester, password } = req.body

        // Encrypting the password
        const salt = await bcrypt.genSalt(10);
        const secPassword = await bcrypt.hash(password, salt);
        console.log(secPassword);

        // let sql = `select * from student_TB where email=${email}`

        // // check if user is already registered or not
        // connection.query(sql, (err, result) => {
        //     if (err) {
        //         console.log(err.sqlMessage)
        //     } else {
        //         console.log("Email already registered")
        //         res.send(result)
        //         return
        //     }
        // })

        let sql = `insert into student_TB(student_name, email_id, student_regno, course, department, semester, password) values ('${name}', '${email}', '${reg_no}', '${course}', '${department}', '${semester}', '${secPassword}')`
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