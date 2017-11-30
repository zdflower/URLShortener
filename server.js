/* USER STORIES
User Story: I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.
User Story: If I pass an invalid URL that doesn't follow the valid http://www.example.com format,
the JSON response will contain an error instead.
User Story: When I visit that shortened URL, it will redirect me to my original link.
*/

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
Instead of concatenating the things together on your own, you could instead use the node.js API for URLs and pass URL.format() the informations from express.

Example:

var url = require('url');

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}
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

//esto lo pedía porque mpromise estaba deprecated 
mongoose.Promise = global.Promise;

var promise = mongoose.connect('mongodb://localhost/shorturls', {
	useMongoClient: true
});

let db = mongoose.connection;

promise.then(function(db){
	console.log('Connected to mongodb');
});

let ShortURL = require('./models/shorturl');
//////


//view templates
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

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
	    }
    });
});


// listen for requests :)
var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

/*
Comentarios:
Luego de poner localhost:3000/acortar/https://eo.wikipedia.org/wiki/Vikipedio:%C4%88efpa%C4%9Do
obtengo el siguiente mensaje:

  Cannot GET /acortar/https://eo.wikipedia.org/wiki/Vikipedio:%C4%88efpa%C4%9Do

Tampoco
  Cannot GET /acortar/https://eo.wikipedia.org/wiki/Vikipedio

Tal vez es por la forma en que el programa interpreta las direcciones.
Me parece que es porque comenté las rutas /acortar/http://:dir y /acortar/https://:dir.
Descomenté lo que había comentado. Ahora no da error, acepta la dirección pero no la guarda con el http:// o https://.
Pero no acepta https://eo.wikipedia.org/wiki/Vikipedio.
Debe ser por cómo parseo la dirección.

Tal vez podría usar en el app.get /acortar/:dir(*) para que acepte todo lo que el usuario ingrese y después se evalúe si cumple los requisitos del formato.
El asterisco funciona ok.
*/
