const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true,
        format: Float64Array,
        description: 'price of one product in Euros, without the Euro sign (€). Euros and cents are in the same float, with cents coming after the decimal point',
        min: 0
    },

    image: {
        type: String,
        description: 'Adding product images to the Web store API and pages is a Level 2 development grader substitute',
        format: decodeURI
    },

    description: {
        type: String
    }
});

productSchema.set('toJSON', { virtuals: false, versionKey: false});

const Product = new mongoose.model('Product', productSchema);
module.exports = Product; 