const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ordereditemSchema = new Schema ({
    product: {
        name: {
            type: String,
            required: true
        },
        //required: true,
        price: {
            type: Number,
            required: true,
            format: Float64Array,
            description: 'price of one product in Euros, without the Euro sign (€). Euros and cents are in the same float, with cents coming after the decimal point',
            min: 0
        },
        description: {
            type: String
        }
    },
    quality: {
        type: Number,
        min: 1
    }
});


const orderSchema = new Schema({
    customerId: {
        type: String,
        required: true,
        format: mongoose.mongo.ObjectId
    },

    items: {
        type: [],
        required: true,
        minLength: 1,
        items: [ordereditemSchema],
        description: 'Array of order items. Each item must have a COPY of the product information (no image) and the amount of products ordered'
    },

});


orderSchema.set('toJson', { virtuals: false, versionKey: false});

const Order = new mongoose.model('Order', orderSchema);
module.exports = Order;