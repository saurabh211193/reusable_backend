import Feedback from '../models/feedback';

export class FeedbackService {
    saveFeed({
        condition,
        validatedBody,
    }, done) {
        const _feed = new Feedback();
        _feed.model.findOneAndUpdate(condition, { $set: validatedBody }, { upsert: true }, err => {
            if (err) {
                return done(err);
            }
            return done(null, validatedBody);
        });
    }
}

export default new FeedbackService();