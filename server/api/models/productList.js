import Mongoose, {
    Schema,
} from 'mongoose';

const options = {
    toJSON: {
        transform: (doc, obj) => {
            delete obj._v;
            delete obj.id;
            return obj;
        },
        virtuals: false,
    },
    timestamp: true,
    collection: 'product',
};

const productSchema = new Schema({
    id: {
        type: String,
    },
    type: {
        type: String,
    },
    name: {
        type: String,
    },
    price: {
        type: Number,
    },
    size: {
        type: String,
    },
}, options);

const productModel = Mongoose.model('Product', productSchema);

export default class Product {
    constructor() {
        this.model = productModel;
    }
    static get modelName() {
        return productModel.modelName;
    }
}
