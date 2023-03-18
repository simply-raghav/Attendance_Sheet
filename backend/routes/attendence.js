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


// api for getting the attendence details of particular student in particular subject
router.get("/attendence",
    [
        body("student_id", "enter valid student_id").isNumeric(),
        body("subject_code", "Enter subject code of length 7").isLength({ min: 7, max: 7 }),
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req.query);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { student_id, subject_code } = req.query

        let sql = `select student_id, subject_code, teacher_id, date, present from attendance_tb where subject_code='${subject_code}' and student_id=${student_id}`
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


router.post("/add-attendence",
    // validation not done as we are getting the array of students and 
    // for that purpose we need to check validation for each student
    // [
    //     body("student_id", "enter valid student id").isNumeric(),
    //     body("subject_code", "enter valid subject code").isLength({min:7, max:7}),
    //     body("teacher_id", "enter valid teacher id").isNumeric(),
    //     body("date", "enter valid date").isDate(),
    //     body("present", "enter valid value").isBoolean(),
    // ],
    async (req, res) => {
        // check for errors in input
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(400).json({ success: false, errors: errors.array() });
        // }


        const { students } = req.body
        let sql = `insert into attendance_tb(student_id, subject_code, teacher_id, date, present) values`

        for (let i = 0; i < students.length; i++) {
            const { student_id, subject_code, teacher_id, date, present } = students[i]
            sql += `(${student_id}, '${subject_code}', ${teacher_id}, '${date}', ${present})`
            if (i != students.length - 1) sql += ", "
        }

        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
            }

            if (result) {
                console.log(result)
                res.send({ success: true, msg: "attendence added successfully" })
            }


        })
        // res.send(sql)
    })

router.post("/update-attendance", 

async (req, res) => {
    const {students} = req.body
    console.log( );
    // sql = ""
    students.forEach(student => {
        const {student_id, subject_code, teacher_ID, date, present} = student
        sql = `UPDATE attendance_tb SET present = ${present} WHERE student_id=${student_id} AND subject_code = "${subject_code}" AND teacher_ID=${teacher_ID} AND date = "${date}";`
        
        connection.query(sql, (err,result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
            }
    
            if (result) {
                console.log(result)
            }
        })
    });
    
    res.send({ success: true, msg: "attendence added successfully"})
    
})

router.get("/attendance-record",
    [
        body("subject_code", "Enter valid Subject Id").isLength({min:7, max: 7}),
        body("teacher_ID", "Enter valid teacher id").isNumeric(),
        body("date", "Enter valid teacher id").isDate()
        
    ], 
    async (req, res) => {
        const errors = validationResult(req.query);
        if(!errors.isEmpty()){
            return res.status(400).json({success:false, errors: errors.array() });
        }

        const {subject_code, teacher_ID, date} = req.body

        let sql = `SELECT student_regno, student_name, present FROM attendance_tb JOIN student_tb where attendance_tb.teacher_ID=${teacher_ID} AND subject_code="${subject_code}" AND date="${date}" AND student_tb.student_id = attendance_tb.student_id ORDER BY(student_regno); `

        connection.query(sql, (err, result)=>{
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