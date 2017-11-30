let mongoose = require('mongoose');

let shorturlSchema = mongoose.Schema({
	"url-original": {
		type: String
	},
	"shortened": {
		type: String
	}
});

let ShortURL = module.exports = mongoose.model('ShortURL', shorturlSchema);
//Node & Express from Scratch
//https://www.youtube.com/watch?v=k_0ZzvHbNBQ&list=PLillGF-RfqbYRpji8t4SxUkMxfowG4Kqp