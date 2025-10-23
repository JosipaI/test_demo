const express = require('express');
const router = express.Router();

router.get('/', async function (req, res, next) {
    res.render('landing', {
        title: 'Landing page',
        user: req.session.user,
    });
});

module.exports = router;