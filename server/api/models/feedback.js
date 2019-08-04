import Mongoose, {
    Schema,
} from 'mongoose';


const options = {
    toJSON: {
        transform: (doc, obj) => {
            delete obj.__v;
            delete obj.id;
            return obj;
        },
        virtuals: false,
    },
    timestamps: true,
    collection: 'userFeedback',
};

const feedSchema = new Schema({
    email: {
        type: String,
    },
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    rating: {
        type: Number,
    },
}, options);

const feedbackModel = Mongoose.model('Feedback', feedSchema);

export default class Feedback {
    constructor() {
        this.model = feedbackModel;
    }
    static get modelName() {
        return feedbackModel.modelName;
    }
}