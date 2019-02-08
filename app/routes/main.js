module.exports = function (app, passport) {
    const express = require("express");
    const mongoose = require('mongoose');
    const {User} = require('../models/user');
    const {Grade} = require('../models/grade');
    const {Class} = require('../models/class');
    const {Semester} = require('../models/semester');
    const {Assignment} = require('../models/assignment');
    const bodyParser = require('body-parser');
    const uuid = require('uuidv4')

    app.use(bodyParser.json()); //get information from html forms
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(express.json());

    app.set('view engine', 'ejs')
////////////////////////////////////////////////
//TESTING ROUTES
///////////////////////////////////////////////
    app.get('/', (req, res) => {
        res.render('index.ejs')
    });

    //show the login form
    app.get('/login', (req, res) => {
        res.render('login.ejs', { message: req.flash('loginMessage') })    
    });

    //show the signup form
    app.get('/signup', (req, res) => {
        res.render('signup', { message: req.flash('signupMessage') })    
    });

    //show semester form
    app.get('/semester', isLoggedIn, (req, res) => {
        res.render('semester', {user:req.user})
    });

    //show class form
    app.get('/class', (req, res) => {
        res.render('class')
    });

///////////////////////////////////////////////////////////////
//TESTING ROUTES IN DB FOR GRADE
/////////////////////////////////////
    app.get('/grades', (req, res) => {
        Grade
            .find()
            .then(result => res.send(result))
            .catch(errorHandler);
    });

    app.post('/grades', (req,res) => {
        // const requiredFields = ['userId']
        // for (let i = 0; i < requiredFields.length; i++) {
        //     const field = requiredFields[i];
        //     if (!(field in req.body)) {
        //         const message = `Missing \`${field}\` in request body`;
        //         console.error(message);
        //         return res.status(400).send(message);
        //     }
        // }
        let userId = req.user._id
        User
            .findById(userId)
            .then(user => {
                if(user){
                    Grade
                        .create({
                            className:req.body.className,
                            assignment: req.body.assignment,
                            grades: req.body.grades,
                            weight:req.body.weight,
                            semester: req.body.semester,
                            user: userId,
                            desiredGrade: req.body.desiredGrade
                        })
                        .then(grade => {
                            res.status(201).json(grade.seralize())
                        })
                        .catch(err => {
                            console.error(err);
                            res.status(500).json({error:'Something went wrong'})
                        })
                }
                else{
                    const message = 'author not found';
                    console.error(message);
                    return res.status(400).send(message)
                }
            })   
    })

    //app.post('/semester', (req,res))

    app.delete('/grades/:gradeId', (req,res) => {
        Grade
            .findByIdAndRemove(req.params.gradeId)
            .then((grade) => res.status(204).end())
            .catch(err => res.status(500).json({message:"Internal server error"}))
    })
    /////////////////////////
    //TESTING FOR USERS
    ////////////////////////////////////////
    app.get('/users', (req, res) => {
        User
            .find()
            .then(result => res.send(result))
            .catch(errorHandler)
    });


/////////////////////////
    //TESTING FOR Individual USERS
////////////////////////////////////////
    app.get('/grades/:userId', (req, res) => {
        Grade
            .find({ user: req.params.userId })
            .then(result => res.send(result))
            .catch(errorHandler);
    });

//edit individual grades
    app.put('/grades/:gradeId', (req, res) => {
        //it first checks if there is a req.params.id and if there is a req.body.id
        //next it checks if the are equal.
        //! if all it is not true than return an error

        const updated = {};
        const updateableFields = ['className', 'assignment', 'grades', 'weight', 'semester'];
        updateableFields.forEach(field => {
            //so its saying {}.className for updated[field]
            //req.body.className
            //updated now becomes req.body
            if (field in req.body) {
                updated[field] = req.body[field];
            }
        })

        Grade
            .findByIdAndUpdate(req.params.gradeId, {$set: updated}, {new:true})
            .then(updatedGrade => res.status(200).json({
                id: updatedGrade.id,
                className: updatedGrade.className,
                assignment:updatedGrade.assignment,
                grades:updatedGrade.grades,
                weight:updatedGrade.weight,
                semester:updatedGrade.semester
            }))
            .catch(err => res.status(500).json({message:"Internal server error"}))
    });

    app.put('/users/:userId', (req, res) => {
        //it first checks if there is a req.params.id and if there is a req.body.id
        //next it checks if the are equal.
        //! if all it is not true than return an error

        const updated = {};
        const updateableFields = ['username', 'password'];
        updateableFields.forEach(field => {
            //so its saying {}.className for updated[field]
            //req.body.className
            //updated now becomes req.body
            if (field in req.body) {
                updated[field] = req.body[field];
            }
        })

        User
           .findById(req.params.userId, (err, user) => {
                user.local.username = req.body.username;
                user.local.password = req.body.password;
                user.save()
                res.json(user)
           })
    })

/////////////////////////
    //Semester
////////////////////////////////////////

    app.get('/semester/all', function(req, res) {
        Semester
            .find()
            .then(result => res.send(result))
            .catch(errorHandler);
    })

    app.get('/api/semester', function (req, res) {
        Semester
            .find({user: req.user._id})
            .then(result => res.send(result))
            .catch(errorHandler);
    })

    app.post('/api/semester', function (req, res) {
        const requiredFields = ['semester']
        for (let i = 0; i < requiredFields.length; i++) {
            const field = requiredFields[i];
            if (!(field in req.body)) {
                const message = `Missing \`${field}\` in request body`;
                console.error(message);
                return res.status(400).send(message);
            }
        }

        User
            .find({user: req.user._id})
                .then(user => {
                    if (user) {
                        console.log(user)
                        Semester
                            .create({
                                semester: req.body.semester,
                                user: req.user._id,
                            })
                            .then(semester => {
                                    res.status(201).json({
                                        user: semester.user,
                                        semester: semester.semester,
                                        semesterId: semester._id
                                    })
                            })
                            .catch(err => {
                                console.error(err);
                                res.status(500).json({ error: 'Something went wrong' })
                            })
                    }
                    else {
                        const message = 'author not found';
                        console.error(message);
                        return res.status(400).send(message)
                    }
                })
        })

    app.put('/api/semester', function (req, res) {
        const updated = {};
        const updateableFields = ['semester'];
        updateableFields.forEach(field => {
            //so its saying {}.className for updated[field]
            //req.body.className
            //updated now becomes req.body
            if (field in req.body) {
                updated[field] = req.body[field];
            }
        })

        Semester
            .findByIdAndUpdate(req.user._id, { $set: updated }, { new: true })
            .then(updatedSemester => res.status(200).json({
                semester: updatedSemester.semester
            }))
            .catch(err => res.status(500).json({ message: "Internal server error" }))
    });
      

    app.delete('/api/semester', function (req, res) {
        Semester
            .findByIdAndRemove(req.body.semesterId)
            .then((semester) => res.status(204).end())
            .catch(err => res.status(500).json({message:"Internal server error"}))
    })

/////////////////////////
//Class
////////////////////////////////////////

    app.get('/class/all', function (req, res) {
        Class
            .find()
            .then(result => res.send(result))
            .catch(errorHandler);
    })

    app.get('/api/class', function (req, res) {
        Class
            .find({ semester: req.semester._id })
            .then(result => res.send(result))
            .catch(errorHandler);
    })

    app.post('/api/class', function (req, res) {
        const requiredFields = ['class']
        for (let i = 0; i < requiredFields.length; i++) {
            const field = requiredFields[i];
            if (!(field in req.body)) {
                const message = `Missing \`${field}\` in request body`;
                console.error(message);
                return res.status(400).send(message);
            }
        }

        Semester
            .findById(req._id)
            .then(semester => {
                if (semester) {
                    Class
                        .create({
                            class: req.body.class,
                            semester: req._id,
                        })
                        .then(classes => {
                            res.status(201).json({
                                class:classes.class,
                                semester:classes.semester,
                                classId: classes._id
                            })
                        })
                        .catch(err => {
                            console.error(err);
                            res.status(500).json({ error: 'Something went wrong' })
                        })
                }
                else {
                    const message = 'semester not found';
                    console.error(message);
                    return res.status(400).send(message)
                }
            })
    })

app.put('/class/:classId', function (req, res) {
    const updated = {};
    const updateableFields = ['class'];
    updateableFields.forEach(field => {
        //so its saying {}.className for updated[field]
        //req.body.className
        //updated now becomes req.body
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    })

    Class
        .findByIdAndUpdate(req.params.classId, { $set: updated }, { new: true })
        .then(updatedClass => res.status(200).json({
            class: updatedClass.class
        }))
        .catch(err => res.status(500).json({ message: "Internal server error" }))
    });


app.delete('/api/class', function (req, res) {
    Class
        .findByIdAndRemove(req.body.classId)
        .then((classes) => res.status(204).end())
        .catch(err => res.status(500).json({ message: "Internal server error" }))
})

/////////////////////////
//Assignment
////////////////////////////////////////

app.get('/assignment', function (req, res) {
    Assignment
        .find()
        .then(result => res.send(result))
        .catch(errorHandler);
})

app.post('/assignment/classId', function (req, res) {
    const requiredFields = ['assignment','weight', 'grade']
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Class
        .findById(req.params.classId)
        .then(classes => {
            if (classes) {
                Assignment
                    .create({
                        assignment: req.body.assignment,
                        weight: req.body.weight,
                        grade:req.body.grade,
                        class: req.params.classId,
                    })
                    .then(assignment => {
                        res.status(201).json(assignment.seralize())
                    })
                    .catch(err => {
                        console.error(err);
                        res.status(500).json({ error: 'Something went wrong' })
                    })
            }
            else {
                const message = 'class not found';
                console.error(message);
                return res.status(400).send(message)
            }
        })
})

app.put('/assignment', function (req, res) {

})

app.delete('/assignment', function (req, res) {

})

}
//route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    //if user is authenticated in the session, carry on
    if (req.isAuthenticated()) {
        return next();
    }
    //if they aren't redirect them to the home page
    else {
        res.redirect('/')
    }
}

//route middleware to make sure a user is logged in as an admin
function isAdmin(req, res, next) {

    //if user is authenticated in the session, carry on
    if (req.isAuthenticated() && req.user.level == 'admin') {
        return next();
    }
    //if they aren't redirect them to the home page
    else {
        res.redirect('/')
    }
}

function errorHandler(err){
    console.error(err);
}

