import express from 'express';
import path from 'path'
const app = express();

app.use(express.static('public'));
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

app.get('/', function (req, res) {    
    res.render('index');
});


const hostname = '127.0.0.1';
const port = 4072;
app.listen(port, hostname, () => {
  console.log(`SPA hosted at http://${hostname}:${port}/`);
});