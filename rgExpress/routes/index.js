var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    console.log("INDEX");
  res.render('index', { layout: false });
});

module.exports = router;
