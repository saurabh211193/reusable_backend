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
        virtual: false,

    },
    timestamp: true,
    collection: 'transaction',
};

const transactionSchema = new Schema({
    id: {
        type: String,
    },
    productId: {
        type: String,
    },
    email: {
        type: String,
    },
    cardNo: {
        type: Number,
    },
    name: {
        type: String,
    },
    transactionDate: {
        type: Date,
        default: Date.now(),
    },
}, options);

const transactionModel = Mongoose.model('Transaction', transactionSchema);

export default class Transaction {
    constructor() {
        this.model = transactionModel;
    }
    static get modelName() {
        return transactionModel.modelName;
    }
}