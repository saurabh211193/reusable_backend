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
    collection: 'userInfo',
};

const userSchema = new Schema({
    socialId: {
        type: String,
    },
    loginType: {
        type: String,
    },
    fN: {
        type: String,
        required: true,
        trim: true,
    },
    lN: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
    },
    pwd: {
        type: String,
        required: true,
    },
    pNo: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
    },
    DOB: {
        type: String,
    },
    img: {
        type: String,
    },

    isDeleted: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    googleInfo: {
        fN: {
            type: String,
            trim: true,
        },
        lN: {
            type: String,
            trim: true,
        },
        img: {
            type: String,
        },
    },
    fbInfo: {
        id: {
            type: String,
        },
        fN: {
            type: String,
            trim: true,
        },
        lN: {
            type: String,
            trim: true,
        },
        img: {
            type: String,
        },
        gender: {
            type: String,
        },
    },
    twitterInfo: {
        id: {
            type: String,
        },
        name: {
            type: String,
            trim: true,
        },
        img: {
            type: String,
        },
    },
    cartInfo: [{
        id: {
            type: String,
        },
        productId: {
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
        quantity: {
            type: Number,
        },
    }],

}, options);

const userModel = Mongoose.model('User', userSchema);

export default class User {
    constructor() {
        this.model = userModel;
    }
    static get modelName() {
        return userModel.modelName;
    }
}