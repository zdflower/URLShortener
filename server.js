function esUrlValida(url){
    // El formato válido consta de 3 partes: 
    // 1) http o https, 
    // 2) www.algo o algo, y
    // 3) .com u otra extensión

    //regex for url, stackoverflow, coding tutorials 360º
    var urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#&//=]*)?/gi;

    return urlRegex.test(url);
}

function short(url, count, response){

    if(esUrlValida(url)){
        let shorty = String(count + 1);
        // guardar en la base de datos
        console.log("Guardando entrada en db...");

        let newshorturl = new ShortURL();
        newshorturl["url-original"] = url;//original;
        newshorturl.shortened = shorty;

        newshorturl.save(function(err){
            if (err) {
                console.log(err);
            } else {
                //lo envío como respuesta
                response.send({
                    "url-original": newshorturl["url-original"],
                    shortened: newshorturl.shortened
                });      
            }
        });
    } else {
        response.send({
                error: "La url no tiene un formato válido. El formato debe ser similar a: http://www.algo.com" 
        });
    }
}

/* https://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express
*/

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}

// init project
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const url = require('url');

///// base de datos
//Node & Express from Scratch
//https://www.youtube.com/watch?v=k_0ZzvHbNBQ&list=PLillGF-RfqbYRpji8t4SxUkMxfowG4Kqp
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

/* 
https://forum.freecodecamp.org/t/guide-for-using-mongodb-and-deploying-to-heroku/19347
http://lefkowitz.me/thoughts/2016/05/05/men-stack-building-a-url-shortener-with-mongodb-express-and-node-js/
https://forum.freecodecamp.org/t/how-to-connect-glitch-to-mlab/155517
*/

var mlab = process.env.MONGODB_URI;
var promise = mongoose.connect(mlab, {
	useMongoClient: true
});


let db = mongoose.connection;

promise.then(function(db){
	console.log('Connected to mongodb');
});

let ShortURL = require('./models/shorturl');
//////

//contenido estático
// http://expressjs.com/en/starter/static-files.html
app.use(express.static(path.join(__dirname, 'public')));

//rutas
// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.render('index');
});

//https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm
// (*) es de un video de tutorials 360º, Code Tech & Caffeine
app.get("/acortar/:dir(*)", function (request, response) {
    console.log("Acortando...");
    //console.log(url.parse(request.url, true));

    let direccion = request.params.dir;

    //uso count para contar la cantidad de "documentos" que hay en la colección de la base de datos, porque voy a usar ese número para generar las url acortadas.
    ShortURL.count({}, function(err, cant){
        if (err) throw err;
        short(direccion, cant, response);
    });
});


//ruta para ir de la url acortada a la original

app.get('/:url', function(request, response){
  	//ver si url está en la base de datos y en ese caso redirigir a la url original
	//si no está mostrar un mensaje
	ShortURL.find({ shortened: String(request.params.url) }, function(err, url_orig){
		console.log("buscando");
        if (err) {
        	console.log("ERROR: " + err);
	    } else if (url_orig.length > 0){
	    	console.log("Redireccionando...");

            //ver si la url_orig empieza con http:// o con https://, sino agregarlo

            //De Code, Tech and Caffeine, coding tutorials 360º
            //usa una expresión regular para ver si hay que agregarle o no http o https a la dirección
            var urlParaTestear = url_orig[0]["url-original"];
            var re = new RegExp("^(http|https)://", "i"); //¿Qué sifnifica la "i"?
            if (re.test(urlParaTestear)) {
                console.log("Ya viene con el protocolo incluido.");
                response.redirect(urlParaTestear);
            } else {
                console.log("Agrego https://");
                response.redirect("https://" + urlParaTestear); 
            }

	    } else {
            console.log("No se encontró la dirección.");
           	console.log(url_orig);
            response.send({
                error: "La url no se encuentra en la base de datos."
        });
	    }
    });
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
